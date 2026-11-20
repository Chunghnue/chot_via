# packages/shared — hợp đồng dùng chung

Mọi thứ backend và frontend phải thống nhất nằm ở đây. Không có logic UI hay truy cập DB.

- `src/enums.ts` — các mảng hằng `as const` + kiểu (vai trò, loại bài, bộ lọc bảng tin, chỉ số khoe, trạng thái…).
- `src/codes.ts` — `ERROR_DEFS` (mã lỗi + HTTP status + schema tham số) và `SUCCESS_CODES`. **Thêm mã mới → thêm câu vào `i18n/vi/codes.json`.**
- `src/schemas/*.ts` — Zod DTO theo miền: `user`, `auth`, `catalog`, `wish`, `place` (kèm bảng xếp hạng tuần), `post` (kèm Hot topic, top tác giả), `social`, `gamification`, `admin` (kèm schema dữ liệu mẫu).
- `src/settings.ts` — `AppSettingsSchema`, `DEFAULT_SETTINGS` (khoảng giá trị khoe C5, trọng số hot 1/2/1.5/3, bảng xếp hạng 100/5…), `PublicSettingsSchema`.
- `src/time.ts` — `getTimeBucket`, `resolveWishTitleCode` (hôm nay / sáng / chiều / tối theo giờ VN: sáng 05–11:59, chiều 12–17:59, tối 18–04:59), `vnDayStart`, `vnWeekStart` (thứ Hai 00:00 VN).
- `src/phone.ts` — chuẩn hóa/che số điện thoại VN.
- `i18n/vi/*.json` + `src/i18n.ts` — **nơi duy nhất** chứa chữ hiển thị (common, nav, home, wish, place, street, post, auth, profile, community, codes, validation, admin). `viMessages` có kiểu để `useTranslations` kiểm tra khóa.
