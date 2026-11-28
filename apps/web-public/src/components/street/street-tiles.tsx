'use client';

import { cn } from '@xin-via/ui';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { useRitual } from '@/features/ritual/use-ritual';
import { useAppDispatch } from '@/store/hooks';

/** Kiểu ô theo ảnh thiết kế trang chủ: viên thuốc bo tròn, nền trắng ngả tím nhạt có viền sáng, biểu tượng lớn bên trái, chữ đậm. */
const TILE =
  'flex min-w-0 items-center justify-center gap-2 rounded-full bg-linear-to-br from-surface via-surface to-story-soft px-2.5 text-left font-display font-extrabold leading-tight text-ink shadow-[0_6px_14px_rgb(60_40_120/0.18)] ring-2 ring-surface/90 transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgb(60_40_120/0.26)] active:scale-95';

/** Đốt vía và Thỉnh Thần Tài (như trang chủ): màu riêng, viền vàng, cao hơn các ô khác. */
const FEATURED = {
  burn: 'border-2 border-gold shadow-cta bg-linear-to-b from-fire-top via-fire-mid to-fire-bottom text-on-wish',
  invoke: 'border-2 border-gold shadow-cta bg-linear-to-b from-gold-bright via-gold to-gold-deep text-on-gold',
} as const;

/**
 * Hàng ô lối tắt của Phố 3D: Kể khổ · Khoe doanh thu · Đốt vía · Thỉnh Thần Tài · Tạo cửa hàng 3D · Bảng xếp hạng · Thử thách (luôn hiện).
 * - `overlay` (máy tính từ 1280px): một hàng nằm đáy cảnh phố.
 * - `below` (nhỏ hơn 1280px): theo cách của hàng nút trang chủ. Đốt vía và Thỉnh Thần Tài luôn đứng đầu, to và nổi bật, nằm giữa mép dưới ảnh và phần nội dung bên dưới
 *   (đè lên ảnh một nửa); các ô còn lại ở hàng dưới: điện thoại 2 cột (ô lẻ cuối trải đủ hai cột), từ iPad dọc thì xuống dòng và căn giữa.
 */
export function StreetTiles({ layout }: { layout: 'overlay' | 'below' }) {
  const t = useTranslations('street.hud.tiles');
  const dispatch = useAppDispatch();
  const { request } = useRitual();
  const below = layout === 'below';
  const tile = (featured: 'burn' | 'invoke' | null) => cn(
    TILE,
    below ? 'h-14 text-[0.82rem] sm:text-sm md:h-16 md:flex-none md:px-6 md:text-[0.95rem]' : 'h-16 flex-1 text-[0.98rem]',
    below && (featured ? 'order-1 md:h-[5rem] md:max-xl:h-[4.5rem] text-[1.05rem] md:text-[1.2rem]' : 'order-3'),
    featured && below && FEATURED[featured],
  );
  const img = (src: string) => <img src={src} alt="" aria-hidden className={cn('shrink-0 object-contain drop-shadow', below ? 'size-8 md:size-9' : 'size-9')} draggable={false} />;
  const items: { key: string; icon: string; label: string; featured?: 'burn' | 'invoke'; href?: string; onClick?: () => void }[] = [
    { key: 'story', icon: 'ic-laugh', label: t('story'), onClick: () => dispatch(composerOpened({ kind: 'story' })) },
    { key: 'brag', icon: 'ic-trophy', label: t('brag'), onClick: () => dispatch(composerOpened({ kind: 'brag' })) },
    { key: 'send', icon: 'ic-fire', label: t('send'), featured: 'burn', onClick: () => void request('burn') },
    { key: 'receive', icon: 'ic-pray', label: t('receive'), featured: 'invoke', onClick: () => void request('invoke') },
    { key: 'create', icon: 'ic-home', label: t('create'), href: '/tao-diem' },
    { key: 'rank', icon: 'ic-crown', label: t('rank'), href: '/bang-xep-hang' },
    { key: 'challenge', icon: 'ic-medal-1', label: t('challenge'), href: '/su-kien' },
  ];
  return (
    <div
      data-testid={below ? 'street-tiles-below' : 'street-tiles'}
      className={below ? 'relative z-30 -mt-6 grid grid-cols-2 items-end gap-2.5 md:-mt-10 md:flex md:flex-wrap md:justify-center md:gap-3 xl:hidden [&>:last-child:nth-child(odd)]:col-span-2' : 'absolute inset-x-4 bottom-3 z-10 hidden gap-2 xl:flex'}
    >
      {below ? <span aria-hidden className="order-2 hidden basis-full md:block" /> : null}
      {items.map((it) => {
        const content = <>{img(`/images/${it.icon}.webp`)}<span className="min-w-0 leading-tight">{it.label}</span></>;
        return it.href ? (
          <Link key={it.key} href={it.href} className={tile(null)}>{content}</Link>
        ) : (
          <button key={it.key} type="button" className={tile(it.featured ?? null)} data-testid={it.featured ? `street-${it.featured}` : undefined} onClick={it.onClick}>{content}</button>
        );
      })}
    </div>
  );
}
