import { DeityAvatar, PlaceIllustration, cn } from '@xin-via/ui';
import type { ReactNode } from 'react';
import type { StreetSceneProps } from './types';

type Place = StreetSceneProps['places'][number];

/**
 * Bản 2D của Phố: hero trang chủ (tải tức thì) và fallback khi máy không hỗ trợ WebGL.
 * Điện thoại: Thần Tài ở giữa phía trên, các cửa hàng cuộn ngang bên dưới. iPad trở lên: một hàng, Thần Tài ở giữa các dãy nhà.
 */
export function Street2D({ places, dimmedIds, selectedId, onSelectPlace, onSelectDeity, labels, className, children }: StreetSceneProps & { children?: ReactNode }) {
  const half = Math.ceil(places.length / 2);

  const shop = (place: Place, extra?: string) => (
    <button
      key={place.id} type="button" onClick={() => onSelectPlace(place.id)} aria-label={labels.open(place.title)}
      className={cn(
        'group flex w-[6.5rem] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl p-1.5 transition hover:-translate-y-1 sm:w-32 lg:w-28 xl:w-36 3xl:w-44',
        dimmedIds.has(place.id) && 'opacity-40', selectedId === place.id && 'bg-surface/80 ring-4 ring-gold', extra,
      )}
    >
      <PlaceIllustration modelKey={place.modelKey} className="drop-shadow-md" />
      <span className="line-clamp-2 rounded-full bg-surface px-2.5 py-0.5 text-center font-display text-xs font-bold leading-tight text-ink shadow-card sm:text-sm">{place.title}</span>
      {place.isDemo ? <span className="rounded-full bg-gold-soft px-2 text-[0.65rem] font-bold text-gold-strong">{labels.demo}</span> : null}
    </button>
  );

  const deity = (width: string) => (
    <button type="button" onClick={onSelectDeity} aria-label={labels.open(labels.deity)} className={cn('relative flex shrink-0 snap-center flex-col items-center', width)}>
      <DeityAvatar glow className="drop-shadow-xl" />
      <span className="-mt-2 rounded-full bg-wish px-4 py-1 font-display text-base font-extrabold text-on-wish shadow-cta sm:text-lg">{labels.deity}</span>
    </button>
  );

  return (
    <div className={cn('relative isolate overflow-hidden bg-linear-to-b from-scene-sky via-app to-scene-ground', className)}>
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-scene-road/80" aria-hidden />
      <div className="absolute inset-x-0 bottom-[22%] h-2 bg-scene-sidewalk" aria-hidden />

      {/* Điện thoại */}
      <div className="relative flex h-full flex-col items-center justify-end gap-2 pb-[5.5rem] pt-[5.5rem] md:hidden">
        {deity('w-32')}
        <div className="flex w-full snap-x gap-1 overflow-x-auto px-3 scrollbar-none">{places.map((p) => shop(p))}</div>
      </div>

      {/* iPad / desktop / màn lớn */}
      <div className="relative hidden h-full snap-x items-end gap-2 overflow-x-auto px-4 pb-[9.5rem] pt-6 scrollbar-none md:flex xl:justify-center 3xl:pb-[12rem]">
        {places.slice(0, half).map((p) => shop(p))}
        {deity('mx-1 w-40 lg:w-48 3xl:w-60')}
        {places.slice(half).map((p) => shop(p))}
      </div>
      {children}
    </div>
  );
}
