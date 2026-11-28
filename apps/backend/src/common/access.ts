import { Inject, Injectable, SetMetadata, createParamDecorator, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AccountRole, AccountStatus, MemberRole } from '@xin-via/shared';
import { env } from '../config/env';
import { DB, type Db } from '../database/database';
import { guestSessions, users } from '../database/schema';
import { DomainError } from './domain-error';
import { randomToken, sha256 } from './crypto';
import { TokenService } from './token.service';

export interface AuthUser { id: string; displayName: string; accountRole: AccountRole; status: AccountStatus; memberRole: MemberRole | null }

export interface RequestContext {
  user: AuthUser | null;
  guestHash: string;
  ip: string;
  /** user:<id> hoặc guest:<hash> — khóa chống lặp/giới hạn tốc độ. */
  actorKey: string;
}

declare module 'fastify' {
  interface FastifyRequest { ctx: RequestContext }
}

const AUTH_KEY = 'xv:auth';
const ROLES_KEY = 'xv:roles';
export const GUEST_COOKIE = 'xv_gid';
const GUEST_TTL_DAYS = 30;

/** Mặc định endpoint là công khai (khách dùng được); gắn @Auth() khi cần đăng nhập. */
export const Auth = (): MethodDecorator & ClassDecorator => SetMetadata(AUTH_KEY, true);
export const Roles = (...roles: AccountRole[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
export const Ctx = createParamDecorator((_data: unknown, context: ExecutionContext): RequestContext => context.switchToHttp().getRequest<FastifyRequest>().ctx);

@Injectable()
export class AccessGuard implements CanActivate {
  private readonly touched = new Map<string, number>();

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(DB) private readonly db: Db,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const targets = [context.getHandler(), context.getClass()];
    const requireAuth = this.reflector.getAllAndOverride<boolean | undefined>(AUTH_KEY, targets) === true;
    const roles = this.reflector.getAllAndOverride<AccountRole[] | undefined>(ROLES_KEY, targets);

    const guestHash = this.resolveGuest(req, reply);
    const user = await this.resolveUser(req);
    req.ctx = { user, guestHash, ip: req.ip, actorKey: user ? `user:${user.id}` : `guest:${guestHash}` };

    if ((requireAuth || roles) && !user) throw new DomainError('AUTH_REQUIRED');
    if (roles && user && !roles.includes(user.accountRole)) throw new DomainError('COMMON_FORBIDDEN');
    return true;
  }

  private resolveGuest(req: FastifyRequest, reply: FastifyReply): string {
    let raw = req.cookies[GUEST_COOKIE];
    if (!raw) {
      raw = randomToken(24);
      void reply.setCookie(GUEST_COOKIE, raw, { httpOnly: true, sameSite: 'lax', secure: env.COOKIE_SECURE, path: '/', maxAge: GUEST_TTL_DAYS * 86_400 });
    }
    const hash = sha256(raw);
    this.touchGuest(hash);
    return hash;
  }

  /** Ghi guest_sessions nhưng không quá 1 lần/10 phút/khách để không tốn truy vấn. */
  private touchGuest(hash: string): void {
    const now = Date.now();
    if (now - (this.touched.get(hash) ?? 0) < 600_000) return;
    if (this.touched.size > 20_000) this.touched.clear();
    this.touched.set(hash, now);
    const expiresAt = new Date(now + GUEST_TTL_DAYS * 86_400_000);
    void this.db.insert(guestSessions).values({ anonymousHash: hash, expiresAt })
      .onConflictDoUpdate({ target: guestSessions.anonymousHash, set: { lastSeen: new Date(now), expiresAt } }).catch(() => undefined);
  }

  private async resolveUser(req: FastifyRequest): Promise<AuthUser | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const userId = await this.tokens.verifyAccess(header.slice(7));
    const [row] = await this.db.select({
      id: users.id, displayName: users.displayName, accountRole: users.accountRole, status: users.status, memberRole: users.memberRole,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (!row) throw new DomainError('AUTH_TOKEN_EXPIRED');
    if (row.status === 'banned') throw new DomainError('AUTH_ACCOUNT_BANNED');
    return row;
  }
}

/** Dùng trong service khi route bắt buộc đăng nhập: thu hẹp kiểu `user`. */
export function requireUser(ctx: RequestContext): AuthUser {
  if (!ctx.user) throw new DomainError('AUTH_REQUIRED');
  return ctx.user;
}
