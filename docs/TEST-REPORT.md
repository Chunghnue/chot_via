# Báo cáo kiểm thử (19/11/2026)

Chạy **một lượt toàn bộ** sau khi hoàn tất chức năng, sửa lỗi rồi chạy lại cả bộ cho tới khi xanh.

## Kết quả lần chạy cuối
| Lớp | Công cụ | Kết quả |
|---|---|---|
| Đơn vị `packages/shared` | Vitest | 36 / 36 xanh |
| API backend (chạy thật trên Postgres test) | Vitest | 87 / 87 xanh |
| Giao diện `apps/web-public` (reducer, thành phần, thành phần dùng chung mới) | Vitest + Testing Library | 26 / 26 xanh |
| End-to-end trình duyệt, 4 cỡ màn hình + web admin | Playwright | 127 / 127 xanh, 13 bỏ qua có chủ ý theo cỡ màn hình (5,1 phút) |
| End-to-end trên **bản production** (`next build` + `next start`): manifest, service worker, offline | Playwright | 2 / 2 xanh |
| Kiểm kiểu toàn bộ | `pnpm -r typecheck` | xanh |

Tổng: **278 test xanh** (149 đơn vị/API/giao diện + 127 E2E + 2 E2E production), 0 lỗi, 0 lỗi hydrate trong log lần chạy cuối (đã thêm test hydrate cho thành viên đã đăng nhập).

## Cách chạy
- `pnpm test` — shared + backend + web-public (khoảng 15 giây). Tự tạo lại database `xinvia_test` (migration + seed), bật API thật ở cổng 3101; không đụng dữ liệu dev.
- `pnpm test:e2e` — Playwright, dựng web dev (3100), admin (5273) và API test (3101); 4 dự án: mobile 390, iPad dọc 820, iPad ngang 1180, desktop 1440.
- `pnpm test:e2e:prod` — build bản production và kiểm PWA (manifest, icon, đăng ký service worker, mở app khi mất mạng và xin vía bằng lời chúc dự phòng).
- `pnpm test:all` — cả ba. Cần Postgres nhúng đang chạy (`pnpm db:embedded`) và Chromium của Playwright (đường dẫn đặt qua `PW_CHROMIUM` nếu khác mặc định).

## Phạm vi đã kiểm
- **Nghiệp vụ:** tiêu đề xin vía theo giờ Việt Nam (và chế độ campaign), đầu ngày/đầu tuần, OTP (gửi lại 60 giây, tối đa 3 lần/15 phút, sai mã, khóa, CSRF cho cookie), xin vía khách không điểm / thành viên +1 điểm, gửi vía cho cửa hàng và sale (phản hồi tự động có nhãn / phản hồi hệ thống), đồng bộ lần xin vía hôm nay theo tài khoản, bảng xếp hạng tuần Cửa hàng/Sale và bảng điểm Cộng đồng, bài đăng (Kể khổ, Khoe mặc định ẩn số tiền, bình chọn, từ khóa chặn), bộ lọc/ghim/hot, báo cáo, quyền admin, CRUD danh mục, tài khoản/bài mẫu, công tắc "Hiện dữ liệu mẫu", nhiệm vụ không cộng điểm.
- **Chuông thông báo:** 6 loại thông báo tạo đúng người nhận (bình luận, cảm xúc, theo dõi, nhận vía, gỡ bài), chỉ chứa mã và tham số, đánh dấu đã đọc từng cái hoặc tất cả, không đánh dấu được thông báo của người khác; E2E: khách bấm chuông mở đăng nhập, thành viên thấy số, bấm từng thông báo giảm số, "Đánh dấu đã đọc" xóa hết.
- **Header iPad ngang và nhãn cảm ứng:** ô tìm kiếm bên phải menu, kính lúp ở cuối ô (1024–1279 px), nút "Đăng nhập / Đăng ký" từ 1100 px; hàng nhãn cửa hàng chạm được chỉ hiện trên thiết bị không có chuột.
- **Giao diện:** 8 trang chính không tràn ngang ở 4 cỡ màn hình, thanh dưới điện thoại (Xin vía ở giữa), menu trên không có "Khám phá"/AIBAT, các khối cột phải có mặt ở mọi kích thước, luồng khách xin vía, chạm cửa hàng → gửi vía, đăng nhập đúng lúc và giữ bản nháp, đăng bài, +1 điểm, 3 tab bảng xếp hạng, trang cửa hàng 4 tab, Sự kiện không có quà/điểm thưởng, popup đăng bài chỉ 3 loại, web admin (đăng nhập, bài mẫu, tài khoản mẫu, chủ đề hot, tắt/bật dữ liệu mẫu hiển thị trên app).

