# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Xin Vía

Cộng đồng giải trí cho chủ kinh doanh và nhân viên sale (Responsive Web + PWA, phạm vi P0 + P1). Cốt lõi: **Xin vía Thần Tài** (không cần đăng nhập), **Phố 3D** (ghé phố – gửi vía – nhận vía), **một bảng tin chung** (Kể khổ + Khoe doanh thu/Deal), bảng xếp hạng, thử thách, hồ sơ, tạo cửa hàng 3D. Không phải phần mềm quản lý bán hàng.

**Đọc trước khi làm:** `docs/DECISIONS.md` (quyết định đã chốt) → `docs/STATUS.md` (đang làm gì, còn gì) → `docs/ARCHITECTURE.md` (kiến trúc) → `docs/DESIGN-REFERENCE.md` (ảnh nào là chuẩn). **Không tự đổi quyết định đã chốt, không suy diễn nghiệp vụ**: chỗ nào tài liệu không nói thì hỏi chủ dự án.

## Bản đồ dự án
```
apps/backend      NestJS 12 (Fastify) + Drizzle/PostgreSQL (+Redis tùy chọn)   :3001   → apps/backend/CLAUDE.md
apps/web-public   Next.js 16 (PWA), Redux Toolkit, Tailwind v4                 :3000   → apps/web-public/CLAUDE.md
apps/web-admin    React 19 + Vite + React Router (quản trị/kiểm duyệt)         :5173   → apps/web-admin/CLAUDE.md
packages/shared   Zod DTO · mã phản hồi · quy tắc thời gian · i18n (chữ hiển thị) → packages/shared/CLAUDE.md
packages/api-client  RTK Query có kiểu (baseApi + injectEndpoints)             → packages/api-client/CLAUDE.md
packages/ui       theme.css (màu/font DUY NHẤT) + component Tailwind/Radix     → packages/ui/CLAUDE.md
packages/scene-3d Thành phố 3D từ hình tách nền (CityView, dùng ở trang chủ và /pho-3d, không có poster; hình ở public/images/pho/, bố cục ở city-assets.ts); GlbStreetView (GLB) chỉ còn cho xem trước trong admin
docs/             DEPLOY · CAN-CHU-DU-AN-CUNG-CAP · DECISIONS · STATUS · ARCHITECTURE · DESIGN-REFERENCE · ROADMAP · DESIGN-SYSTEM · ASSET-PROMPTS · reference/
```
pnpm workspaces, TypeScript strict, Node ≥ 24, `pnpm@12`. Tên gói: `@xin-via/<tên>`.

## Lệnh thường dùng
| Việc | Lệnh |
|---|---|
| Cài đặt | `pnpm install` |
| Postgres nhúng (thay Docker; giữ cửa sổ mở) | `pnpm db:embedded` |
| Migration / dữ liệu khởi tạo + mẫu | `pnpm db:migrate` · `pnpm db:seed` (chạy lần lượt `seed.ts` → `seed-demo-content.ts` → `seed-home.ts`; chỉ dữ liệu trang chủ: `pnpm db:seed:home`) |
| Sinh migration từ schema Drizzle | `pnpm --filter @xin-via/backend db:generate` (chỉ sau khi chủ dự án duyệt thay đổi DB, xem quy tắc 7) |
| Chạy | `pnpm dev:backend` · `pnpm dev:web` · `pnpm dev:admin` |
| Kiểm kiểu toàn bộ + giới hạn 300 dòng/file | `pnpm typecheck` (kiểu từng gói: `pnpm --filter <gói> typecheck`; chỉ kiểm dòng: `pnpm check:size`) |
| Test | `pnpm test` (Vitest) · `pnpm test:e2e` (Playwright) · `pnpm test:e2e:prod` (PWA/offline trên bản `next build`) · `pnpm test:all` |
| Build | `pnpm build` |
| Reset DB dev | `pnpm --filter @xin-via/backend db:reset` rồi migrate + seed |
| Bản trắng như mới deploy (chỉ cấu hình hệ thống, bỏ cửa hàng/nhiệm vụ/thử thách mẫu; áp dụng một lần, đánh dấu `baseline_applied`) | `pnpm db:reset:baseline` |
| Bộ dữ liệu mẫu đầy đủ theo thiết kế (chạy tay, lặp được, không nhân đôi) | `pnpm --filter @xin-via/backend db:seed:sample` |
| Postgres + Redis bằng Docker (thay cho `db:embedded`) | `docker compose up -d` |

