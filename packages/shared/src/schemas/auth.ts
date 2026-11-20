import { z } from 'zod';
import { OAUTH_PROVIDERS } from '../enums';
import { TurnstileTokenSchema } from '../common';
import { MeSchema } from './user';

export const OtpRequestBodySchema = z.object({ phone: z.string().min(8).max(20), turnstileToken: TurnstileTokenSchema });
export type OtpRequestBody = z.infer<typeof OtpRequestBodySchema>;
export const OtpRequestResultSchema = z.object({ resendAfterSec: z.number().int(), expiresInSec: z.number().int() });
export type OtpRequestResult = z.infer<typeof OtpRequestResultSchema>;

export const OtpVerifyBodySchema = z.object({ phone: z.string().min(8).max(20), code: z.string().regex(/^\d{6}$/, 'invalid_string') });
export type OtpVerifyBody = z.infer<typeof OtpVerifyBodySchema>;

export const AuthSessionSchema = z.object({ accessToken: z.string(), expiresInSec: z.number().int(), user: MeSchema, isNewUser: z.boolean() });
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const OAuthParamSchema = z.object({ provider: z.enum(OAUTH_PROVIDERS) });
export const OAuthStartQuerySchema = z.object({ returnTo: z.string().max(300).optional() });
export const OAuthCallbackQuerySchema = z.object({ code: z.string().optional(), state: z.string().optional(), error: z.string().optional() });
