/** Tên miền công khai của Chốt Vía dùng trong link chia sẻ: biến NEXT_PUBLIC_SITE_URL (lúc build) nếu có, không thì chính tên miền đang mở (nên deploy sang server nào cũng đúng). */
const FALLBACK_SITE_URL = 'https://chotvia.divusoft.com';
export function siteUrl(): string {
  const env = process.env['NEXT_PUBLIC_SITE_URL'];
  const base = env && env !== '' ? env : typeof window !== 'undefined' ? window.location.origin : FALLBACK_SITE_URL;
  return base.replace(/\/+$/, '');
}

export type ShareTarget = 'facebook' | 'zalo' | 'tiktok';

/** Nội dung chia sẻ: lời chúc kèm link trang chủ. */
export function shareMessage(text: string): string {
  return `${text}\n${siteUrl()}`;
}

/**
 * Địa chỉ mở cửa sổ chia sẻ của từng mạng. Facebook và Zalo chỉ nhận link: ảnh và chữ hiện ra lấy từ thẻ xem trước (Open Graph) của trang
 * (`app/layout.tsx`), `quote`/`t` chỉ là gợi ý. TikTok không có đường chia sẻ chữ từ web nên chỉ mở TikTok, người dùng dán lời chúc đã được sao chép.
 */
export function shareUrl(target: ShareTarget, text: string): string {
  const link = encodeURIComponent(siteUrl());
  const quote = encodeURIComponent(text);
  switch (target) {
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${quote}&hashtag=${encodeURIComponent('#ChotVia')}`;
    case 'zalo': return `https://zalo.me/share?u=${link}&t=${quote}`;
    case 'tiktok': return 'https://www.tiktok.com/';
  }
}

/** Địa chỉ Zalo Web để dán link vào khung chat (máy tính). */
export const ZALO_WEB_URL = 'https://chat.zalo.me/';

/** Máy dùng chuột (máy tính) hay cảm ứng (điện thoại, máy tính bảng). */
export function isDesktopPointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Sự kiện mở hộp chia sẻ Zalo trên máy tính (`ZaloShareHost` lắng nghe). */
export const ZALO_SHARE_EVENT = 'chotvia:zalo-share';
