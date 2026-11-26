import type { PostType } from '@chot-via/shared';

/** Ảnh xem trước (1200×630) theo loại bài, dựng từ bộ mẫu thẻ chia sẻ. */
export const POST_SHARE_IMAGE: Record<PostType, string> = {
  story: '/images/og-ke-kho.jpg',
  achievement: '/images/og-khoe.jpg',
  wish_share: '/images/og-nhan-via.jpg',
};

/** Trích ngắn nội dung bài để đưa vào câu chia sẻ: bỏ hashtag và xuống dòng, cắt ở cuối từ, thêm "…" nếu dài. */
export function postSnippet(body: string, max = 100): string {
  const clean = body.replace(/#[\p{L}\p{N}_]+/gu, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[ .,;:!?]+$/, '')}…`;
}
