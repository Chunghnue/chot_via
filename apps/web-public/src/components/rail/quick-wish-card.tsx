'use client';

import { Button, Card, cn } from '@chot-via/ui';
import { Check } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { useWishTitle } from '@/features/wish/use-deity-wish';
import { selectWishEntries } from '@/features/wish/wishSlice';
import { wishDialogToggled } from '@/features/ui/uiSlice';
import { useMounted } from '@/lib/use-mounted';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const SLOT_ORDER = ['morning', 'afternoon', 'evening', 'today'] as const;

/** "Xin vía nhanh" (cột phải): 4 mốc trong ngày (đánh dấu mốc đã xin) + Thần Tài + nút Nhận vía. */
export function QuickWishCard() {
  const t = useTranslations('wish');
  const dispatch = useAppDispatch();
  const storedEntries = useAppSelector(selectWishEntries);
  const entries = useMounted() ? storedEntries : [];
  const { titleCode } = useWishTitle();
  const icons = { morning: '/images/ic-sun.webp', afternoon: '/images/ic-partly-cloudy.webp', evening: '/images/ic-moon.webp', today: '/images/ic-calendar.webp' } as const;
  const tones = { morning: 'bg-gold-soft', afternoon: 'bg-wish-soft', evening: 'bg-story-soft', today: 'bg-primary-soft' } as const;
  return (
    <Card className="overflow-hidden p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold text-ink">
        <img src="/images/logo-co.webp" alt="" aria-hidden className="size-7 object-contain" draggable={false} />{t('quickTitle')}
      </h2>
      <ul className="grid grid-cols-4 gap-2">
        {SLOT_ORDER.map((code) => {
          const done = entries.some((e) => e.titleCode === code);
          const active = code === titleCode;
          return (
            <li key={code} className={cn('relative flex flex-col items-center gap-1 rounded-2xl px-1 pb-1.5 pt-2 text-center text-[0.7rem] font-semibold whitespace-nowrap', cn(tones[code], 'text-ink', active && 'ring-2 ring-primary'))}>
              {done ? <Check className="absolute right-1 top-1 size-3.5 rounded-full bg-surface p-0.5 text-success" aria-hidden /> : null}
              <img src={icons[code]} alt="" aria-hidden className="size-9 object-contain" draggable={false} />
              {t(`slot.${code}`)}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-col items-center rounded-2xl bg-linear-to-b from-gold-soft to-wish-soft px-3 pb-3 pt-2 text-center">
        <img src="/images/than-tai.webp" alt="" aria-hidden className="h-24 w-auto animate-float object-contain" draggable={false} />
        <p className="mt-1 font-display text-xl font-extrabold text-wish-strong">{t('received')}</p>
        <p className="text-[0.78rem] font-medium text-ink">{t('quickHint')}</p>
      </div>
      <Button variant="wish" size="lg" className="mt-3 w-full" onClick={() => dispatch(wishDialogToggled(true))}>✨ {t(`cta.${titleCode}`)}</Button>
    </Card>
  );
}
