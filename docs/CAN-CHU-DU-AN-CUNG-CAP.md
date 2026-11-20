# Đã nhận / còn cần từ chủ dự án

> **19/11/2026: ba hạng mục bên dưới đã được bàn giao và đã tích hợp** (bảng màu → `theme.css`; 51 ảnh WebP + 3 icon PWA → `apps/web-public/public/`; 7 cấp độ + 9 huy hiệu → `seed.ts`, database dev). Phần còn lại chỉ là **khóa dịch vụ thật và máy chủ thật** (xem `docs/STATUS.md`). Nội dung dưới giữ làm tài liệu tham chiếu về quy cách khi cần thay bản mới.

Ba hạng mục dưới đây app **đã chạy được với giá trị tạm**. Khi có bản chính thức, chỉ thay đúng chỗ ghi ở mỗi mục, không phải sửa giao diện hay nghiệp vụ.

| # | Hạng mục | Ai cung cấp | Hiện tại đang dùng | Thay ở đâu |
|---|---|---|---|---|
| 1 | Bảng màu HEX chính thức | Đội thiết kế | Màu tạm lấy theo ảnh thiết kế | `packages/ui/src/styles/theme.css` (một file duy nhất) |
| 2 | Ảnh Thần Tài, logo, cửa hàng, icon nét hơn | Đội thiết kế | Ảnh cắt từ ảnh mockup, mờ ở màn lớn | `apps/web-public/public/images/` (thay file, giữ nguyên tên) |
| 3 | Ngưỡng cấp độ và điều kiện huy hiệu | Chủ dự án | Để trống | Web admin → *Điểm vía & cộng đồng* → Cấp độ / Huy hiệu |

---

## 1. Bảng màu HEX chính thức

**Cần:** danh sách mã HEX (`#RRGGBB`) cho từng vai trò màu bên dưới, kèm màu chữ đặt trên nền đó nếu khác trắng. Nên kèm file Figma/design system nếu có.

**Cách dùng:** mỗi dòng dưới là một biến trong `theme.css`. Đổi giá trị biến là cả web app và web admin đổi theo; không có màu nào viết cứng trong code.

| Nhóm | Biến hiện tại (giá trị tạm) | Dùng cho |
|---|---|---|
| Xanh chủ đạo | `--color-primary #16a34a`, `-strong #15803d`, `-soft #dcfce7`, `--color-on-primary #ffffff` | Nút chính, menu đang chọn, tiêu đề, logo |
| **Xin vía (đỏ cam)** | `--color-wish #f2501a`, `-strong #d63a0a`, `-soft #ffe6d9`, `--color-on-wish #ffffff` | **Mọi nút Xin vía** (đã chốt luôn đỏ cam) |
| Vàng | `--color-gold #fbbf24`, `-strong #d97706`, `-soft #fef3c7` | Khẩu hiệu, huy chương, nhãn nổi bật |
| Kể khổ | `--color-story #7c3aed`, `-soft #ede9fe` | Chip và banner Kể khổ |
| Khoe doanh thu | `--color-brag #ea580c`, `-soft #ffedd5` | Chip Khoe doanh thu |
| Khoe deal | `--color-deal #e11d48`, `-soft #ffe4e6` | Chip Khoe deal |
| Vai trò | `--color-role-owner #a16207`, `--color-role-sale #6d28d9` (và `-soft`) | Nhãn "Chủ quán", "Sale" |
| Nền và viền | `--color-app #eefaf3`, `--color-surface #ffffff`, `--color-surface-muted #f3f7f4`, `--color-search-bg #e8f0f6`, `--color-border #dbe5de` | Nền trang, thẻ, ô tìm kiếm |
| Chữ | `--color-ink #14231a`, `-muted #4b5f54`, `-subtle #7a8c82` | Chữ chính, chữ phụ, chú thích |
| Trạng thái | `--color-success #16a34a`, `--color-warning #d97706`, `--color-danger #dc2626`, `--color-info #2563eb` (và `-soft`) | Thông báo, cảnh báo, lỗi |

**Cần lưu ý khi thiết kế:** tương phản chữ/nền tối thiểu 4.5:1 (nhất là chữ trắng trên nút đỏ cam và xanh lá), và nút Xin vía phải là điểm nhấn rõ nhất ở mọi kích thước.

**Font:** hiện dùng **Baloo 2** (tiêu đề) và **Be Vietnam Pro** (nội dung) theo quyết định đã chốt. Nếu đổi, báo tên font và nguồn (Google Fonts hay file riêng).

