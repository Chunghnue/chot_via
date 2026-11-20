# ROADMAP và trạng thái

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| G0 | Monorepo pnpm, `shared` (Zod DTO, mã, i18n, quy tắc thời gian), design tokens, Docker/Postgres nhúng | ✅ |
| G1 | Backend lõi: cấu hình Zod, DB (Drizzle), phiên khách, OTP (SpeedSMS/eSMS/dev), JWT + refresh cookie, CSRF header, rate limit, Turnstile, lưu file, audit, settings | ✅ |
| G2 | Vía (Thần Tài, gửi điểm, gửi bài, tự động đáp), điểm +1, địa điểm, mẫu 3D | ✅ |
| G3 | Bài viết (Kể khổ/Khoe/Xin vía), thành tích theo khoảng, cảm xúc, bình luận, theo dõi, chặn, báo cáo, lọc từ khóa, "Đang hot" | ✅ |
| G4 | Web public: khung responsive, trang chủ, popup Xin vía, PWA (manifest + service worker + lời chúc offline) | ✅ |
| G5 | Phố 3D (R3F) + 2D fallback + tìm kiếm/lọc, chi tiết điểm, gửi/nhận vía | ✅ (model 3D là bản tạm) |
| G6 | Soạn bài (Kể khổ/Khoe/Xin vía), đăng nhập theo hành động, giữ bản nháp | ✅ |
| G7 | Bảng tin + tương tác + trang bài viết + chia sẻ + báo cáo | ✅ |
| G8 | P1: hồ sơ, tạo/sửa cửa hàng-văn phòng 3D, tự động gửi vía, điểm/cấp độ/huy hiệu, xếp hạng TOP 100, nhiệm vụ/thử thách/sự kiện, thông báo, Google/Facebook/Apple | ✅ (OAuth cần khóa thật) |
| G9 | Web admin: kiểm duyệt, bài viết, bình luận, địa điểm, người dùng, 11 danh mục cấu hình, cài đặt, nhật ký | ✅ |
| G10 | PostHog (sự kiện có kiểu, không dữ liệu cá nhân) | ✅ (cần khóa) |
| G11 | Triển khai Docker + Caddy | ✅ bản nháp (`docs/DEPLOY.md`); chưa build ảnh Docker thật |
| G12 | **Sinh test, chạy một lượt, sửa đến khi xanh** | ⏳ theo yêu cầu: làm sau cùng |

P2 (chưa làm): video, trang trí 3D nâng cao, cá nhân hóa khám phá, tính năng cộng đồng nâng cao, app native.
