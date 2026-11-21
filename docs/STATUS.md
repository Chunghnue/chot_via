# Trạng thái dự án (cập nhật 19/11/2026)

## Đã xong (P0 + P1)
Trang chủ, Xin vía Thần Tài (khách + thành viên), Phố 3D (cảnh ảnh nhiều lớp), chi tiết cửa hàng/sale, gửi vía + phản hồi tự động, bảng tin chung, Kể khổ/Khoe, đăng nhập OTP theo hành động (+OAuth chưa thử), bình luận/cảm xúc/lưu/chia sẻ/báo cáo/chặn, hồ sơ, tạo cửa hàng, Sự kiện & Thử thách, bảng xếp hạng, thông báo, PWA, web admin (kiểm duyệt, 12 danh mục, tài khoản/bài mẫu, ghim bài, cài đặt).

## Chưa kiểm / cần dịch vụ thật
SpeedSMS/eSMS, Google/Facebook/Apple OAuth, Cloudflare R2, Turnstile, PostHog, Sentry, Redis. Chưa thử trên thiết bị thật (mới giả lập kích thước trong Chrome).

## Còn lệch thiết kế / việc chưa làm
- Trang chủ ở iPad Pro ngang 1366 px vẫn có menu trái (theo bố cục desktop); ảnh iPad #15 không có menu trái ở cỡ iPad thường (1024–1279 px, đã đúng).
- Admin: chưa có thứ tự kéo thả cho bài ghim.
- Triển khai (Docker + Caddy): đã có Dockerfile, `docker-compose.prod.yml`, Caddyfile, sao lưu, hướng dẫn `docs/DEPLOY.md`. Chưa chạy `docker build/up` thật (cần Docker Desktop bật) và chưa thử trên máy chủ thật.

## Bảng tin cộng đồng ở trang chủ theo ảnh thiết kế 19/11/2026
Khung ngoài (dưới 1280 px), hàng 4 chip một dòng, nút sắp xếp dạng icon ở hàng tiêu đề (dưới 1280 px; desktop giữ ô chọn), thẻ bài gọn có cặp icon cảm xúc, icon chia sẻ mũi tên, ảnh bên phải lớn hơn. Giữ chip "Khoe deal" (không phải "Xin vía"), nhãn "Kể khổ" và nút "Gửi vía". Dữ liệu mẫu: chức danh Lan Anh là "Chủ quán Café".

## Hero điện thoại theo ảnh thiết kế 19/11/2026
Đã làm (chỉ dưới 768 px, iPad dọc trở lên giữ bố cục cũ): chữ tiêu đề xanh viền trắng, pill vàng viền trắng, Thần Tài nửa người, tia sáng, đồng xu bay, nút bóng viền trắng + vàng có vầng sáng, bàn tay (SVG vẽ tạm), chú thích có ✨. Còn thiếu ảnh bàn tay 3D thật và lớp người đi bộ (xem `docs/CAN-CHU-DU-AN-CUNG-CAP.md`). Desktop giữ theo ảnh #14.

## Đã nhận từ chủ dự án (bàn giao 19/11/2026)
Bảng màu HEX chính thức (đã áp vào `theme.css`, thêm `--color-on-gold` cho chữ trên nền vàng), bộ ảnh mới (51 ảnh WebP + 3 icon PWA, đã tối ưu cho web), 7 cấp độ và 9 huy hiệu (đã nạp vào seed và database dev; admin chỉnh được).

## Chờ chủ dự án
Khóa dịch vụ thật (SMS, OAuth, R2, Turnstile, PostHog, Sentry) và máy chủ thật để triển khai.

## Kiểm thử (G12) — xong
278 test xanh: Vitest 149 (shared 36, API 87, giao diện 26) + E2E 127 (4 cỡ màn hình + admin, gồm UAT-09/UAT-10) + E2E bản production 2 (PWA, service worker, chạy offline). Chi tiết và cách chạy: `docs/TEST-REPORT.md` (`pnpm test`, `pnpm test:e2e`, `pnpm test:e2e:prod`). Quy tắc: viết và chạy toàn bộ một lượt, sửa đến khi xanh.

## Thành phố 3D mặc định (21/11/2026)
- Xong: hero trang chủ và `/pho-3d` là thành phố 3D (`CityView`), bỏ poster và nút "Ghé phố 3D"; cắt/tách nền thêm 25 hình vào `public/images/pho/`; điều khiển kéo xoay, đi tới/lui, phóng to/thu nhỏ; bấm cửa hàng mở thẻ điểm, bấm Thần Tài mở hộp xin vía; chỉ `typecheck`, chưa chạy test.
- Còn lại: viết/chạy lại test (e2e cũ có thể còn tìm nút "Ghé phố 3D"/"Về ảnh phố"); đo FPS và dung lượng tải trên điện thoại, iPad thật; kiểm 2K/4K; ảnh nguồn nhỏ nên Nhà thuốc và đồ trang trí hơi mềm; xóa `GlbStreetView` nếu admin không cần xem trước GLB nữa.
- Xoay 360° (Cách A) xong: kéo/nút xoay đủ vòng, mọi hình luôn hướng về người xem; khung `CITY_GLB_OVERRIDES` sẵn để cắm model GLB thật (đã thử bằng Quán Cafe GLB cũ rồi trả về trống). Test e2e đã cập nhật theo luồng xin vía một chạm (thẻ lời chúc, khóa bấm đúp) và hero 3D; chạy lại toàn bộ sau khi làm 360°.


## Đốt vía và Thỉnh Thần Tài (21/11/2026)
- Xong: hai nút mới (chỉ khi đăng nhập) thay Gửi vía/Nhận vía; chưa có cửa hàng thì dẫn đi tạo, tạo xong hiện hộp nút nổi bật; cảnh Thỉnh Thần Tài 20 giây và Đốt vía 10 giây trong thành phố 3D ở trang chủ và Phố 3D; phụ đề, thẻ lời chúc; không đổi database, không cộng điểm, không giới hạn lượt. Test: Vitest (slice) + `e2e/ritual.spec.ts`.
- Còn lại: kiểm tay trên điện thoại/iPad thật (hiệu năng cảnh 20 giây); ảnh/GLB riêng cho Thần Tài chạy, người đốt vía và cánh cửa nếu muốn đẹp hơn.
