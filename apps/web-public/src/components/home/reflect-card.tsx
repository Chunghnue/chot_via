'use client';

import { isReflectTime } from '@chot-via/shared';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { useWishSettings } from '@/features/wish/use-deity-wish';
import { useCurrentUser } from '@/lib/use-member';
import { useMounted } from '@/lib/use-mounted';
import { useAppDispatch } from '@/store/hooks';

/** Khung 17:00–21:00 theo tài liệu chiến lược: "Hôm nay thế nào rồi?" mời khoe doanh thu, deal hoặc kể chuyện không vui. Chỉ hiện trong khung giờ đó (giờ Việt Nam, cấu hình ở cài đặt). */
export function ReflectCard() {
  const t = useTranslations('home.reflect');
  const dispatch = useAppDispatch();
  const settings = useWishSettings();
  const mounted = useMounted();
  const role = useCurrentUser()?.memberRole ?? null;
  if (!mounted || !isReflectTime(new Date(), settings.timeWindows)) return null;
  return (
    <section
      aria-label={t('title')}
      className="flex flex-col items-center gap-3 rounded-3xl bg-linear-to-br from-gold-soft via-surface to-primary-soft p-4 text-center shadow-card ring-1 ring-gold/40 sm:flex-row sm:text-left"
    >
      <img src="/images/ic-sun.webp" alt="" aria-hidden className="size-14 shrink-0 object-contain drop-shadow" draggable={false} />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-extrabold text-primary-strong">{t('title')}</h2>
        <p className="text-sm font-medium text-ink">{t('sub')}</p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => dispatch(composerOpened(role ? { kind: 'brag', role } : { kind: 'brag' }))}
          className="btn-glossy inline-flex h-11 items-center rounded-full px-5 text-sm font-bold text-on-primary active:scale-95"
        >
          {t('brag')}
        </button>
        <button
          type="button"
          onClick={() => dispatch(composerOpened({ kind: 'story' }))}
          className="inline-flex h-11 items-center rounded-full bg-surface px-5 text-sm font-bold text-ink shadow-card ring-1 ring-border/60 active:scale-95"
        >
          {t('story')}
        </button>
      </div>
    </section>
  );
}