- **UAT-09 / UAT-10 (Khoe doanh thu / Deal):** chủ quán thấy mẫu doanh thu, số đơn, ngày bán tốt, mốc; Sale thấy mẫu deal, hợp đồng, KPI, số khách; mặc định "Ẩn số tiền"; chọn "Chỉ hiện khoảng" hiện các mức; đăng ở chế độ ẩn thì API không trả số tiền.
- **PWA bản production:** manifest `standalone` với icon 192/512/maskable truy cập được; service worker lưu vỏ app và gói lời chúc offline; mất mạng vẫn mở được app và nhận "Lời chúc dự phòng" kèm ghi chú chưa ghi nhận trên hệ thống.

## Lỗi sản phẩm tìm thấy và đã sửa
1. **Lệch HTML khi hydrate** (trang Kể khổ, bảng xếp hạng, thử thách, Xin vía nhanh, nhãn nút Xin vía): các khối dùng dữ liệu RTK Query hoặc bộ đếm localStorage xuất hiện ở nhiều chỗ nên có khối hydrate sau khi dữ liệu đã có. Sửa bằng `useMounted()` (`apps/web-public/src/lib/use-mounted.ts`).
2. **Nội dung lặp ở cột phải** trên chính trang của nó (Bảng xếp hạng tuần ở `/bang-xep-hang`, Thử thách tuần ở `/su-kien`): thêm biến thể cột phải `ranking` và `events`.
3. Trang chủ ở màn nhỏ mất các khối cột phải (đã sửa ở lượt trước, nay có test chặn lại).
4. Công tắc (Radix Switch) ở web admin báo "uncontrolled → controlled": ép `checked` luôn là boolean trong component dùng chung.
5. **Lệch hydrate khi đã đăng nhập** (ô soạn bài ở `/bang-tin` hiện chữ "T" ở trình duyệt, "?" ở máy chủ): trạng thái đăng nhập giờ đi qua `useAuthStatus`/`useCurrentUser` (lần render đầu luôn là "chưa biết"), có test E2E `hydration.spec.ts` chặn lại.
6. **Test backend phụ thuộc thứ tự file** (`places.test.ts` giả định mọi cửa hàng đều là dữ liệu mẫu): sửa để chỉ kiểm phần dữ liệu mẫu.
7. Ảnh minh họa trong bài viết bị cao quá so với thiết kế: đặt tỉ lệ dải ngang 10:3.

Các lỗi còn lại trong lúc viết test đều do test (IP/OTP dùng chung giới hạn, bộ gọi API gửi `content-type` cho DELETE không có nội dung, selector trùng phần tử ẩn); đã sửa trong test, không làm yếu kiểm tra.

## Chưa kiểm được
- SMS thật (SpeedSMS/eSMS), đăng nhập Google/Facebook/Apple, Cloudflare R2, Turnstile, PostHog, Sentry, Redis.
- Thiết bị thật (mới giả lập kích thước và cảm ứng trong Chromium); các trình duyệt Safari/Firefox.
- E2E chính chạy trên bản dev của Next.js; riêng PWA/offline đã kiểm trên bản production bằng `pnpm test:e2e:prod` (chỉ Chromium giả lập điện thoại, chưa thử cài lên thiết bị thật).
- `docker build/up` thật và máy chủ thật (theo yêu cầu bỏ qua).
- Kiểm thử tải, hiệu năng, trợ năng (accessibility) và đối chiếu pixel với ảnh thiết kế chưa làm.
