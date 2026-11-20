'use client';

import type { PlaceSummary, SceneModelKey } from '@chot-via/shared';
import { SHOP_IMAGES, cn, compactCount } from '@chot-via/ui';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import type { StreetSceneProps } from '@chot-via/scene-3d';

/** Khung cảnh Phố Chốt Vía 3D theo tỷ lệ của thiết kế (rộng : cao = 2,5 : 1). */
export const STAGE_RATIO = 2.5;

interface ShopLayer { key: SceneModelKey; src: string; left: number; width: number; bottom: number; ratio: number }

/** Các cửa hàng xếp lớp trên nền phố (toạ độ theo % khung cảnh); thứ tự trong mảng là thứ tự vẽ từ xa tới gần. */
const BACK_SHOPS: readonly ShopLayer[] = [
  { key: 'restaurant', src: '/images/shop-nha-hang.webp', left: 37, width: 15, bottom: 42, ratio: 1000 / 667 },
  { key: 'fashion', src: '/images/shop-thoi-trang.webp', left: 25, width: 19, bottom: 27, ratio: 1000 / 750 },
  { key: 'minimart', src: '/images/shop-minimart.webp', left: 60, width: 24, bottom: 27, ratio: 1000 / 721 },
];
const FRONT_SHOPS: readonly ShopLayer[] = [
  { key: 'cafe', src: '/images/shop-quan-cafe.webp', left: -4, width: 33, bottom: -4, ratio: 1000 / 667 },
  { key: 'sale_office', src: '/images/shop-van-phong-sale.webp', left: 77, width: 26, bottom: -2, ratio: 1000 / 667 },
];

export function findPlace(places: readonly PlaceSummary[], key: SceneModelKey): PlaceSummary | undefined {
  return places.find((p) => p.modelKey === key);
}

interface ShopStripProps {
  places: readonly PlaceSummary[];
  labels: StreetSceneProps['labels'];
  onSelectPlace: (id: string) => void;
  className?: string;
}

/**
 * Bản cảm ứng của nhãn "rê chuột" trên cảnh phố: thiết bị không có chuột (điện thoại, iPad) không có hover nên tên và số vía của từng cửa hàng
 * hiện thành một hàng nhãn chạm được (RESP-01: cùng thông tin, chỉ khác cách hiển thị). Thiết bị có chuột thì ẩn hàng này và dùng nhãn hover.
 */