---

## 2. Hình ảnh nét hơn

Hiện mọi hình trong app được **cắt và xử lý từ ảnh mockup**, nên bị mờ khi phóng to (màn 2K trở lên) và có vài chi tiết bị cắt lẹm. Cần xuất lại riêng từng hình (đã có sẵn nội dung yêu cầu để dán vào ChatGPT hoặc gửi designer ở `docs/ASSET-PROMPTS.md`).

### Quy cách chung
- Định dạng **PNG nền trong suốt** (hoặc SVG cho logo/icon); riêng ảnh nền phố và ảnh bìa có thể là JPG/PNG có nền.
- Cạnh dài **tối thiểu 2048 px** (ảnh nền phố ngang 3072 px trở lên). Không chèn chữ thừa, khung, bóng đổ ra nền hay watermark.
- Chỉ chữ trên biển hiệu đúng như bảng dưới, **đúng chính tả tiếng Việt có dấu**.
- Không có mèo thần tài, chữ hoặc logo AIBAT, vòng quay, tiền ảo.

### Danh sách cần
| Nhóm | File hiện tại | Nội dung cần |
|---|---|---|
| Thần Tài | `than-tai.webp` | Thần Tài nửa người, ôm đĩnh vàng, chính diện |
| | `than-tai-bo-dung.webp` | Toàn thân, đứng trên bệ vàng nhiều tầng, đặt giữa quảng trường |
| | `than-tai-nhan-via.webp` | Hai tay giơ mừng, đồng xu và tia sáng (màn "Thần Tài đã cho vía!") |
| Phố | `pho-nen.webp` | Nền toàn cảnh phố **không có cửa hàng, không có Thần Tài, không có người** (tỉ lệ 3:1), để ghép cửa hàng lên |
| Cửa hàng (nền trong suốt, mặt tiền hướng vào đường) | `shop-quan-cafe.webp` | Biển "Quán Cafe", mái bạt sọc đỏ trắng; mặt tiền hướng **phải** |
| | `shop-thoi-trang.webp` | Biển "Shop Thời Trang", mái hồng trắng; hướng **phải** |
| | `shop-nha-hang.webp` | Biển "Nhà hàng"; hướng **phải** |
| | `shop-minimart.webp` | Biển "Minimart" có xe đẩy hàng; hướng **trái** |
| | `shop-van-phong-sale.webp` | Tòa kính xanh, biển "Văn phòng Sale"; hướng **trái** |
| Trang cửa hàng | `bia-quan-cafe.webp` | Ảnh bìa 16:9, biển "Quán Cafe An Nhiên" |
| Tạo cửa hàng | `cua-hang-mau.webp` | Cửa hàng nhỏ "Cửa hàng của tôi" kèm dấu cộng xanh |
| Logo | `logo-co.webp` | Cỏ bốn lá, chỉ biểu tượng (kèm bản SVG nếu có) |
| Icon | `ic-*.webp` (nhà, cười ra nước mắt, túi tiền, quà, sáng, chiều, tối, lịch, cúp, vương miện, huy chương 1/2/3, đồng xu, chắp tay, sao, biểu đồ, lửa) | Bộ 20 icon cùng phong cách 3D hoạt hình |
| Bài mẫu | `bai-*.webp`, `hp-*.webp`, `kk-*.webp` | Ảnh minh họa cho bài mẫu (Kể khổ, Khoe deal, Khoe doanh thu, mèo "Để em suy nghĩ", bảng Coffee…) |
| Avatar mẫu | `av-*.webp` | 10 ảnh chân dung vuông, nét, cho tài khoản mẫu |

### Biểu tượng cài đặt lên màn hình (PWA)
Cần **icon 512×512 vuông** (logo đặt chính giữa, nền đặc, chừa lề an toàn 10% mỗi cạnh) để tạo 3 file `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` trong `apps/web-public/public/icons/`. Hiện đang là icon tạo tự động từ cỏ bốn lá.

### Nếu muốn Phố 3D xoay thật (tùy chọn, ngoài phạm vi hiện tại)
Cần file mô hình `.glb` của Thần Tài và từng cửa hàng, do người dựng 3D chuyên nghiệp làm theo ảnh thiết kế. Hiện Phố là ảnh nhiều lớp, bấm được nhưng không xoay.

---

## 3. Ngưỡng cấp độ và điều kiện huy hiệu

