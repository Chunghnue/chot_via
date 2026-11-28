'use client';

import { Button, Sheet, buttonClass, toast } from '@xin-via/ui';
import qrcode from 'qrcode-generator';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';
import { shareMessage, siteUrl, ZALO_SHARE_EVENT, ZALO_WEB_URL } from '@/lib/share';

/** Mã QR của `value` vẽ bằng các ô vuông SVG (không dùng ảnh ngoài, không chèn HTML). */
function QrCode({ value }: { value: string }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const dark: [number, number][] = [];
    for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) dark.push([c, r]);
    return { n, dark };
  }, [value]);
  const pad = 2;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${cells.n + pad * 2} ${cells.n + pad * 2}`}
      className="size-36 shrink-0 rounded-xl bg-white p-1 text-ink shadow-card ring-1 ring-border/60"
      role="img"
      aria-label={value}
      shapeRendering="crispEdges"
    >
      {cells.dark.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  );
}

/**
 * Chia sẻ Zalo trên máy tính (Zalo web không nhận sẵn nội dung như Facebook): link đã được sao chép sẵn để dán vào khung chat, có nút mở Zalo Web,
 * nút sao chép lại và mã QR để quét bằng Zalo trên điện thoại. Mở bằng sự kiện `ZALO_SHARE_EVENT` từ `useShareTo`.
 */
export function ZaloShareHost() {
  const t = useTranslations('wish.share.zalo');
  const tc = useTranslations('common');
  const [text, setText] = useState<string | null>(null);
  const [target, setTarget] = useState<string>(siteUrl());

  useEffect(() => {
    const open = (e: Event): void => {
      const detail: unknown = e instanceof CustomEvent ? e.detail : null;
      const wish = detail && typeof detail === 'object' && 'text' in detail && typeof detail.text === 'string' ? detail.text : '';
      const url = detail && typeof detail === 'object' && 'link' in detail && typeof detail.link === 'string' && detail.link !== '' ? detail.link : siteUrl();
      setTarget(url);
      setText(wish);
      void navigator.clipboard.writeText(shareMessage(wish, url)).catch(() => undefined);
    };
    window.addEventListener(ZALO_SHARE_EVENT, open);
    return () => window.removeEventListener(ZALO_SHARE_EVENT, open);
  }, []);

  const link = text === null ? '' : target;
  const copy = async (): Promise<void> => {
    try { await navigator.clipboard.writeText(shareMessage(text ?? '', target)); toast.success(t('linkCopied')); } catch { /* trình duyệt chặn: người dùng tự chép */ }
  };
  return (
    <Sheet open={text !== null} onOpenChange={(open) => { if (!open) setText(null); }} title={t('title')} closeLabel={tc('close')}>
      {text !== null ? (
        <div className="flex flex-col gap-3" data-testid="zalo-share">
          <p className="text-sm text-ink-muted">{t('copiedSub')}</p>
          <div className="flex items-center gap-4">
            <QrCode value={link} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-sm text-ink-muted">{t('qrHint')}</p>
              <a href={ZALO_WEB_URL} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'primary', size: 'md' })}>{t('openWeb')}</a>
              <Button variant="outline" onClick={() => void copy()}>{t('copyLink')}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