export function ShopLabelStrip({ places, labels, onSelectPlace, className }: ShopStripProps) {
  const t = useTranslations('home');
  if (places.length === 0) return null;
  return (
    <ul className={cn('flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none [@media(hover:hover)]:hidden', className)} aria-label={t('shopStrip')} data-testid="shop-strip">
      {places.map((place) => (
        <li key={place.id} className="shrink-0">
          <button type="button" aria-label={labels.open(place.title)} onClick={() => onSelectPlace(place.id)}
            className="flex h-10 items-center gap-2 rounded-full bg-surface px-3 text-left shadow-card ring-1 ring-border/60 transition active:scale-95">
            <img src={SHOP_IMAGES[place.modelKey]} alt="" aria-hidden className="size-7 shrink-0 object-contain" draggable={false} />
            <span className="flex flex-col leading-tight">
              <span className="max-w-[9.5rem] truncate text-xs font-bold text-ink">{place.title}</span>
              <span className="whitespace-nowrap text-[0.65rem] font-semibold text-ink-muted">{compactCount(place.wishCount)} {t('viaUnit')}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

interface StreetStageProps {
  places: readonly PlaceSummary[];
  labels: StreetSceneProps['labels'];
  onSelectPlace: (id: string) => void;
  onSelectDeity: () => void;
  /** Điểm đang chọn (được tô sáng). */
  selectedId?: string | null;
  /** Khi đang tìm/lọc: cửa hàng không khớp hiện mờ và không bấm được. */
  dimMissing?: boolean;
  /** Nhãn nổi (Đang hot · số vía) cạnh Quán Cafe và Văn phòng Sale. */
  showChips?: boolean;
  /** Kiểu hero trang chủ: trên điện thoại dùng Thần Tài nửa người (to hơn) và tia sáng phía sau, như ảnh thiết kế. */
  hero?: boolean;
  /** Lớp phủ đặt trong khung cảnh (tiêu đề, bong bóng…), dùng đơn vị cqw theo bề rộng khung. */
  children?: ReactNode;
}

/** Cảnh phố nhiều lớp dùng chung cho trang chủ và trang Phố 3D: nền phố + từng cửa hàng + Thần Tài (đều bấm được). */
export function StreetStage({ places, labels, onSelectPlace, onSelectDeity, selectedId = null, dimMissing = false, showChips = false, hero = false, children }: StreetStageProps) {
  const t = useTranslations('home');

  const renderShop = (layer: ShopLayer) => {
    const place = findPlace(places, layer.key);
    const dimmed = dimMissing && !place;
    const style: CSSProperties = { left: `${layer.left}%`, width: `${layer.width}%`, bottom: `${layer.bottom}%`, aspectRatio: String(layer.ratio) };
    const selected = place !== undefined && place.id === selectedId;
    const img = (
      <img src={layer.src} alt="" aria-hidden draggable={false}
        className={cn('size-full select-none object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)] transition', dimmed && 'opacity-35 grayscale', selected && '[filter:drop-shadow(0_0_14px_var(--color-gold))]')} />
    );
    if (!place) return <div key={layer.key} className="absolute" style={style}>{img}</div>;
    return (
      <button
        key={layer.key} type="button" aria-label={labels.open(place.title)} style={style} onClick={() => onSelectPlace(place.id)}
        className="group absolute origin-bottom outline-offset-2 transition duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-primary"
      >
        {img}
        <span className="pointer-events-none absolute left-1/2 top-[8%] hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink shadow-card group-hover:block group-focus-visible:block">
          {place.title} · {labels.wishCount(place.wishCount)}
        </span>
      </button>
    );
  };

  const chip = (key: SceneModelKey, icon: string, style: CSSProperties) => {
    const place = findPlace(places, key);
    if (!place) return null;
    return (
      <button
        key={key} type="button" style={style} onClick={() => onSelectPlace(place.id)}
        className="absolute z-20 hidden max-w-[19cqw] items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-left shadow-card transition hover:scale-105 md:flex"
      >
        <img src={icon} alt="" aria-hidden className="size-7 object-contain" draggable={false} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[clamp(0.6rem,1.15cqw,0.9rem)] font-bold text-ink">{place.title}</span>
          <span className="whitespace-nowrap text-[clamp(0.55rem,0.95cqw,0.75rem)] font-semibold text-ink-muted">🔥 {t('hot')} · {compactCount(place.wishCount)} {t('viaUnit')}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 [container-type:inline-size]" style={{ aspectRatio: String(STAGE_RATIO) }}>
      <img src="/images/pho-nen.webp" alt="" aria-hidden className="absolute inset-0 size-full select-none object-cover" draggable={false} fetchPriority="high" />
      {BACK_SHOPS.map(renderShop)}
      {hero ? <div aria-hidden className="pointer-events-none absolute left-[24%] top-[-10%] aspect-square w-[52%] rounded-full opacity-95 [background:repeating-conic-gradient(color-mix(in_srgb,var(--color-gold)_75%,white)_0deg_6deg,transparent_6deg_15deg)] [mask-image:radial-gradient(circle,black_30%,transparent_72%)] md:hidden" /> : null}
      <button
        type="button" aria-label={labels.deity} onClick={onSelectDeity}
        className={cn('absolute origin-bottom outline-offset-2 transition duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-primary',
          hero && 'left-[36%] bottom-[27%] w-[28%] aspect-[1100/834] md:left-[40%] md:bottom-[17%] md:w-[20%] md:aspect-[797/900]')}
        style={hero ? undefined : { left: '40%', width: '20%', bottom: '17%', aspectRatio: String(797 / 900) }}
      >
        {hero ? <img src="/images/than-tai.webp" alt="" aria-hidden className="size-full animate-float select-none object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.2)] md:hidden" draggable={false} /> : null}
        <img src="/images/than-tai-bo-dung.webp" alt="" aria-hidden className={cn('size-full animate-float select-none object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.2)]', hero && 'hidden md:block')} draggable={false} />
      </button>
      {FRONT_SHOPS.map(renderShop)}
      {showChips ? chip('cafe', '/images/ic-laugh.webp', { left: '11%', bottom: '9%' }) : null}
      {showChips ? chip('sale_office', '/images/ic-trophy.webp', { left: '82%', bottom: '12%' }) : null}
      {children}
    </div>
  );
}