Quy tắc đã chốt: **điểm vía** chỉ tăng +1 khi **thành viên đã đăng nhập** xin vía Thần Tài hoặc gửi vía cho cửa hàng/sale. Nhiệm vụ không cộng điểm. Cấp độ và huy hiệu **chỉ tính từ điểm này**. Mọi giá trị do admin nhập, **không viết cứng trong code**.

### 3a. Cấp độ
Bảng này để trống; admin tạo từng dòng ở **Cấp độ**. Anh/chị chỉ cần điền bảng:

| Cấp | Tên cấp (hiển thị) | Điểm vía tối thiểu |
|---|---|---|
| 1 | _(ví dụ: Tân binh)_ | 1 |
| 2 | | |
| 3 | | |
| … | | |

Ràng buộc: cấp là số nguyên 1–100, điểm tối thiểu là số nguyên không âm, tên 2–60 ký tự. Người chưa đủ điểm cấp đầu hiện "Chưa có cấp độ". Cấp độ hiển thị cạnh tên trên bài viết, hồ sơ và bảng xếp hạng thành viên.

### 3b. Huy hiệu cộng đồng
Mỗi huy hiệu gồm: mã (a-z, 0-9, `_`), tên, mô tả ngắn, biểu tượng, **điều kiện** và **ngưỡng**.

| Điều kiện (chọn 1) | Ý nghĩa |
|---|---|
| `total_points` | Tổng điểm vía đạt ngưỡng |
| `deity_wishes` | Số lần xin vía Thần Tài đạt ngưỡng |
| `place_wishes` | Số lần gửi vía cho cửa hàng/sale đạt ngưỡng |

Biểu tượng chọn trong 24 mã: `fire, chart, handshake, target, clover, heart, gold, flower, star, sun, moon, calendar, coffee, shirt, cart, briefcase, fork, spa, store, trophy, crown, sparkles, users, smile`.

| Mã | Tên huy hiệu | Mô tả | Biểu tượng | Điều kiện | Ngưỡng |
|---|---|---|---|---|---|
| | | | | | |

### 3c. Cần chốt thêm
1. Bao nhiêu **cấp** và các mốc điểm (nên bắt đầu thấp để người mới nhanh có cấp 1)?
2. Có **huy hiệu theo cột mốc** nào không (ví dụ "Xin vía 10 lần", "Gửi vía 50 lần")?
3. Bảng xếp hạng **Cộng đồng** hiện hiện tối đa 100 thành viên, mặc định 5. Giữ nguyên chứ?
4. Người mới hiện **điểm 0** và chưa có cấp. Có muốn tặng cấp khởi đầu không?

> Khi có bảng này, gửi cho tôi hoặc nhập thẳng vào web admin (*Điểm vía & cộng đồng → Cấp độ / Huy hiệu*). Không cần thay đổi cấu trúc database.

---

## Thứ tự nên làm
1. **Bảng màu HEX** (nhanh nhất, đổi một file, thấy ngay).
2. **Ảnh nét hơn** (thay file cùng tên, không sửa mã).
3. **Cấp độ & huy hiệu** (nhập trong admin, không cần lập trình).

Các việc khác còn mở (SMS/OAuth/R2/Turnstile/PostHog/Sentry cần khóa dịch vụ thật, triển khai Docker + Caddy) xem `docs/STATUS.md`.

---

## Còn thiếu cho hero trang chủ trên điện thoại (ảnh thiết kế 19/11/2026)
Hero điện thoại/iPad dọc đã làm theo ảnh (Thần Tài nửa người, tia sáng, đồng xu, nút rộng viền vàng, chú thích). Chưa giống 100% vì thiếu:
| Thiếu | Hiện dùng tạm | Thay ở đâu |
|---|---|---|
| Bàn tay chỉ trỏ 3D ở cuối nút (nền trong suốt) | Bàn tay SVG vẽ tạm | Thả file `apps/web-public/public/images/ic-pointer.webp`, rồi gán đường dẫn vào `POINTER_IMAGE` trong `components/home/hero.tsx` |
| Lớp người đi bộ nền trong suốt (4–6 dáng) và cửa hàng nền xa | Chưa có (cảnh chỉ có cửa hàng theo dữ liệu admin) | Cần ảnh; sau khi có sẽ thêm lớp trong `street-stage.tsx` |

Khác ảnh có chủ ý: chữ nút là "Xin vía hôm nay" (lần đầu) rồi sáng/chiều/tối nay theo SRS (ảnh ghi "Xin vía ngay"); màu nút đỏ cam theo bảng màu chính thức (ảnh sáng hơn một chút để đảm bảo tương phản chữ).
