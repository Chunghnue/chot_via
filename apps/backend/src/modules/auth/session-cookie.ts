import type { FastifyReply } from 'fastify';
import { env } from '../../config/env';

export const REFRESH_COOKIE = 'xv_rt';
export const REFRESH_PATH = '/api/v1/auth';

/** Có COOKIE_DOMAIN thì đặt `Domain` để cookie phiên dùng chung giữa web public và admin (tên miền con); đặt và xóa phải cùng Domain + Path. */
const cookieDomain = (): { domain?: string } => (env.COOKIE_DOMAIN === '' ? {} : { domain: env.COOKIE_DOMAIN });

export function setRefreshCookie(reply: FastifyReply, token: string): void {
  void reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: env.COOKIE_SECURE, path: REFRESH_PATH, maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400, ...cookieDomain(),
  });
}

/** Xóa cả cookie có Domain (bản hiện tại) lẫn cookie cũ chỉ thuộc host (đặt trước khi có COOKIE_DOMAIN) để không còn phiên sót. */
export function clearRefreshCookie(reply: FastifyReply): void {
  void reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH, ...cookieDomain() });
  if (env.COOKIE_DOMAIN !== '') void reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
}
