'use client';

import { cn, toast } from '@chot-via/ui';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { SocialIcon } from '@/components/home/home-footer';
import { shareMessage, shareUrl, type ShareTarget } from '@/lib/share';

const TARGETS: ShareTarget[] = ['facebook', 'zalo', 'tiktok'];

/** Sao chép vào bộ nhớ tạm; trả về true nếu được. */
async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** Chia sẻ `text` lên mạng `target`: sao chép "lời chúc + link", mở cửa sổ chia sẻ của mạng đó và báo cho người dùng biết đã sao chép. */
export function useShareTo(): (target: ShareTarget, text: string) => Promise<void> {
  const t = useTranslations('wish.share');
  return async (target, text) => {
    const copied = await copy(shareMessage(text));
    window.open(shareUrl(target, text), '_blank', 'noopener,noreferrer');
    toast(copied ? t(`copied.${target}`) : t('copyFailed'));
  };
}

/**
 * Chia sẻ lời chúc kèm link Chốt Vía. Bấm một mạng: sao chép "lời chúc + link" rồi mở cửa sổ chia sẻ của mạng đó (chưa đăng nhập thì mạng tự hiện màn đăng nhập),
 * nên nếu mạng không nhận chữ thì người dùng dán được. Điện thoại có thêm nút mở menu chia sẻ của hệ điều hành. Không cộng điểm, không ghi vào cơ sở dữ liệu.
 */
export function ShareButtons({ text, className }: { text: string; className?: string }) {
  const t = useTranslations('wish.share');
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const btn = 'grid size-9 place-items-center rounded-full bg-surface text-ink shadow-card ring-1 ring-border/60 transition hover:bg-surface-muted active:scale-90';

  const shareTo = useShareTo();
  const system = async (): Promise<void> => {
    try { await navigator.share({ text, url: shareMessage('').trim() }); } catch { /* người dùng đóng menu chia sẻ */ }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-testid="share-buttons">
      <span className="text-xs font-bold text-ink-muted">{t('label')}</span>
      {TARGETS.map((target) => (
        <button key={target} type="button" aria-label={t(`aria.${target}`)} onClick={() => void shareTo(target, text)} className={btn}><SocialIcon label={target} /></button>
      ))}
      {canNative ? <button type="button" aria-label={t('aria.system')} onClick={() => void system()} className={btn}><Share2 className="size-4" aria-hidden /></button> : null}
    </div>
  );
}
