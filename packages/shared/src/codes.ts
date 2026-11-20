import { z } from 'zod';

const none = z.object({});
const retry = z.object({ retryAfterSec: z.number().int() });
const max = z.object({ max: z.number().int() });

/** Mã lỗi: HTTP status + kiểu tham số. Backend chỉ trả mã; frontend tự ánh xạ câu chữ (`codes.<MÃ>`). */
export const ERROR_DEFS = {
  COMMON_INTERNAL_ERROR: { status: 500, params: none },
  COMMON_VALIDATION_FAILED: { status: 400, params: none },
  COMMON_NOT_FOUND: { status: 404, params: none },
  COMMON_FORBIDDEN: { status: 403, params: none },
  COMMON_RATE_LIMITED: { status: 429, params: retry },
  COMMON_BOT_CHECK_FAILED: { status: 400, params: none },
  AUTH_REQUIRED: { status: 401, params: none },
  AUTH_TOKEN_EXPIRED: { status: 401, params: none },
  AUTH_CSRF_FAILED: { status: 403, params: none },
  AUTH_INVALID_PHONE: { status: 400, params: none },
  AUTH_OTP_RESEND_WAIT: { status: 429, params: retry },
  AUTH_OTP_SEND_LIMIT: { status: 429, params: retry },
  AUTH_OTP_INVALID: { status: 400, params: z.object({ remainingAttempts: z.number().int() }) },
  AUTH_OTP_EXPIRED: { status: 400, params: none },
  AUTH_OTP_LOCKED: { status: 429, params: retry },
  AUTH_OTP_SEND_FAILED: { status: 502, params: none },
  AUTH_ACCOUNT_BANNED: { status: 403, params: none },
  AUTH_PROVIDER_NOT_CONFIGURED: { status: 501, params: none },
  AUTH_PROVIDER_FAILED: { status: 400, params: none },
  USER_NOT_FOUND: { status: 404, params: none },
  USER_SELF_ACTION: { status: 400, params: none },
  PLACE_NOT_FOUND: { status: 404, params: none },
  PLACE_NOT_OWNER: { status: 403, params: none },
  PLACE_TEMPLATE_INVALID: { status: 400, params: none },
  PLACE_CONTENT_BLOCKED: { status: 400, params: none },
  WISH_TEMPLATE_MISSING: { status: 503, params: none },
  WISH_TYPE_INVALID: { status: 400, params: none },
  WISH_MESSAGE_TOO_LONG: { status: 400, params: max },
  WISH_CONTENT_BLOCKED: { status: 400, params: none },
  POST_NOT_FOUND: { status: 404, params: none },
  POST_NOT_OWNER: { status: 403, params: none },
  POST_BODY_TOO_LONG: { status: 400, params: max },
  POST_BODY_EMPTY: { status: 400, params: none },
  POST_MEDIA_TOO_MANY: { status: 400, params: max },
  POST_MEDIA_INVALID: { status: 400, params: none },
  POST_CONTENT_BLOCKED: { status: 400, params: none },
  POST_ROLE_METRIC_MISMATCH: { status: 400, params: none },
  POST_RANGE_INVALID: { status: 400, params: none },
  POST_AMOUNT_REQUIRED: { status: 400, params: none },
  POLL_INVALID: { status: 400, params: none },
  COMMENT_NOT_FOUND: { status: 404, params: none },
  COMMENT_TOO_LONG: { status: 400, params: max },
  COMMENT_CONTENT_BLOCKED: { status: 400, params: none },
  REPORT_DUPLICATE: { status: 409, params: none },
  REPORT_TARGET_NOT_FOUND: { status: 404, params: none },
  MEDIA_TYPE_INVALID: { status: 400, params: none },
  MEDIA_TOO_LARGE: { status: 413, params: z.object({ maxMb: z.number() }) },
  RESOURCE_IN_USE: { status: 409, params: none },
  RESOURCE_DUPLICATE: { status: 409, params: none },
} as const;

export type ErrorCode = keyof typeof ERROR_DEFS;
export type ErrorParams<C extends ErrorCode> = z.infer<(typeof ERROR_DEFS)[C]['params']>;

export function isErrorCode(code: string): code is ErrorCode {
  return code in ERROR_DEFS;
}

/** Mã thành công. */
export const SUCCESS_CODES = [
  'OK', 'CREATED', 'UPDATED', 'DELETED',
  'OTP_SENT', 'LOGIN_SUCCESS', 'LOGOUT_SUCCESS',
  'WISH_RECEIVED', 'WISH_SENT', 'POST_CREATED', 'POST_DELETED', 'COMMENT_CREATED',
  'REPORT_RECEIVED', 'PLACE_CREATED', 'PLACE_UPDATED', 'PROFILE_UPDATED', 'MEDIA_UPLOADED', 'POLL_VOTED',
] as const;
export type SuccessCode = (typeof SUCCESS_CODES)[number];

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    params: z.record(z.union([z.string(), z.number()])).optional(),
    details: z.array(z.object({ field: z.string(), rule: z.string(), params: z.record(z.union([z.string(), z.number()])).optional() })).optional(),
    requestId: z.string(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
