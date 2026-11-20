import type { IconKey, SceneModelKey } from '@chot-via/shared';
import { cn } from '../lib/cn';
import { ICON_GLYPHS } from '../lib/icons';

export function AppIcon({ iconKey, className }: { iconKey: IconKey; className?: string }) {
  return <span className={cn('inline-block leading-none', className)} aria-hidden>{ICON_GLYPHS[iconKey]}</span>;
}

/** Cỏ bốn lá (vẽ lại bằng vector, thay bằng logo chính thức khi có). */
export function CloverMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('size-10', className)} aria-hidden>
      <g className="fill-primary stroke-primary-strong" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M50 46 C30 46 14 38 14 24 C14 12 30 8 40 18 C46 24 50 34 50 46Z" />
        <path d="M50 46 C70 46 86 38 86 24 C86 12 70 8 60 18 C54 24 50 34 50 46Z" />
        <path d="M50 54 C30 54 14 62 14 76 C14 88 30 92 40 82 C46 76 50 66 50 54Z" />
        <path d="M50 54 C70 54 86 62 86 76 C86 88 70 92 60 82 C54 76 50 66 50 54Z" />
      </g>
      <path d="M50 52 C52 70 58 84 66 94" className="stroke-primary-strong" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ name, tagline, compact, markSrc }: { name: string; tagline: string; compact?: boolean; markSrc?: string }) {
  return (
    <span className="flex items-center gap-2">
      {markSrc ? <img src={markSrc} alt="" aria-hidden className={compact ? 'size-9 object-contain' : 'size-[4.1rem] object-contain'} draggable={false} /> : <CloverMark className={compact ? 'size-8' : 'size-10'} />}
      <span className="flex flex-col leading-none">
        <span className={cn('font-display font-extrabold text-primary-strong', compact ? 'text-2xl' : 'text-[2.6rem] italic tracking-tight text-outline')}>{name}</span>
        {compact ? null : <span className="mt-1 text-[0.75rem] font-semibold text-ink">{tagline}</span>}
      </span>
    </span>
  );
}

/** Thần Tài (ảnh tách từ bộ thiết kế, đặt tại /images/than-tai.webp của ứng dụng web). */
export function DeityAvatar({ className, glow, src = '/images/than-tai.webp' }: { className?: string; glow?: boolean; src?: string }) {
  return <img src={src} alt="" aria-hidden className={cn('h-auto w-full select-none object-contain', glow && 'animate-float', className)} draggable={false} />;
}

/** Ảnh mặt tiền theo mẫu cửa hàng (đặt tại /images của ứng dụng web). */
export const SHOP_IMAGES: Record<SceneModelKey, string> = {
  cafe: '/images/shop-quan-cafe.webp', fashion: '/images/shop-thoi-trang.webp', minimart: '/images/shop-minimart.webp', restaurant: '/images/shop-nha-hang.webp',
  pharmacy: '/images/cua-hang-mau.webp', retail: '/images/cua-hang-mau.webp', sale_office: '/images/shop-van-phong-sale.webp', generic: '/images/cua-hang-mau.webp',
};

/** Mặt tiền cửa hàng/văn phòng theo mẫu; dùng cho thẻ điểm, danh sách và trang tạo điểm. */
export function PlaceIllustration({ modelKey, className }: { modelKey: SceneModelKey; className?: string }) {
  return <img src={SHOP_IMAGES[modelKey]} alt="" aria-hidden draggable={false} className={cn('h-auto w-full select-none object-contain', className)} />;
}
