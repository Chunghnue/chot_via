import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';
import { DB, type Db } from '../database/database';
import { refreshTokens } from '../database/schema';
import { DomainError } from './domain-error';
import { randomToken, sha256 } from './crypto';

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
/** Khoảng thời gian (ms) một refresh token vừa xoay vẫn dùng được thêm một lần, cho trường hợp hai ứng dụng web làm mới phiên cùng lúc. */
const REFRESH_REUSE_GRACE_MS = 30_000;

@Injectable()
export class TokenService {
  constructor(@Inject(DB) private readonly db: Db) {}

  get accessTtlSec(): number {
    return env.ACCESS_TOKEN_TTL_MIN * 60;
  }

  signAccess(userId: string): Promise<string> {
    return new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt()
      .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MIN}m`).sign(secret);
  }

  /** Trả userId nếu token còn hạn; token hỏng/hết hạn → AUTH_TOKEN_EXPIRED để frontend tự refresh. */
  async verifyAccess(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      if (!payload.sub) throw new DomainError('AUTH_TOKEN_EXPIRED');
      return payload.sub;
    } catch {
      throw new DomainError('AUTH_TOKEN_EXPIRED');
    }
  }

  async createRefresh(userId: string): Promise<string> {
    const raw = randomToken(48);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    await this.db.insert(refreshTokens).values({ userId, tokenHash: sha256(raw), expiresAt });
    return raw;
  }

  /**
   * Xoay vòng refresh token: token cũ bị thu hồi, trả userId để cấp token mới.
   * Web công khai và web admin dùng chung cookie `cv_rt`, nên hai nơi có thể làm mới gần như cùng lúc bằng cùng một token:
   * token vừa bị thu hồi trong vòng `REFRESH_REUSE_GRACE_MS` vẫn được chấp nhận để cả hai nơi cùng giữ được phiên.
   */
  async consumeRefresh(raw: string): Promise<string | null> {
    const hash = sha256(raw);
    const now = new Date();
    const [row] = await this.db.update(refreshTokens).set({ revokedAt: now })
      .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)))
      .returning({ userId: refreshTokens.userId });
    if (row) return row.userId;
    const [recent] = await this.db.select({ userId: refreshTokens.userId }).from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, hash), gt(refreshTokens.revokedAt, new Date(now.getTime() - REFRESH_REUSE_GRACE_MS)), gt(refreshTokens.expiresAt, now)))
      .limit(1);
    return recent?.userId ?? null;
  }

  /** Đăng xuất: đặt mốc thu hồi về quá khứ xa để token không được hưởng khoảng cho phép dùng lại của việc xoay vòng. */
  async revokeRefresh(raw: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revokedAt: new Date(0) }).where(eq(refreshTokens.tokenHash, sha256(raw)));
  }
}
