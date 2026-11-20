# apps/web-public — Next.js (PWA)

Next.js 16 (App Router, Turbopack), React 19, Redux Toolkit + RTK Query (qua `@chot-via/api-client`), Tailwind v4, Radix UI, use-intl, React Hook Form + Zod. **Next.js ở bản này có thay đổi so với kiến thức cũ**: khi nghi ngờ API, đọc `node_modules/next/dist/docs/`. `next dev` tự sinh `AGENTS.md` ở thư mục này (đã bị bỏ qua, xóa cũng được).

## Cấu trúc `src/`
- `app/layout.tsx`, `providers.tsx` (Redux + intl + toaster + bootstrap), `manifest.ts`, `(site)/…` các trang: `/` · `bang-tin` (Cộng đồng; `?type=story` = trang **Kể khổ**) · `pho-3d` · `diem/[slug]` (+`cai-dat`) · `bai/[id]` · `tim-kiem` · `ca-nhan` · `u/[id]` · `tao-diem` · `su-kien` · `bang-xep-hang` · `thong-bao` · `da-luu` · `bao-cao-cua-toi` · `cai-dat`.
- `components/layout/` — `app-shell.tsx` (khung responsive + `RailSwitch` chọn cột phải theo trang), `header.tsx`, `side-nav.tsx`, `bottom-nav.tsx`, `nav-items.tsx`.
- `components/home/` — `hero.tsx` (hero + 4 thẻ), `street-stage.tsx` (cảnh phố nhiều lớp dùng chung với `/pho-3d`).
- `components/post/` — `post-card.tsx` (biến thể `default | compact | wide`), `feed.tsx` (bộ lọc, `FeedList variant`), `post-content.tsx`.
- `components/story/` — banner/bộ lọc Kể khổ, các khối cột phải (Chủ đề hot, Bình chọn vui, Top Kể Khổ tuần).
- `components/rail/` — `right-rail.tsx` (3 biến thể home/story/default), `quick-wish-card.tsx`, `weekly-board.tsx`, `leaderboard.tsx`, `side-cards.tsx`.
- `components/dialogs/` — wish, composer (chọn loại + form), login-sheet, place-sheet (chi tiết + gửi vía), report.
- `features/` — slice Redux: `ui` (popup), `wish` (bộ đếm xin vía + lời chúc), `composer` (bản nháp), `feed`, `street`. `store/` có `store.ts`, `listeners.ts` (listener middleware: lưu bản nháp/bộ đếm vào localStorage).
- `lib/` — analytics (PostHog, không PII), `use-member.ts` (`require(reason)` mở đăng nhập theo hành động), `use-api-toast.ts`.
- `public/images/*.webp` ảnh Thần Tài/phố/cửa hàng/icon/avatar mẫu; `public/sw.js` service worker viết tay (chỉ đăng ký ở bản production).

## Quy ước
- Chữ hiển thị: `useTranslations('<ns>')` từ `packages/shared/i18n/vi/*.json`; không viết chữ cứng. Màu: class ngữ nghĩa từ `theme.css`.
- **Responsive (RESP-01):** mobile (1 cột + thanh dưới) · md/iPad dọc (menu trên, popup dạng modal) · lg/iPad ngang (2 cột + cột phải) · xl/desktop (3 cột) · 3xl/4xl. Các khối ở cột phải được lặp trong luồng trang ở màn nhỏ (`lg:hidden`). Luôn kiểm tra không tràn ngang ở 390/768/820/1024/1180/1280/1440/1920/2560.
- Cảnh phố: `StreetStage` đặt từng ảnh cửa hàng theo toạ độ %; vùng bấm là chính ảnh. Chỉ sửa toạ độ ở đó.
- Đăng nhập chỉ khi cần (đăng bài, thích, theo dõi, tạo cửa hàng…); bản nháp giữ qua bước đăng nhập.
- `reactStrictMode: false` có chủ ý (từng tránh cảnh báo R3F; giờ vẫn để nguyên).
