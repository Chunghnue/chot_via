# Kiến trúc Xin Vía

## Tổng quan
```
Trình duyệt (web-public / web-admin)
   │  RTK Query (packages/api-client) — mọi phản hồi qua Zod
   ▼
Proxy cùng nguồn  /api → backend :3001 ,  /storage → ảnh đã tải lên
   ▼
NestJS (Fastify): ZodPipe → Controller → Service → Drizzle → PostgreSQL
                          └ RateLimit/Redis(tùy chọn) · SMS · OAuth · Storage(local|S3/R2)
packages/shared = hợp đồng chung (DTO, mã, i18n, quy tắc thời gian) dùng cả hai phía
```

## Luồng dữ liệu & mã
- Request/response đều có Zod schema trong `packages/shared/src/schemas`.
- Backend trả `{code, data, meta?}` hoặc lỗi `{error:{code, params, details, requestId}}`. **Không có chữ hiển thị**; frontend ánh xạ mã → chữ bằng `useCodeMessage()` từ `i18n/vi/codes.json`.
- Phiên: access JWT 15 phút (bộ nhớ) + refresh xoay vòng trong cookie httpOnly `xv_rt` (path `/api/v1/auth`). Khách: cookie `xv_gid` (băm). CSRF: header `x-requested-with: xinvia`.

## Cơ sở dữ liệu (PostgreSQL, Drizzle)
| Nhóm | Bảng |
|---|---|
| Người dùng & đăng nhập | `users` (có `job_title`, `is_demo`), `auth_identities`, `refresh_tokens`, `otp_codes`, `otp_locks`, `guest_sessions` |
| Cấu hình nội dung | `place_categories`, `scene_templates`, `wish_types`, `wish_stickers`, `wish_templates`, `hot_topics`, `sensitive_keywords`, `app_settings` |
| Cửa hàng/văn phòng | `places` (`is_demo`), `place_auto_replies`, `place_likes`, `place_follows`, `place_visits` |
| Bài viết | `posts` (`pinned_at`, `is_demo`), `post_media`, `achievements`, `reactions`, `comments`, `post_shares`, `poll_votes`, `saved_posts`, `user_follows`, `user_blocks` |
| Vía & điểm | `wish_events` (nguồn: deity/place/post; khách dùng `guest_hash`), `point_ledger`, `levels`, `badges` |
| Gamification | `missions`, `challenges`, `events` |
| Kiểm duyệt & hệ thống | `reports`, `notifications`, `audit_logs` |

Cấp độ/huy hiệu tính theo điểm (ngưỡng do admin nhập, để trống mặc định). Bảng xếp hạng tuần của cửa hàng/sale tính trực tiếp từ `wish_events` từ thứ Hai 00:00 giờ VN.

## Nghiệp vụ then chốt
- **Xin vía Thần Tài** (`POST /wishes/deity`): khách dùng được; tiêu đề theo thứ tự lần bấm + giờ VN (`resolveWishTitleCode`); lời chúc chọn từ `wish_templates` theo buổi, tránh lặp mẫu vừa nhận; mất mạng thì dùng gói lời chúc offline (không khẳng định đã ghi nhận). Thành viên được +1 điểm.
- **Gửi vía cho cửa hàng/sale** (`POST /places/:id/wishes`): có phản hồi tự động nếu chủ bật (nhãn "phản hồi tự động"), nếu không thì phản hồi hệ thống trung tính; +1 điểm cho thành viên.
- **Bảng tin**: một feed duy nhất; lọc Tất cả/Kể khổ/Khoe doanh thu/Khoe deal; sắp Mới nhất / Đang quan tâm (điểm hot có trọng số, giảm theo thời gian) / Theo dõi; ghim bài lên đầu (`pinned=first`).
- **Kiểm duyệt**: đăng trước kiểm sau + lọc từ khóa; khách được báo cáo; 7 lý do; admin/moderator xử lý trong web admin.
- **Giới hạn tốc độ**: OTP (6 số, 5 phút, gửi lại sau 60 giây, tối đa 3 lần/15 phút, 5 lần sai khóa 15 phút), xin vía, đăng bài, bình luận, báo cáo.

## Frontend
- Redux Toolkit chuẩn (`store/store.ts`, slice trong `features/`, listener middleware lưu bản nháp/bộ đếm vào localStorage). Dữ liệu máy chủ chỉ qua RTK Query.
- Khung trang: `components/layout/app-shell.tsx` (menu trái ở xl, cột phải ở lg trở lên, thanh dưới ở điện thoại).
- Cảnh Phố: ảnh nền + ảnh cửa hàng/Thần Tài xếp lớp (`components/home/street-stage.tsx`), dùng ở trang chủ và `/pho-3d`.
- PWA: `app/manifest.ts` (màu đọc từ theme.css) + `public/sw.js`.
