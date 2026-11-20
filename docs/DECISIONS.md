# DECISIONS — các quyết định đã chốt (không tự đổi)

Nguồn: SRS v1.0 (docx), SRS + thiết kế v1.1 (md), 19 ảnh thiết kế, và các câu trả lời của chủ dự án ngày 19/11/2026.
Thứ tự ưu tiên khi mâu thuẫn: **quyết định đã chốt → thiết kế → SRS v1.1 → SRS v1.0**.

## A. Thống nhất thiết kế và SRS
1. Linh vật chính thức: **Thần Tài** (bỏ Mèo thần tài).
2. Loại bỏ 5 thiết kế mang thương hiệu AIBAT (không dùng logo/thương hiệu AIBAT).
3. Bảng xếp hạng **chỉ theo Vía**, không theo tiền doanh thu.
4. Doanh thu **mặc định ẩn**, chủ cửa hàng tự bật; không % tăng trưởng, không biểu đồ/nhật ký doanh thu.
5. Không dấu tick xanh / xác minh giả. Số liệu luôn là "tự khai".
6. Không vòng quay, xu, kim cương, ví quà, đổi thưởng, cơ chế giống cờ bạc.
7. Kể khổ và Khoe nằm trong **cùng một bảng tin**.
8. Nút giữa thanh điều hướng dưới luôn là **Xin vía**; nút Đăng bài nằm trong bảng tin.
9. Mọi nút Xin vía dùng **đỏ cam** (token `wish`).
10. Test tổng thể chạy một lượt khi xong chức năng (xem "Quy trình kiểm thử").
11. Redux Toolkit cho state dùng chung; React Hook Form + Zod cho form.

## B. Chức năng và kỹ thuật
12. **Không có trang/menu Khám phá.** Tìm kiếm + lọc cửa hàng/văn phòng nằm trong **Phố 3D**.
13. **Cộng đồng** = bảng tin chung toàn trang (`/bang-tin`), không có feed thứ hai.
14. Đăng nhập: SMS OTP (P0); Google/Facebook/Apple (P1); không có tài khoản mật khẩu.
15. OTP: SpeedSMS (eSMS dự phòng); 6 số, hiệu lực 5 phút, gửi lại sau 60 giây, tối đa 3 lần/15 phút, sai tối đa 5 lần/mã, khóa 15 phút. Dev được log OTP / dùng mã cố định; production không log OTP.
16. Điểm P0 do admin tạo (đánh dấu demo, không doanh thu giả); P1 người dùng tự tạo từ mẫu có sẵn.
17. Phạm vi: **P0 + P1** trên Responsive Web + PWA; P2 sau; không làm app native.
18. Điểm: **+1** mỗi lần thành công của (xin vía Thần Tài / gửi vía cửa hàng / gửi vía Sale) — **chỉ thành viên đăng nhập**, khách không được điểm, không cộng bù. Điểm quy ra cấp độ, huy hiệu, xếp hạng. **Ngưỡng cấp độ/huy hiệu chưa chốt → không hard-code, admin cấu hình, mặc định để trống (chờ phê duyệt).** Nhiệm vụ chỉ ghi nhận tiến độ, không cộng điểm.
19. Bảng màu HEX chính thức do đội thiết kế gửi; hiện dùng giá trị tạm trong `theme.css`.
20. Analytics: PostHog Cloud (EU), không cookie, không gửi SĐT/nội dung Kể khổ/số liệu doanh thu.
- Bảng xếp hạng: tối đa **100** thành viên, mặc định hiện **5**, có nút xem thêm.
- Video: **P2** (không làm ở P0/P1). Không có màn chào trước trang chủ.
- Tiêu đề Xin vía: lần đầu "hôm nay", từ lần 2 theo giờ thực VN (05:00–11:59 sáng, 12:00–17:59 chiều, 18:00–04:59 tối); có chế độ campaign tùy chọn.
- Mức thành tích (C5), công thức "Đang được quan tâm" (C6: cảm xúc ×1, bình luận ×2, gửi vía ×1,5, chia sẻ ×3, giảm dần theo thời gian), kiểm duyệt đăng-trước-duyệt-sau (C10), font Baloo 2 + Be Vietnam Pro, shadcn/ui-style (Radix + Tailwind).

