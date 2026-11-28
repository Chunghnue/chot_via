import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  OAuthCallbackQuerySchema, OAuthParamSchema, OAuthStartQuerySchema, OtpRequestBodySchema, OtpVerifyBodySchema, type OAuthProvider,
  type OtpRequestBody, type OtpVerifyBody,
} from '@xin-via/shared';
import { z } from 'zod';
import { Ctx, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { ZodPipe } from '../../common/zod.pipe';
import { env } from '../../config/env';
import { AuthService, type SessionResult } from './auth.service';
import { OAuthService } from './oauth.service';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './session-cookie';

const CSRF_HEADER = 'x-requested-with';
const CSRF_VALUE = 'xinvia';

/** Refresh/logout dựa vào cookie nên bắt buộc header tùy biến (trình duyệt không cho form chéo trang gửi) để chống CSRF. */
function assertCsrf(req: FastifyRequest): void {
  if (req.headers[CSRF_HEADER] !== CSRF_VALUE) throw new DomainError('AUTH_CSRF_FAILED');
}

const CallbackBody = z.object({ code: z.string().optional(), state: z.string().optional(), error: z.string().optional(), user: z.string().optional() });

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OAuthService) private readonly oauth: OAuthService,
  ) {}

  @Post('otp/request')
  async requestOtp(@Ctx() ctx: RequestContext, @Body(new ZodPipe(OtpRequestBodySchema)) body: OtpRequestBody) {
    return ok('OTP_SENT', await this.auth.requestOtp(body, ctx.ip));
  }

  @Post('otp/verify')
  async verifyOtp(@Res({ passthrough: true }) reply: FastifyReply, @Body(new ZodPipe(OtpVerifyBodySchema)) body: OtpVerifyBody) {
    const result = await this.auth.verifyOtp(body);
    setRefreshCookie(reply, result.refreshToken);
    return ok('LOGIN_SUCCESS', result.session);
  }

  @Post('refresh')
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    assertCsrf(req);
    const raw = req.cookies[REFRESH_COOKIE];
    if (!raw) throw new DomainError('AUTH_REQUIRED');
    const result = await this.auth.refresh(raw);
    setRefreshCookie(reply, result.refreshToken);
    return ok('OK', result.session);
  }

  /** Khôi phục phiên khi tải trang: luôn trả 200 (data=null nếu khách) để không sinh lỗi 401 gây nhiễu. */
  @Post('session')
  async session(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    assertCsrf(req);
    const raw = req.cookies[REFRESH_COOKIE];
    if (!raw) return ok('OK', null);
    try {
      const result = await this.auth.refresh(raw);
      setRefreshCookie(reply, result.refreshToken);
      return ok('OK', result.session);
    } catch {
      clearRefreshCookie(reply);
      return ok('OK', null);
    }
  }

  @Post('logout')
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    assertCsrf(req);
    const raw = req.cookies[REFRESH_COOKIE];
    if (raw) await this.auth.logout(raw);
    clearRefreshCookie(reply);
    return ok('LOGOUT_SUCCESS', { ok: true as const });
  }

  @Get('oauth/:provider/start')
  async oauthStart(
    @Res() reply: FastifyReply,
    @Param(new ZodPipe(OAuthParamSchema)) params: { provider: OAuthProvider },
    @Query(new ZodPipe(OAuthStartQuerySchema)) query: { returnTo?: string; app?: 'web' | 'admin' },
  ) {
    const state = await this.oauth.signState(params.provider, this.oauth.safeReturnTo(query.returnTo), query.app ?? 'web');
    const url = await this.oauth.authorizeUrl(params.provider, state);
    // Với @Res() không trả lại đối tượng reply (Nest sẽ gửi đè 200 rỗng); chỉ chuyển hướng rồi kết thúc.
    await reply.status(302).redirect(url);
  }

  @Get('oauth/:provider/callback')
  oauthCallbackGet(
    @Res() reply: FastifyReply,
    @Param(new ZodPipe(OAuthParamSchema)) params: { provider: OAuthProvider },
    @Query(new ZodPipe(OAuthCallbackQuerySchema)) query: z.infer<typeof CallbackBody>,
  ) {
    return this.finishOAuth(reply, params.provider, query);
  }

  /** Apple dùng response_mode=form_post nên gọi lại bằng POST. */
  @Post('oauth/:provider/callback')
  oauthCallbackPost(
    @Res() reply: FastifyReply,
    @Param(new ZodPipe(OAuthParamSchema)) params: { provider: OAuthProvider },
    @Body(new ZodPipe(CallbackBody)) body: z.infer<typeof CallbackBody>,
  ) {
    return this.finishOAuth(reply, params.provider, body);
  }

  private async finishOAuth(reply: FastifyReply, provider: OAuthProvider, input: z.infer<typeof CallbackBody>): Promise<void> {
    const { returnTo, app } = await this.oauth.readState(input.state, provider);
    const base = app === 'admin' ? env.PUBLIC_ADMIN_URL : env.PUBLIC_WEB_URL;
    const target = (flag: string): string => `${base}${returnTo}${returnTo.includes('?') ? '&' : '?'}${flag}`;
    if (!input.code || input.error) {
      await reply.status(302).redirect(target('login=failed'));
      return;
    }
    try {
      const profile = await this.oauth.exchange(provider, input.code, input.user);
      const result: SessionResult = await this.auth.loginWithIdentity(provider, profile.providerUserId, profile.name, profile.avatarUrl);
      setRefreshCookie(reply, result.refreshToken);
      await reply.status(302).redirect(target('login=ok'));
      return;
    } catch {
      {
        await reply.status(302).redirect(target('login=failed'));
        return;
      }
    }
  }
}
