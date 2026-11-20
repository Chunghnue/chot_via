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
  PUBLIC_WEB_URL: z.string().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().default('http://localhost:3000'),
  SMS_PROVIDER: z.enum(['dev', 'speedsms', 'esms']).default('dev'),
  DEV_FIXED_OTP: z.string().regex(/^\d{6}$/).default('123456'),
  SPEEDSMS_ACCESS_TOKEN: optional,
  SPEEDSMS_SENDER: optional,
  ESMS_API_KEY: optional,
  ESMS_SECRET_KEY: optional,
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
});

export type Env = z.infer<typeof EnvSchema>;

/** Chỉ đọc process.env tại đây; kiểm tra bằng Zod ngay khi khởi động. */
export const env: Env = EnvSchema.parse(process.env);