## C. Quy tắc code do chủ dự án đặt ra
- Mọi request/response khai báo kiểu chi tiết (Zod DTO trong `packages/shared`), cấm `any`/kiểu chung chung.
- **Backend chỉ trả mã** (`{ code }` / `{ error: { code, params } }`); frontend tự ánh xạ chữ qua `packages/shared/i18n`. Nội dung admin soạn (lời chúc, tên ngành…) trả dạng dữ liệu.
- **Màu chỉ khai báo một nơi**: `packages/ui/src/styles/theme.css`. **Chữ hiển thị chỉ một nơi**: `packages/shared/i18n/vi/*.json`.
- Redux Toolkit đúng cấu trúc chuẩn (configureStore, createSlice + selectors, createListenerMiddleware, RTK Query `createApi`/`injectEndpoints`); Tailwind v4 `@theme`.
- Ưu tiên logic nghiệp vụ và responsive mọi kích thước màn hình.

## D. Giá trị khởi tạo do đội dev đặt (admin chỉnh được tại Cài đặt hệ thống)
Giới hạn ký tự (Kể khổ/Khoe 500, bình luận 300, lời chúc gửi vía 120), tối đa 4 ảnh/bài (5 MB/ảnh), tối đa 5 hashtag, nửa đời điểm "Đang hot" 24 giờ / cửa sổ 7 ngày, giới hạn tốc độ chống spam, ngưỡng đưa báo cáo lên hàng chờ ưu tiên (3). Đây là mặc định kỹ thuật, **không phải nghiệp vụ đã duyệt**.

## E. Chưa được cung cấp (đang dùng giá trị tạm)
- Bảng màu HEX chính thức, hình Thần Tài/model 3D/icon/logo thật → `theme.css`, `packages/ui/src/components/brand.tsx`, `packages/scene-3d` (thay một chỗ).
- Ngưỡng cấp độ, điều kiện huy hiệu (admin nhập).
- Tài khoản/báo giá SpeedSMS, Cloudflare R2, Turnstile, Google/Facebook/Apple, PostHog, Sentry, hạ tầng triển khai, tên miền.


## Quyết định bổ sung (19/11/2026)
1. Thanh dưới điện thoại: Trang chủ · Bảng tin · **Xin vía** (nút giữa) · Phố 3D · Cá nhân. Sự kiện và Bảng xếp hạng nằm trong menu Cá nhân và trang chủ.
2. Bảng xếp hạng: tab **Cửa hàng** và **Sale** xếp theo số vía nhận trong tuần (reset thứ Hai 00:00 giờ Việt Nam, tính từ `wish_events`); tab **Cộng đồng** xếp thành viên theo điểm (tối đa 100, mặc định hiện 5). Không cộng điểm nhiệm vụ.
3. Trang cửa hàng: "Nhắn chúc" gộp vào nút "Xin vía cho quán" (không có tin nhắn riêng); tab Thành tích = bài Khoe của chủ cửa hàng; tab Hình ảnh = ảnh trong bài của chủ cửa hàng.
4. Thử thách: bỏ "+200 điểm vía" và tab "Quà tặng"; chỉ theo dõi tiến độ.
5. Bỏ "Khám phá" (thay bằng Bảng tin), bỏ chữ AIBAT, ẩn tab Video (P2).
6. Web admin quản lý tài khoản mẫu, bài mẫu, ảnh cửa hàng, chủ cửa hàng mẫu, ghim bài lên trang chủ, công tắc "Hiện dữ liệu mẫu".
7. Database: thêm `users.is_demo`, `posts.is_demo` (mặc định false); giữ `hot_topics`, `users.job_title`, `posts.pinned_at`. Chỉ mục `wish_events(target_place_id, created_at)` đã có sẵn nên không thêm.
8. Đăng bài chỉ có 3 loại: Kể khổ, Khoe doanh thu, Khoe deal (không đăng bài "Xin vía"); bỏ chip lọc "Xin vía" ở bảng tin.
9. Màn Xin vía: tiêu đề theo thời điểm, Thần Tài, lời chúc, nút "Đã nhận vía!", liên kết "Gửi vía cho cửa hàng khác trong Phố 3D"; không có lịch sử trong ngày.
10. Nút hero Xin vía đổi theo tiêu đề xin vía hiện hành (hôm nay / sáng nay / chiều nay / tối nay) ở mọi kích thước.
11. RESP-01 (một sản phẩm, một hệ thống, mọi kích thước). Khách chưa đăng nhập chỉ có bộ đếm trong trình duyệt; thành viên đồng bộ giữa thiết bị qua máy chủ.


