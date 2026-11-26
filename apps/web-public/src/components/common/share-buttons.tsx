'use client';

import { cn, toast } from '@chot-via/ui';
import { ImageDown, Share2 } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { SocialIcon } from '@/components/home/home-footer';
import { isDesktopPointer, shareMessage, shareUrl, siteUrl, ZALO_SHARE_EVENT, type ShareTarget } from '@/lib/share';
import { shareCardImage, wrapLines, type ShareCardKind } from '@/lib/share-card';
import { BrandIcon } from '@chot-via/ui';

const TARGETS: ShareTarget[] = ['facebook', 'messenger', 'zalo', 'tiktok'];

/** Sao chép vào bộ nhớ tạm; trả về true nếu được. */
async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** Chia sẻ `text` lên mạng `target`: sao chép "lời chúc + link", mở cửa sổ chia sẻ của mạng đó và báo cho người dùng biết đã sao chép. */
export function useShareTo(): (target: ShareTarget, text: string, link?: string) => Promise<void> {
  const t = useTranslations('wish.share');
  return async (target, text, link = siteUrl()) => {
    // Zalo trên máy tính không nhận sẵn nội dung: mở hộp có mã QR, Zalo Web và nút sao chép link.
    if (target === 'zalo' && isDesktopPointer()) {
      window.dispatchEvent(new CustomEvent(ZALO_SHARE_EVENT, { detail: { text, link } }));
      return;
    }
    // Zalo trên điện thoại: menu chia sẻ của hệ điều hành có sẵn Zalo trong danh sách.
    if (target === 'zalo' && typeof navigator.share === 'function') {
      try { await navigator.share({ text, url: link }); return; } catch { /* người dùng đóng menu, thử cách dưới */ }
    }
    const copied = await copy(shareMessage(text, link));
    window.open(shareUrl(target, text, link), '_blank', 'noopener,noreferrer');
    toast(copied ? t(`copied.${target}`) : t('copyFailed'));
  };
}

/**
 * Chia sẻ lời chúc kèm link Xin Vía. Bấm một mạng: sao chép "lời chúc + link" rồi mở cửa sổ chia sẻ của mạng đó (chưa đăng nhập thì mạng tự hiện màn đăng nhập),
 * nên nếu mạng không nhận chữ thì người dùng dán được. Điện thoại có thêm nút mở menu chia sẻ của hệ điều hành. Không cộng điểm, không ghi vào cơ sở dữ liệu.
 */
export interface ShareCardSpec {
  kind: ShareCardKind;
  /** Đường dẫn QR trên thẻ (mặc định: trang chủ). */
  link?: string;
  /** Nội dung riêng thay cho hai dòng mẫu (ví dụ nội dung bài đăng). */
  body?: string;
}

/** Tạo thẻ ảnh theo mẫu của loại thẻ rồi chia sẻ (menu của thiết bị) hoặc tải ảnh về. */
export function useShareCard(): (spec: ShareCardSpec, caption: string) => Promise<void> {
  const t = useTranslations('wish.share');
  const tc = useTranslations('wish.card');
  return async (spec, caption) => {
    const lines = spec.body ? wrapLines(spec.body) : [tc(`${spec.kind}.l1`), tc(`${spec.kind}.l2`)];
    try {
      const r = await shareCardImage({ brand: tc('brand'), tagline: tc('tagline'), scan: tc('scan'), title: tc(`${spec.kind}.title`), lines }, spec.link ?? siteUrl(), caption);
      if (r === 'saved') toast.success(t('cardSaved'));
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) toast.error(t('cardFail'));
    }
  };
}

export function ShareButtons({
  text,
  className,
  card,
  link: shareLink,
  onShared,
}: {
  text: string;
  className?: string;
  card?: ShareCardSpec;
  /** Link cần chia sẻ (mặc định trang chủ). */ link?: string;
  /** Gọi sau khi người dùng chọn một cách chia sẻ. */ onShared?: () => void;
}) {
  const t = useTranslations('wish.share');
  const shareCard = useShareCard();
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const btn =
    'grid size-9 place-items-center rounded-full bg-surface text-ink shadow-card ring-1 ring-border/60 transition hover:bg-primary-soft hover:text-primary-strong hover:ring-primary active:scale-90';
  /** Nhãn gạch chân hiện khi rê chuột vào biểu tượng, giống kiểu liên kết (ví dụ "Gửi vía cho cửa hàng khác"). */
  const link =
    'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold text-primary-strong underline opacity-0 shadow-card transition group-hover:opacity-100 group-focus-visible:opacity-100';

  const shareTo = useShareTo();
  const system = async (): Promise<void> => {
    try {
      await navigator.share({ text, url: shareLink ?? siteUrl() });
      onShared?.();
    } catch {
      /* người dùng đóng menu chia sẻ */
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-testid="share-buttons">
      <span className="text-xs font-bold text-ink-muted">{t('label')}</span>
      {TARGETS.map((target) => (
        <button
          key={target}
          type="button"
          aria-label={t(`aria.${target}`)}
          title={t(`aria.${target}`)}
          onClick={() => {
            void shareTo(target, text, shareLink);
            onShared?.();
          }}
          className={cn(btn, 'group relative')}
        >
          {target === 'messenger' ? <BrandIcon brand="messenger" /> : <SocialIcon label={target} />}
          <span aria-hidden className={link}>
            {t(`name.${target}`)}
          </span>
        </button>
      ))}
      {card ? (
        <button
          type="button"
          aria-label={t('aria.card')}
          title={t('aria.card')}
          onClick={() => {
            void shareCard(shareLink ? { ...card, link: shareLink } : card, text);
            onShared?.();
          }}
          className={btn}
        >
          <ImageDown className="size-4" aria-hidden />
        </button>
      ) : null}
      {canNative ? (
        <button type="button" aria-label={t('aria.system')} onClick={() => void system()} className={btn}>
          <Share2 className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
