# apps/backend — NestJS + Drizzle

API `http://localhost:3001/api/v1`. NestJS 12 chạy trên **Fastify**, ESM, decorator kiểu cũ với `@Inject(...)` tường minh (không dùng metadata). Một module phẳng `app.module.ts` đăng ký mọi controller/service.

## Cấu trúc
- `src/main.ts` — khởi động, CORS, cookie, multipart, helmet, CSRF header.
- `src/config/env.ts` — đọc/validate biến môi trường (Zod).
- `src/common/` — `access.ts` (AccessGuard, `@Auth`, `@Roles`, `@Ctx`), `domain-error.ts` (ném lỗi bằng **mã**), `exception.filter.ts` (bọc `{error:{code,params,details,requestId}}`), `zod.pipe.ts`, `rate-limit.service.ts`, `settings.service.ts` (cài đặt `app` trong DB, cache 10 giây, gộp với `DEFAULT_SETTINGS`), `token.service.ts` (JWT truy cập 15 phút + refresh xoay vòng cookie `cv_rt`), `mappers.ts`, `api.ts` (`ok(code,data)`, `paged`).
- `src/modules/` — `auth` (OTP, OAuth, phiên), `users`, `wishes`, `places`, `posts`, `moderation`, `notifications`, `gamification` (cấp độ, điểm, nhiệm vụ, thử thách), `media` (upload → WebP), `catalog`, `admin` (admin.service, admin-catalog.service CRUD chung, admin-demo.service dữ liệu mẫu).
- `src/database/` — `schema.ts` (Drizzle), `migrate.ts`, `seed.ts` (danh mục, mẫu lời chúc, cửa hàng mẫu), `seed-demo-content.ts` (tài khoản/bài/cửa hàng mẫu cho trang chủ & Kể khổ, nhiệm vụ, thử thách, sự kiện; chạy lặp được). Migration SQL ở `drizzle/` (sinh bằng `drizzle-kit generate`).
- `scripts/` — `embedded-postgres.ts` (Postgres nhúng UTF8), `reset-db.ts`, `generate-pwa-icons.ts`.

## Quy ước
- **Chỉ trả mã.** Thành công: `ok('POST_CREATED', data)` (mã trong `SUCCESS_CODES`). Lỗi: `throw new DomainError('PLACE_NOT_FOUND', params?)` (mã + HTTP status + schema tham số trong `ERROR_DEFS`). Không viết câu chữ trong backend.
- Mọi body/query/param đi qua `ZodPipe(<schema trong packages/shared>)`. Kiểu trả về map sang DTO trong shared.
- CSRF: mọi request ghi cần header `x-requested-with: chotvia`. Khách có cookie `cv_gid` (băm lưu `guest_sessions`).
- Phân quyền: `@Auth()` (cần đăng nhập), `@Roles('admin','moderator')`; phần cấu hình/dữ liệu mẫu trong admin chỉ `admin`.
- Điểm: chỉ `PointsService` cộng +1 (xin vía Thần Tài / gửi vía cửa hàng / gửi vía sale), chỉ cho thành viên, ghi `point_ledger`.
- Cài đặt hệ thống (giới hạn ký tự, nửa đời "hot", ngưỡng rate limit, `showDemoData`…) ở `app_settings.app`, schema `AppSettingsSchema`.
- Dữ liệu mẫu: `users.is_demo`, `posts.is_demo`, `places.is_demo`. Khi `showDemoData=false` các truy vấn công khai (bài, cửa hàng, bảng xếp hạng) loại chúng ra.

## Đổi database
**Phải hỏi chủ dự án trước.** Sau khi được phép: sửa `schema.ts` → `DATABASE_URL=… npx drizzle-kit generate` → `pnpm db:migrate`. Không sửa tay migration đã áp dụng.

## Endpoint chính (tiền tố `/api/v1`)
`GET /home` · `POST /wishes/deity` · `GET /wishes/deity/today` (thành viên) · `GET /wishes/offline-pack` · `GET /places`, `/places/leaderboard`, `/places/random`, `/places/:idOrSlug` · `POST /places/:id/wishes` · `GET/POST /posts`, `/posts/featured-poll`, `/posts/top-story-authors`, `/hashtags/hot`, `/topics/hot` · `GET /leaderboard` · `POST /auth/otp/request|verify`, `/auth/refresh`, `/auth/session`, `/auth/logout` · `/admin/*` (báo cáo, bài, bình luận, người dùng, địa điểm, `/admin/catalog/:resource`, `/admin/demo/users|posts`, `/admin/settings`).
