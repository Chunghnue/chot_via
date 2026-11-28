# apps/web-admin — Quản trị & kiểm duyệt

React 19 + Vite + React Router 7, RTK Query (`@xin-via/api-client`), Tailwind v4 (dùng chung `packages/ui`). Vai trò: `admin` (toàn quyền) và `moderator` (kiểm duyệt). Đăng nhập OTP như app.

## Cấu trúc `src/`
- `App.tsx` (định tuyến theo vai trò), `layout/admin-layout.tsx` (menu nhóm: Kiểm duyệt · Nội dung & cấu hình · Điểm vía & cộng đồng · Hệ thống).
- `pages/` — `dashboard-page`, `reports-page`, `content-pages` (bài viết có nút ghim, bình luận), `users-page`, `places-page` (cửa hàng: chọn chủ là tài khoản mẫu, upload ảnh bìa), `settings-page` (gồm công tắc "Hiện dữ liệu mẫu"), `audit-page`, `demo-pages` (tài khoản mẫu, bài mẫu), `resource-route` (cấu hình 12 danh mục: loại vía, biểu tượng, mẫu lời chúc, ngành nghề, mẫu 3D, từ khóa nhạy cảm, chủ đề hot, nhiệm vụ, thử thách, sự kiện, cấp độ, huy hiệu).
- `components/resource-page.tsx` — CRUD dùng chung: khai báo cột, trường (`text | textarea | number | switch | select | nullableText | nullableSelect | datetime | image | tags`), schema Zod và 4 hook RTK; có `ImageInput` upload ảnh.

## Thêm một danh mục mới
1. Thêm Zod `…InputSchema` vào `packages/shared/src/schemas/admin.ts` và vào `ADMIN_RESOURCES`; (cần bảng DB thì **hỏi chủ dự án trước**).
2. Đăng ký ở `apps/backend/.../admin-catalog.service.ts` (registry).
3. Thêm `crud(...)` vào `packages/api-client/src/endpoints/admin.ts` và xuất hook.
4. Thêm trang ở `resource-route.tsx`, mục menu ở `admin-layout.tsx`, chữ ở `packages/shared/i18n/vi/admin.json`.