`pnpm test` chạy Vitest theo projects (`packages/shared`, `apps/backend`, `apps/web-public`, mỗi nơi có `vitest.config.mts` riêng); Playwright có `e2e/global-setup.ts`/`global-teardown.ts`. Chạy một test: `pnpm vitest run <đường-dẫn-file>` (thêm `-t "<tên test>"` để lọc theo tên) · `pnpm playwright test e2e/<file>.spec.ts` (cấu hình ở `playwright.config.ts`; bản prod ở `playwright.prod.config.ts`, thư mục `e2e-prod/`). Không có lệnh lint riêng; kiểm tra bằng `typecheck` (đã gồm kiểm giới hạn 300 dòng).

**Điều kiện chạy test:** backend/E2E cần Postgres nhúng đang chạy (`pnpm db:embedded`, cổng 5432); global-setup tự tạo lại DB `xinvia_test` và bật API test ở cổng 3101 (E2E thêm web 3100, admin 5273, bản prod 3300), không đụng DB dev. Playwright mặc định trỏ tới `chrome.exe` của Windows, trên macOS/Linux phải đặt `PW_CHROMIUM` (vd. `PW_CHROMIUM="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" pnpm test:e2e`). Dòng "skipped" trong E2E là `test.skip` theo bề rộng màn hình (mỗi test vẫn chạy ở project phù hợp), không phải lỗi. `next build` (E2E prod) tự sửa `apps/web-public/next-env.d.ts`: hoàn lại bằng `git checkout` trước khi commit.

Dev: OTP **không gửi SMS**, mã cố định `123456`. Admin seed: số `0368886999`. OTP bị giới hạn 3 lần/15 phút/số (gặp `AUTH_OTP_RESEND_WAIT` thì đợi hoặc dùng số khác). Web/admin gọi API qua proxy cùng nguồn (`/api`, `/storage`).

## Quy tắc bắt buộc
1. Mọi request/response có Zod DTO trong `packages/shared`; cấm `any`, `as X` (trừ `as const`), kiểu chung chung.
2. Backend **chỉ trả mã** (`ERROR_DEFS`/`SUCCESS_CODES` trong `shared/src/codes.ts`); không viết chữ hiển thị trong backend. Chữ hiển thị chỉ ở `packages/shared/i18n/vi/*.json` (thêm mã mới → thêm câu vào `codes.json`).
3. Màu chỉ ở `packages/ui/src/styles/theme.css`; component chỉ dùng class ngữ nghĩa Tailwind (không viết màu cứng trong code).
4. State: Redux Toolkit chuẩn (slice + selectors, listener middleware, RTK Query trong `packages/api-client`); form dùng React Hook Form + Zod.
5. Ưu tiên logic nghiệp vụ và responsive (mobile · iPad dọc/ngang · desktop · 2K/4K); kiểm tra bằng trình duyệt ở từng mốc, không được có cuộn ngang.
6. Test: không viết/chạy test trong lúc làm chức năng; test sinh và chạy một lượt khi xong toàn bộ chức năng, rồi sửa đến khi xanh. Trong lúc làm chỉ `typecheck`.
7. **Mọi thay đổi cấu trúc database (thêm/sửa cột, thêm bảng, thêm chỉ mục) phải hỏi chủ dự án và được cho phép trước khi làm.**
8. **RESP-01 – một sản phẩm, một hệ thống:** một codebase giao diện, một API/database, một bộ nghiệp vụ cho mọi thiết bị; không tạo chức năng riêng cho Desktop hay Mobile, chỉ đổi cách bố trí theo kích thước. Trạng thái xin vía của thành viên đồng bộ qua máy chủ.
9. Điểm chỉ cho thành viên: +1 từ 3 hành động vía (xin vía Thần Tài, gửi vía cho cửa hàng, gửi vía cho sale), điểm thưởng khi hoàn thành nhiệm vụ (hệ số `reward_points` ở từng nhiệm vụ, admin đặt, thưởng một lần mỗi kỳ; chủ dự án đổi 25/11/2026), và +1 cho chủ bài khi mỗi người khác tương tác lần đầu với bài (thích, thả tim, haha, 6 biểu tượng gửi vía; mỗi người tối đa +1/bài, tối đa 50 điểm/ngày giờ VN; chốt 26/11/2026); không thêm nguồn điểm khác. Không xếp hạng theo tiền, không tick xác minh.
10. Làm **đúng như thiết kế** (`docs/DESIGN-REFERENCE.md`); khi thiết kế mâu thuẫn quyết định đã chốt thì theo quyết định và nêu rõ chỗ lệch cho chủ dự án.
11. **Mỗi file mã nguồn (`.ts`, `.tsx`, `.css`) tối đa 300 dòng** (tính tổng dòng, kể cả dòng trống và chú thích; không áp dụng cho i18n `.json`, migration SQL, file tự sinh). Thêm tính năng làm file vượt thì phải tách (thành phần, hook, hàm tiện ích, dịch vụ riêng) trước khi hoàn thành. File cũ trong `scripts/file-size-allowlist.json` không được dài thêm và không được thêm file mới vào danh sách đó. `pnpm typecheck` và hook pre-commit (`.githooks/`, tự bật khi `pnpm install`) kiểm tra bằng `scripts/check-file-size.mjs`; sửa file lớn xong chạy `pnpm check:size`.

