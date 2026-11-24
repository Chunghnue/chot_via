import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');
const optional = z.string().default('');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: optional,
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),
  COOKIE_SECURE: bool,
  /** Tên miền chung của cookie phiên (vd. chotvia.example.com) để web public và admin ở tên miền con dùng chung đăng nhập. Để trống = cookie chỉ thuộc đúng host. */
  COOKIE_DOMAIN: z.string().default('').transform((v) => v.trim().replace(/^\./, '').toLowerCase()),
  PUBLIC_WEB_URL: z.string().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().default('http://localhost:3000'),
  SMS_PROVIDER: z.enum(['dev', 'speedsms', 'esms', 'ghdc']).default('dev'),
  DEV_FIXED_OTP: z.string().regex(/^\d{6}$/).default('123456'),
  SPEEDSMS_ACCESS_TOKEN: optional,
  SPEEDSMS_SENDER: optional,
  ESMS_API_KEY: optional,
  ESMS_SECRET_KEY: optional,
  /** GHDC SMS OTP (chỉ bắt buộc khi SMS_PROVIDER=ghdc). Mật khẩu chỉ đặt trong .env.production trên máy chủ. */
  GHDC_SMS_BASE_URL: z.string().default('').transform((v) => (v.trim() === '' ? 'https://sms.ghdc.vn/api' : v.trim())),
  GHDC_SMS_EMAIL: optional,
  GHDC_SMS_PASSWORD: optional,
  GHDC_SMS_CP_ID: optional,
  GHDC_SMS_TEMP_ID: optional,
  TURNSTILE_SECRET: optional,
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  S3_ENDPOINT: optional,
  S3_BUCKET: optional,
  S3_ACCESS_KEY: optional,
  S3_SECRET_KEY: optional,
  S3_PUBLIC_BASE_URL: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  FACEBOOK_APP_ID: optional,
  FACEBOOK_APP_SECRET: optional,
  APPLE_CLIENT_ID: optional,
  APPLE_TEAM_ID: optional,
  APPLE_KEY_ID: optional,
  APPLE_PRIVATE_KEY: optional,
  SENTRY_DSN: optional,
  SEED_ADMIN_PHONE: z.string().default('0900000000'),
  SEED_ADMIN_NAME: z.string().default('Quản trị Chốt Vía'),
}).refine((e) => !(e.NODE_ENV === 'production' && e.SMS_PROVIDER === 'dev'), {
  message: 'SMS_PROVIDER=dev không được dùng ở production (OTP không được ghi log)',
}).superRefine((e, ctx) => {
  if (e.COOKIE_DOMAIN !== '' && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(e.COOKIE_DOMAIN)) ctx.addIssue({ code: 'custom', path: ['COOKIE_DOMAIN'], message: 'COOKIE_DOMAIN phải là tên miền hợp lệ (ví dụ chotvia.example.com)' });
  if (e.SMS_PROVIDER !== 'ghdc') return;
  const required = ['GHDC_SMS_EMAIL', 'GHDC_SMS_PASSWORD', 'GHDC_SMS_CP_ID', 'GHDC_SMS_TEMP_ID'] as const;
  for (const key of required) {
    if (e[key].trim() === '') ctx.addIssue({ code: 'custom', path: [key], message: `${key} là bắt buộc khi SMS_PROVIDER=ghdc` });
  }
  if (!z.string().url().safeParse(e.GHDC_SMS_BASE_URL).success) ctx.addIssue({ code: 'custom', path: ['GHDC_SMS_BASE_URL'], message: 'GHDC_SMS_BASE_URL phải là địa chỉ URL hợp lệ' });
});

export type Env = z.infer<typeof EnvSchema>;

/** Chỉ đọc process.env tại đây; kiểm tra bằng Zod ngay khi khởi động. */
export const env: Env = EnvSchema.parse(process.env);
