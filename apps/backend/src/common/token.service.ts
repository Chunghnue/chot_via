import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';
import { DB, type Db } from '../database/database';
import { refreshTokens } from '../database/schema';
import { DomainError } from './domain-error';
import { randomToken, sha256 } from './crypto';

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

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

  /** Xoay vòng refresh token: token cũ bị thu hồi, trả userId để cấp token mới. */
  async consumeRefresh(raw: string): Promise<string | null> {
    const hash = sha256(raw);
    const [row] = await this.db.update(refreshTokens).set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())))
      .returning({ userId: refreshTokens.userId });
    return row?.userId ?? null;
  }

  async revokeRefresh(raw: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, sha256(raw)));
  }
}
