/** Tên miền công khai của Chốt Vía dùng trong link chia sẻ. Đổi ở đây (hoặc đặt NEXT_PUBLIC_SITE_URL khi build) khi có tên miền thật. */
export const SHARE_SITE_URL = (process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://chotvia.vn').replace(/\/+$/, '');

export type ShareTarget = 'facebook' | 'zalo' | 'tiktok';

/** Nội dung chia sẻ: lời chúc kèm link trang chủ. */
export function shareMessage(text: string): string {
  return `${text}\n${SHARE_SITE_URL}`;
}

/**
 * Địa chỉ mở cửa sổ chia sẻ của từng mạng. Facebook và Zalo chỉ nhận link (chữ hiện ra lấy từ thẻ xem trước của trang, `quote`/`title` chỉ là gợi ý);
 * TikTok không có đường chia sẻ chữ từ web nên chỉ mở TikTok, người dùng dán lời chúc đã được sao chép.
 */
export function shareUrl(target: ShareTarget, text: string): string {
  const link = encodeURIComponent(SHARE_SITE_URL);
  const quote = encodeURIComponent(text);
  switch (target) {
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${quote}`;
    case 'zalo': return `https://zalo.me/share?u=${link}&t=${quote}`;
    case 'tiktok': return 'https://www.tiktok.com/';
  }
}
