import { describe, expect, it } from 'vitest';
import { shareMessage, shareUrl, siteUrl } from '../src/lib/share';

const SHARE_SITE_URL = siteUrl();

describe('chia sẻ Xin Vía', () => {
  it('nội dung chia sẻ là lời chúc kèm link tên miền cấu hình, không dư dấu gạch cuối', () => {
    expect(SHARE_SITE_URL.endsWith('/')).toBe(false);
    expect(shareMessage('Chúc bạn đông khách')).toBe(`Chúc bạn đông khách\n${SHARE_SITE_URL}`);
  });

  it('link riêng của bài thay cho link trang chủ khi truyền vào', () => {
    const link = `${SHARE_SITE_URL}/bai/abc`;
    expect(shareMessage('Xin vía', link)).toBe(`Xin vía\n${link}`);
    expect(shareUrl('facebook', 'Xin vía', link)).toContain(encodeURIComponent(link));
  });

  it('Facebook và Zalo nhận link (mã hóa an toàn), TikTok chỉ mở TikTok', () => {
    const text = 'Chúc & mừng #1';
    const fb = shareUrl('facebook', text);
    expect(fb.startsWith('https://www.facebook.com/sharer/sharer.php?u=')).toBe(true);
    expect(fb).toContain(encodeURIComponent(SHARE_SITE_URL));
    expect(fb).toContain(encodeURIComponent(text));
    expect(shareUrl('zalo', text)).toContain(encodeURIComponent(SHARE_SITE_URL));
    expect(shareUrl('tiktok', text)).toBe('https://www.tiktok.com/');
  });
});