## Điều dễ nhầm
- **Đốt vía / Thỉnh Thần Tài** (hai nút luôn hiện ở trang chủ kể cả khi chưa đăng nhập, bấm vào thì mời đăng nhập; thay "Gửi vía / Nhận vía"): nghi lễ 3D cho cửa hàng của chính mình (10 / 20 giây), chưa có cửa hàng thì dẫn đi tạo; không cộng điểm, không giới hạn lượt, không lưu database (xem `docs/DECISIONS.md`).
- Nút "Xin vía" luôn màu đỏ cam; tiêu đề nút đổi theo `useWishTitle()` (hôm nay → sáng/chiều/tối theo giờ Việt Nam) ở mọi kích thước.
- Menu: Trang chủ · Phố 3D · Bảng tin · Bảng xếp hạng · Sự kiện (không có "Khám phá"). Thanh dưới điện thoại: Trang chủ · Bảng tin · **Xin vía** · Phố 3D · Cá nhân.
- Bảng xếp hạng: tab Cửa hàng/Sale = số vía nhận trong tuần (thứ Hai 00:00 giờ VN); tab Cộng đồng = điểm thành viên (tối đa 100, mặc định hiện 5).
- Đăng bài chỉ có 3 loại (Kể khổ, Khoe doanh thu, Khoe deal). Video là P2 (ẩn). Không có AIBAT, mèo thần tài, vòng quay, tiền ảo.
- Hình trong ứng dụng (Thần Tài, phố, cửa hàng, icon `ic-*`, avatar `av-01..10`, ảnh bài mẫu `bai-*`/`hp-*`/`kk-*`) là ảnh WebP ở `apps/web-public/public/images/`, bộ chính thức do chủ dự án bàn giao 19/11/2026; thay file cùng tên là đổi ảnh, không sửa code. Bảng màu chính thức nằm trong `theme.css` (chữ trên nền vàng dùng `text-on-gold`).
- Dữ liệu mẫu có cờ `is_demo`; công tắc "Hiện dữ liệu mẫu" (cài đặt admin, `showDemoData`) ẩn/hiện chúng trên mọi màn công khai.
- Một số tính năng chưa kiểm với dịch vụ thật (SMS, OAuth, R2, Turnstile, PostHog, Sentry); thiếu khóa thì tự tắt, không làm hỏng luồng chính.
