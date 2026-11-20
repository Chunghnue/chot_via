# Ảnh thiết kế chuẩn

Ảnh nằm ở `docs/reference/design/` (bản đã nén). Thiết kế do ChatGPT tạo; **không phải ảnh nào cũng cùng phiên bản** nên mỗi màn chỉ có một ảnh chuẩn dưới đây. SRS tổng hợp: `docs/reference/SRS-v1.1-Tong-Hop.md`; SRS gốc `docs/reference/Chot_Via_SRS_Mobile_Web_v1.docx`.

| Màn | Ảnh chuẩn |
|---|---|
| Trang chủ desktop (header, menu trái, hero, 4 thẻ, bảng tin 2 cột, cột phải) | `01-trang-chu-desktop.jpg` |
| Trang Kể khổ (banner, lọc, thẻ rộng, Chủ đề hot / Bình chọn vui / Top Kể Khổ tuần) | `02-ke-kho-desktop.jpg` |
| iPad ngang (trang chủ), iPad dọc (trang cửa hàng), 8 màn mobile (Bảng tin, Đăng bài mới, Soạn bài, Xin vía chiều nay, Sự kiện & Thử thách, Bảng xếp hạng, Tạo cửa hàng 3D, Cá nhân) | `03-ipad-va-8-man-mobile.jpg` |
| 14 màn mobile (nguồn các popup Xin vía, Gửi vía, Phố 3D…) | `04-14-man-mobile.jpg` |
| Trang chủ mobile, bảng tin chung | `05-…`, `06-…` |
| Tổng hợp mọi kích thước | `00-tong-hop-showcase.png` |

## Chỗ ứng dụng cố ý khác thiết kế (theo quyết định đã chốt)
- Không có "Khám phá" (thay bằng **Bảng tin**); không chữ **AIBAT**; không mèo thần tài, vòng quay, tiền ảo.
- Không "+200 điểm", không tab "Quà tặng", nhiệm vụ không cộng điểm.
- Ẩn tab/nút **Video** (P2). Không dấu ✓ xác minh cạnh số tiền.
- Nút Xin vía luôn đỏ cam (kể cả nút "Nhận vía ngay" ở cột phải); thanh dưới điện thoại nút giữa là **Xin vía**.
- Bảng xếp hạng: Cửa hàng/Sale theo vía nhận trong tuần, Cộng đồng theo điểm thành viên.
- Hai nút mũi tên trên banner phố: chưa làm (thiết kế không nói chức năng).
- Hình là ảnh cắt/xử lý từ ảnh thiết kế (mờ ở màn rất lớn). Muốn nét hơn: xem `docs/ASSET-PROMPTS.md` và thay file trong `apps/web-public/public/images/`.

## Trang chủ — 3 ảnh thiết kế mới (20/11/2026)
Ba ảnh Trang chủ Desktop / iPad ngang / Mobile (ChatGPT, ngay dưới lượt "thiết kế toàn trang và đầy đủ tính năng tương ứng") thay thế `01-trang-chu-desktop.jpg` và `05-trang-chu-mobile.jpg` làm chuẩn cho Trang chủ. Ảnh phố và model 3D nguồn: gói `ChotVia_HighRes_UI_Layers_DevKit` (`pho-3d-hero.png`) và `ChotVia_3D_Production_v2` (`models/*.glb`); đã sao vào `apps/web-public/public/images` và `public/3d/models`. Chi tiết quyết định: xem `DECISIONS.md` mục 20/11/2026.
