'use client';

import { Badge, Button, DeityAvatar, Sheet } from '@chot-via/ui';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { track } from '@/lib/analytics';
import { currentCleared, selectCurrentWish } from '@/features/wish/wishSlice';
import { useDeityWish } from '@/features/wish/use-deity-wish';
import { selectWishDialogOpen, wishDialogToggled } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCurrentUser } from '@/lib/use-member';

/** Hiệu ứng đồng xu rơi nhẹ; tắt hoàn toàn khi người dùng bật giảm chuyển động (CSS) — thông điệp vẫn luôn hiển thị. */
function CoinBurst() {
  const coins = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ id: i, left: 6 + ((i * 37) % 88), delay: (i % 6) * 0.18 })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {coins.map((c) => (
        <span key={c.id} className="absolute top-0 animate-coin text-2xl motion-reduce:hidden" style={{ left: `${c.left}%`, animationDelay: `${c.delay}s` }}>🪙</span>
      ))}
    </div>
  );
}

export function WishDialog() {
  const t = useTranslations('wish');
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectWishDialogOpen);
  const current = useAppSelector(selectCurrentWish);
  const user = useCurrentUser();
  const { receive, isLoading, titleCode, bucket, count } = useDeityWish();

  useEffect(() => {
    if (open) track('wish_open', { target: 'deity', time_bucket: bucket, entrypoint: 'dialog' });
  }, [open, bucket]);

  const shownTitle = current ? current.titleCode : titleCode;
  const close = (value: boolean): void => {
    dispatch(wishDialogToggled(value));
    if (!value) dispatch(currentCleared());
  };

  const bullets = [t('bullet1'), t('bullet2'), t('bullet3')];

  return (
    <Sheet
      open={open} onOpenChange={close} closeLabel={t('closeAria')} tone="wish"
      title={<span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 font-display text-xl font-extrabold text-wish-strong shadow-card"><img src="/images/ic-pray.webp" alt="" aria-hidden className="size-7 object-contain" draggable={false} />{t(`title.${shownTitle}`)}</span>}
    >
      <div className="relative flex flex-col items-center gap-3 text-center">
        {current ? <CoinBurst /> : null}
        <div className="w-52 sm:w-60"><DeityAvatar glow src={current ? '/images/than-tai-nhan-via.webp' : '/images/than-tai.webp'} /></div>

        {!current ? (
          <>
            <h3 className="font-display text-2xl font-extrabold text-wish-strong">{t('ready')}</h3>
            <ul className="flex w-full max-w-sm flex-col gap-1.5 text-left">
              {bullets.map((text) => (
                <li key={text} className="flex items-center gap-2.5 text-base font-medium text-ink"><img src="/images/ic-star.webp" alt="" aria-hidden className="size-5 shrink-0 object-contain" draggable={false} />{text}</li>
              ))}
            </ul>
            <Button variant="wish" size="lg" className="mt-1 w-full max-w-sm animate-glow" loading={isLoading} onClick={() => void receive()}>
              <span aria-hidden>✨</span>{t(`cta.${titleCode}`)}
            </Button>
            {count > 0 ? <p className="text-sm font-semibold text-ink-muted">{t('count', { count })}</p> : null}
          </>
        ) : (
          <>
            <h3 className="font-display text-3xl font-extrabold text-wish-strong">{t('received')}</h3>
            <p className="max-w-md rounded-2xl bg-surface px-4 py-3 text-lg font-medium text-ink shadow-card">{current.text}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {current.offline ? <Badge tone="warning">{t('offlineBadge')}</Badge> : null}
              {current.pointsAwarded && user ? <Badge tone="success"><Check className="size-3" aria-hidden />{t('pointEarned')}</Badge> : null}
            </div>
            {current.offline ? <p className="text-xs text-warning">{t('offlineNote')}</p> : null}
            <p className="text-sm font-semibold text-ink-muted">{t('count', { count })}</p>

            <div className="flex w-full max-w-sm flex-col gap-2">
              <Button variant="primary" size="lg" onClick={() => close(false)}><Check className="size-5" aria-hidden />{t('received2')}</Button>
              <Link href="/pho-3d" onClick={() => close(false)} className="rounded-full px-5 py-2 text-center text-sm font-bold text-primary-strong hover:underline">
                {t('suggest')} →
              </Link>
            </div>
          </>
        )}
        <p className="max-w-sm text-[0.7rem] leading-snug text-ink-subtle">{tc('disclaimer')}</p>
      </div>
    </Sheet>
  );
}
