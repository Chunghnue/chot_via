import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { normalizeVnPhone, type AuthSession, type OAuthProvider, type OtpRequestBody, type OtpRequestResult, type OtpVerifyBody } from '@xin-via/shared';
import { DomainError } from '../../common/domain-error';
import { safeEqual, sha256 } from '../../common/crypto';
import { RateLimitService } from '../../common/rate-limit.service';
import { TokenService } from '../../common/token.service';
import { TurnstileService } from '../../common/turnstile.service';
import { env } from '../../config/env';
import { DB, type Db } from '../../database/database';
import { authIdentities, otpCodes, otpLocks, users } from '../../database/schema';
import { UsersService } from '../users/users.service';
import { SMS, type SmsProvider } from './sms';

/** Quy tắc OTP đã chốt: 6 số, hiệu lực 5 phút, gửi lại sau 60 giây, tối đa 3 lần/15 phút, sai tối đa 5 lần/mã, khóa 15 phút. */
const OTP_TTL_SEC = 300;
const RESEND_SEC = 60;
const SEND_WINDOW_SEC = 900;
const MAX_SENDS = 3;
const MAX_ATTEMPTS = 5;
const LOCK_SEC = 900;

export interface SessionResult { session: AuthSession; refreshToken: string }

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
    @Inject(TurnstileService) private readonly turnstile: TurnstileService,
    @Inject(SMS) private readonly sms: SmsProvider,
  ) {}

  private hashCode(phone: string, code: string): string {
    return sha256(`${phone}:${code}:${env.JWT_ACCESS_SECRET}`);
  }

  private async assertNotLocked(phone: string): Promise<void> {
    const [lock] = await this.db.select().from(otpLocks).where(eq(otpLocks.phone, phone)).limit(1);
    if (lock && lock.lockedUntil.getTime() > Date.now()) {
      throw new DomainError('AUTH_OTP_LOCKED', { retryAfterSec: Math.ceil((lock.lockedUntil.getTime() - Date.now()) / 1000) });
    }
  }

  async requestOtp(body: OtpRequestBody, ip: string): Promise<OtpRequestResult> {
    const phone = normalizeVnPhone(body.phone);
    if (!phone) throw new DomainError('AUTH_INVALID_PHONE');
    await this.turnstile.assertHuman(body.turnstileToken, ip, true);
    await this.rate.assert(`otp-ip:${ip}`, 10, 3600);
    await this.assertNotLocked(phone);

    const since = new Date(Date.now() - SEND_WINDOW_SEC * 1000);
    const recent = await this.db.select({ createdAt: otpCodes.createdAt }).from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, since))).orderBy(desc(otpCodes.createdAt));
    const latest = recent[0];
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_SEC * 1000) {
      throw new DomainError('AUTH_OTP_RESEND_WAIT', { retryAfterSec: Math.ceil(RESEND_SEC - (Date.now() - latest.createdAt.getTime()) / 1000) });
    }
    const oldest = recent[recent.length - 1];
    if (recent.length >= MAX_SENDS && oldest) {
      throw new DomainError('AUTH_OTP_SEND_LIMIT', { retryAfterSec: Math.ceil(SEND_WINDOW_SEC - (Date.now() - oldest.createdAt.getTime()) / 1000) });
    }

    const code = env.SMS_PROVIDER === 'dev' ? env.DEV_FIXED_OTP : String(randomInt(0, 1_000_000)).padStart(6, '0');
    const [row] = await this.db.insert(otpCodes).values({
      phone, codeHash: this.hashCode(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000),
    }).returning({ id: otpCodes.id });
    try {
      await this.sms.send(phone, code);
    } catch (error) {
      if (row) await this.db.delete(otpCodes).where(eq(otpCodes.id, row.id));
      throw error instanceof DomainError ? error : new DomainError('AUTH_OTP_SEND_FAILED');
    }
    return { resendAfterSec: RESEND_SEC, expiresInSec: OTP_TTL_SEC };
  }

  async verifyOtp(body: OtpVerifyBody): Promise<SessionResult> {
    const phone = normalizeVnPhone(body.phone);
    if (!phone) throw new DomainError('AUTH_INVALID_PHONE');
    await this.assertNotLocked(phone);
    const [otp] = await this.db.select().from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date()))).orderBy(desc(otpCodes.createdAt)).limit(1);
    if (!otp) throw new DomainError('AUTH_OTP_EXPIRED');

    if (!safeEqual(otp.codeHash, this.hashCode(phone, body.code))) {
      const attempts = otp.attempts + 1;
      await this.db.update(otpCodes).set({ attempts }).where(eq(otpCodes.id, otp.id));
      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_SEC * 1000);
        await this.db.insert(otpLocks).values({ phone, lockedUntil }).onConflictDoUpdate({ target: otpLocks.phone, set: { lockedUntil } });
        await this.db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));
        throw new DomainError('AUTH_OTP_LOCKED', { retryAfterSec: LOCK_SEC });
      }
      throw new DomainError('AUTH_OTP_INVALID', { remainingAttempts: MAX_ATTEMPTS - attempts });
    }

    await this.db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));
    await this.db.delete(otpLocks).where(eq(otpLocks.phone, phone));
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (existing) return this.startSession(existing.id, false);
    const [created] = await this.db.insert(users).values({ phone, displayName: `Thành viên ${phone.slice(-4)}` }).returning({ id: users.id });
    return this.startSession(created?.id ?? '', true);
  }

  async loginWithIdentity(provider: OAuthProvider, providerUserId: string, name: string, avatarUrl: string | null): Promise<SessionResult> {
    const [identity] = await this.db.select().from(authIdentities)
      .where(and(eq(authIdentities.provider, provider), eq(authIdentities.providerUserId, providerUserId))).limit(1);
    if (identity) return this.startSession(identity.userId, false);
    const userId = await this.db.transaction(async (tx) => {
      const [u] = await tx.insert(users).values({ displayName: name.slice(0, 40) || 'Thành viên', avatarUrl }).returning({ id: users.id });
      await tx.insert(authIdentities).values({ userId: u?.id ?? '', provider, providerUserId });
      return u?.id ?? '';
    });
    return this.startSession(userId, true);
  }

  private async startSession(userId: string, isNewUser: boolean): Promise<SessionResult> {
    const [u] = await this.db.select({ status: users.status }).from(users).where(eq(users.id, userId)).limit(1);
    if (!u) throw new DomainError('USER_NOT_FOUND');
    if (u.status === 'banned') throw new DomainError('AUTH_ACCOUNT_BANNED');
    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
    const [accessToken, refreshToken, user] = await Promise.all([this.tokens.signAccess(userId), this.tokens.createRefresh(userId), this.users.me(userId)]);
    return { session: { accessToken, expiresInSec: this.tokens.accessTtlSec, user, isNewUser }, refreshToken };
  }

  async refresh(rawToken: string): Promise<SessionResult> {
    const userId = await this.tokens.consumeRefresh(rawToken);
    if (!userId) throw new DomainError('AUTH_REQUIRED');
    return this.startSession(userId, false);
  }

  logout(rawToken: string): Promise<void> {
    return this.tokens.revokeRefresh(rawToken);
  }

  async memberCount(): Promise<number> {
    const [row] = await this.db.select({ n: count() }).from(users).where(sql`true`);
    return row?.n ?? 0;
  }
}
