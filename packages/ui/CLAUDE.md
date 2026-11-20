# packages/ui — thiết kế dùng chung

- `src/styles/theme.css` — **nguồn duy nhất của màu, font, bo góc, đổ bóng, animation** (Tailwind v4 `@theme static`). Muốn đổi bảng màu chỉ sửa file này. Token màu cảnh/cửa hàng (`scene-*`, `shop-*`, `shopm-*`, `cafe-*`) chỉ còn dùng cho bản 3D cũ (`packages/scene-3d`, không dùng nữa).
- `src/components/` — `primitives.tsx` (Button, Card, Chip, Badge, Avatar, ProgressBar, Input…), `form.tsx`, `overlay.tsx` (Sheet: bottom sheet ở điện thoại, modal từ md; Popover, Menu), `brand.tsx` (Logo, CloverMark, DeityAvatar, `SHOP_IMAGES`, PlaceIllustration), `toaster.tsx`.
- `src/hooks.ts` — `useFormatters` (tiền, ngày, "x giờ trước", khoảng giá trị), `useCodeMessage` (mã → chữ), `useValidationMessage`. `src/lib/format.ts` (`compactCount`, định dạng số/tiền VN).
- Font: Baloo 2 (tiêu đề) + Be Vietnam Pro (nội dung). Nút Xin vía = biến thể `wish` (đỏ cam).
