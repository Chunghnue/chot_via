import type { PostType } from '@chot-via/shared';

/** Ảnh xem trước (1200×630, bộ XinVia_Social_Sharing) theo hành động được chia sẻ. */
export const SHARE_IMAGES = {
  today: '/images/og/xin-via-hom-nay.jpg',
  receive: '/images/og/nhan-via.jpg',
  story: '/images/og/ke-kho.jpg',
  revenue: '/images/og/khoe-doanh-thu.jpg',
  deal: '/images/og/khoe-deal.jpg',
  store: '/images/og/cua-hang-3d.jpg',
  salesOffice: '/images/og/share-07-van-phong-sale.jpg',
} as const;
export type ShareImageKey = keyof typeof SHARE_IMAGES;

/** Ảnh của một bài: kể khổ, nhận vía (xin vía), khoe deal (bài của sale) hoặc khoe doanh thu (các bài khoe còn lại). */
export function postShareImage(post: { type: PostType; role: string | null }): string {
  if (post.type === 'story') return SHARE_IMAGES.story;
  if (post.type === 'wish_share') return SHARE_IMAGES.receive;
  return post.role === 'sale' ? SHARE_IMAGES.deal : SHARE_IMAGES.revenue;
}

/** Tham số `?via=` của link trang chủ khi chia sẻ một hành động xin vía, để thẻ xem trước đúng ảnh của hành động đó. */
export const HOME_SHARE_VIA = { today: 'hom-nay', receive: 'nhan-via' } as const;

/** Trích ngắn nội dung bài để đưa vào câu chia sẻ: bỏ hashtag và xuống dòng, cắt ở cuối từ, thêm "…" nếu dài. */
export function postSnippet(body: string, max = 100): string {
  const clean = body.replace(/#[\p{L}\p{N}_]+/gu, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[ .,;:!?]+$/, '')}…`;
}
