# Design system

**Nguồn duy nhất của màu/font/bo góc/bóng/chuyển động: `packages/ui/src/styles/theme.css`** (`@theme static`, chuẩn Tailwind v4).
Component chỉ dùng class ngữ nghĩa (`bg-primary`, `text-ink`, `bg-wish`…). Cảnh 3D đọc màu từ chính các biến CSS đó (`useSceneColors`);
manifest/viewport phía server và icon PWA cũng đọc từ file này. Khi đội thiết kế gửi bảng HEX: **chỉ sửa giá trị trong `theme.css`**.

| Token | Dùng cho |
|---|---|
| `primary*` | Thương hiệu, nút chính, mục đang chọn |
| `wish*` | **Mọi nút Xin vía (đỏ cam)** |
| `gold*`, `story*`, `brag*`, `deal*` | Huy hiệu, Kể khổ, Khoe doanh thu, Khoe deal |
| `role-owner*`, `role-sale*` | Nhãn Chủ quán / Sale |
| `app`, `surface*`, `border`, `ink*` | Nền, thẻ, chữ |
| `success/warning/danger/info*` | Trạng thái |
| `scene-*`, `shop-*` | Cảnh Phố 3D |

Font: **Baloo 2** (tiêu đề, nút Xin vía) + **Be Vietnam Pro** (nội dung) qua `@fontsource`.

## Mốc responsive (Tailwind)
| Mốc | Thiết bị | Bố cục |
|---|---|---|
| mặc định | Điện thoại 360–430 | 1 cột, thanh điều hướng dưới (nút giữa Xin vía), popup dạng bottom sheet, Thần Tài giữa + dãy cửa hàng cuộn ngang |
| `md` 768 | iPad dọc | Top-nav, popup modal, hero một hàng |
| `lg` 1024 | iPad ngang | 2 cột: nội dung + cột phải (Xin vía nhanh, thử thách, TOP 5, hoạt động, chủ đề hot) |
| `xl` 1280 | Desktop | 3 cột: menu trái + nội dung + cột phải |
| `3xl` 1920 / `4xl` 2560 | Màn lớn / 2K / 4K | Mở rộng khung & cảnh 3D, **giới hạn bề rộng đọc của feed** |

Nút Xin vía luôn nổi bật nhất và không bị 3D/thanh điều hướng che ở mọi kích thước.
