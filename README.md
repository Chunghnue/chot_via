# Xin Vía

Cộng đồng giải trí cho chủ kinh doanh & nhân viên sale — **Mobile Web / PWA / iPad / Desktop** (P0 + P1).
Vào là xin vía được ngay, không cần đăng nhập. Chỉ đăng nhập (SMS OTP) khi đăng bài, lưu thành tích, tạo cửa hàng 3D…

```
apps/backend     NestJS (Fastify) + Drizzle/PostgreSQL + Redis(tùy chọn)    :3001
apps/web-public  Next.js (PWA) — Redux Toolkit/RTK Query, Tailwind v4        :3000
apps/web-admin   React + Vite — quản trị & kiểm duyệt                       :5173
packages/shared  Zod DTO · mã thông báo · quy tắc thời gian · i18n (chữ hiển thị)
packages/api-client  RTK Query có kiểu (một baseApi, injectEndpoints)
packages/ui      theme.css (màu/font DUY NHẤT) + component Tailwind/Radix
packages/scene-3d    (không còn dùng) cảnh 3D tự dựng cũ
docs/            DECISIONS · STATUS · ARCHITECTURE · DESIGN-REFERENCE · ROADMAP · DESIGN-SYSTEM · reference/ (SRS + ảnh thiết kế)
```

## Chạy thử (Windows/macOS/Linux, Node ≥ 24, pnpm)
```bash
pnpm install
# 1) Database — chọn MỘT:
pnpm db:embedded            # PostgreSQL nhúng (không cần Docker), giữ cửa sổ này mở
#    hoặc: docker compose up -d   (Postgres + Redis)
# 2) Ở cửa sổ khác:
pnpm db:migrate && pnpm db:seed
pnpm dev:backend            # API  http://localhost:3001/api/v1
pnpm dev:web                # Web  http://localhost:3000
pnpm dev:admin              # Admin http://localhost:5173
```
- Web/admin gọi API qua proxy cùng nguồn gốc (`/api`, `/storage`) nên cookie phiên httpOnly hoạt động.
- `.env` đã tạo từ `.env.example`. **Dev:** OTP không gửi SMS, in ra log backend; mã cố định **123456**.
- Tài khoản quản trị (seed): số **0368886999** → OTP 123456 → vào admin `http://localhost:5173`.
- Reset database dev: `pnpm --filter @xin-via/backend db:reset` rồi migrate + seed.
- Production build: `pnpm build` (backend dùng tsup; web `next build`). PWA/service worker chỉ đăng ký ở bản production.

## Cần cấu hình để dùng thật (xem `.env.example`)
SpeedSMS (`SMS_PROVIDER=speedsms`), Cloudflare R2 (`STORAGE_DRIVER=s3`), Redis (`REDIS_URL`), Turnstile, Google/Facebook/Apple OAuth,
PostHog (`NEXT_PUBLIC_POSTHOG_KEY`, EU), Sentry. Chưa có khóa thì các phần này tự tắt, không làm hỏng luồng chính.

## Chờ chủ dự án / đội thiết kế
Bảng màu HEX chính thức, hình Thần Tài/model 3D/icon/logo thật, **ngưỡng cấp độ & điều kiện huy hiệu** (admin nhập, hiện để trống). Xem `docs/DECISIONS.md` mục E.

## Test
Test: `pnpm test` (đơn vị + API + giao diện), `pnpm test:e2e` (Playwright 4 cỡ màn hình); kết quả ở `docs/TEST-REPORT.md`.
Tài liệu cho Claude Code: `CLAUDE.md` ở gốc và trong từng app/gói.