## Quyết định bổ sung (20/11/2026) — Trang chủ theo 3 ảnh thiết kế mới (Desktop, iPad ngang, Mobile)
1. **3 ảnh trang chủ mới là thiết kế chuẩn** của Trang chủ ở desktop (xl), iPad ngang (lg) và điện thoại. iPad dọc và màn 2K/4K giữ bố cục hiện tại (chưa có ảnh thiết kế).
2. **Hero = ảnh phố thiết kế** (`/images/pho-3d-hero.png`, 1672×941) có vùng bấm theo % khung ảnh cho từng cửa hàng và Thần Tài. Nút **Ghé phố 3D** mở cảnh WebGL dựng từ file **GLB v2** (7 model × 3 LOD, trục Z hướng lên → xoay -90° quanh X khi dựng). Máy không hỗ trợ WebGL hoặc tải lỗi thì giữ ảnh phố. Điện thoại dùng LOD thấp, giới hạn 30 FPS; tab ẩn thì ngừng vẽ.
3. **Mọi nội dung hero, hàng nút, chân trang, bố cục phố do admin nhập** (menu "Trang chủ & Phố 3D"): `app_settings.home` (ảnh, tiêu đề, bảng hiệu, camera, vùng bấm Thần Tài, model Thần Tài), bảng `street_slots` (vùng bấm trên ảnh + vị trí 3D + cửa hàng liên kết), `home_actions` (hàng nút, hiện theo thiết bị), `home_footer_links`, và các cột `glb_url/glb_lod1_url/glb_lod2_url/model_scale` trên `scene_templates`. Thay ảnh hoặc file GLB ở admin, không cần sửa code.
4. Hàng nút hành động hiển thị theo thiết bị: máy tính 6 nút, iPad 5 nút (ẩn "Tạo cửa hàng 3D" vì đã có ở menu trái), điện thoại 6 nút.
5. Thay thế các mục cũ khi mâu thuẫn với thiết kế: hero không còn là các lớp WebP xếp chồng (`street-stage` chỉ còn dùng ở trang Phố 3D); 4 thẻ hành động cũ → hàng nút do admin cấu hình.
6. **Chưa làm / cần đối chiếu thêm với ảnh**: thanh dưới điện thoại 6 mục có nút (+) Đăng bài ở giữa (hiện vẫn 5 mục, nút giữa là Xin vía theo quyết định #1 ngày 19/11); điểm thưởng thử thách (+50/+30) và giải thưởng sự kiện trong ảnh chưa đưa vào để không mâu thuẫn quy tắc "+1 điểm"; biểu tượng mạng xã hội ở chân trang (chưa có đường dẫn thật).

## Phố 3D (bản hoàn thiện)
- Cảnh 3D dựng từ file GLB trong `public/3d/models`: 6 cửa hàng hai bên phố (Cafe, Thời trang, Nhà hàng | Sale, Minimart, Nhà thuốc), Thần Tài ở giữa, vật trang trí (cây, đèn, ghế, quà, đài phun nước), người đi bộ và đốm sáng; tất cả nhập ở admin (`/admin/home-config`), không cần đổi code.
- Camera mặc định: fov 42, khoảng cách 23, cao 8.5, nhìn vào (y 2.2, z -3); admin chỉnh được.
- Hiệu năng: `frameloop="demand"`, giới hạn FPS (30 trên điện thoại), dừng khi tab ẩn hoặc cảnh ra khỏi màn hình, LOD theo khoảng cách, đổ bóng chỉ ở chất lượng cao.
- Nhãn cửa hàng vẽ bằng sprite (canvas), không dùng `Html` của drei vì gây lỗi React "unmount a root while rendering".
- Nhà thuốc (`pharmacy`) là loại model mới; seed phiên bản 2 (`home_seed_version`) đặt lại vị trí ô cửa hàng một lần.
- Chưa làm: trình sửa vật trang trí/camera bằng giao diện trong admin (hiện sửa qua JSON cấu hình), xem trước 3D trong admin.
