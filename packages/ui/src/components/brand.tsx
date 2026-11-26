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
      {markSrc ? (
        <img src={markSrc} alt="" aria-hidden className={compact ? 'size-9 object-contain' : 'size-[4.1rem] object-contain'} draggable={false} />
      ) : (
        <CloverMark className={compact ? 'size-8' : 'size-10'} />
      )}
      <span className="flex flex-col leading-none">
        <span className={cn('font-display font-extrabold text-primary-strong', compact ? 'text-2xl' : 'text-[2.6rem] italic tracking-tight text-outline')}>{name}</span>
        {compact ? null : <span className="mt-1 text-[0.8rem] font-bold italic tracking-tight text-ink">{tagline}</span>}
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
  pharmacy: '/images/pho/nha-thuoc.webp', retail: '/images/cua-hang-mau.webp', sale_office: '/images/shop-van-phong-sale.webp', generic: '/images/cua-hang-mau.webp',
};

/** Mặt tiền cửa hàng/văn phòng theo mẫu; dùng cho thẻ điểm, danh sách và trang tạo điểm. */
export function PlaceIllustration({ modelKey, className }: { modelKey: SceneModelKey; className?: string }) {
  return <img src={SHOP_IMAGES[modelKey]} alt="" aria-hidden draggable={false} className={cn('h-auto w-full select-none object-contain', className)} />;
}

/** Biểu tượng nhà cung cấp đăng nhập / mạng xã hội dùng chung (web, admin, chân trang): Google, Facebook, Zalo, TikTok. */
export type BrandKey = 'google' | 'facebook' | 'zalo' | 'tiktok' | 'messenger' | 'apple';

export function BrandIcon({ brand, className }: { brand: BrandKey; className?: string }) {
  if (brand === 'google') {
    return (
      <svg viewBox="0 0 48 48" className={cn('size-5 shrink-0', className)} aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
    );
  }
  if (brand === 'facebook')
    return (
      <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0 fill-current', className)} aria-hidden>
        <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" />
      </svg>
    );
  if (brand === 'tiktok')
    return (
      <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0 fill-current', className)} aria-hidden>
        <path d="M16.6 5.8c-.9-.6-1.5-1.5-1.7-2.6h-3v12.1c0 1.4-1.1 2.5-2.5 2.5S7 16.7 7 15.3s1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1V9.8c-.3 0-.5-.1-.8-.1-2.9 0-5.3 2.4-5.3 5.6S6.6 21 9.5 21s5.7-2.4 5.7-5.7V9.5c1.1.8 2.4 1.2 3.8 1.2V7.6c-.9 0-1.7-.3-2.4-.8z" />
      </svg>
    );
  if (brand === 'messenger')
    return (
      <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0 fill-current', className)} aria-hidden>
        <path d="M12 2C6.5 2 2 6.2 2 11.4c0 2.9 1.4 5.5 3.6 7.2V22l3.3-1.8c.9.2 1.9.4 3.1.4 5.5 0 10-4.2 10-9.4S17.500 2 12 2zm1 12.600-2.500-2.700-4.900 2.700 5.400-5.700 2.600 2.700 4.800-2.700z" />
      </svg>
    );
  if (brand === 'zalo') return <span aria-hidden className={cn('text-[0.7rem] font-extrabold leading-none', className)}>Zalo</span>;
  return <span aria-hidden className={cn('text-lg leading-none', className)}></span>;
}

/** Nhóm nút đăng nhập Google/Facebook (và Apple nếu bật) dùng chung cho web và admin. Chưa bật ở máy chủ thì nút vẫn hiện, bấm thì báo `onUnavailable`. */
export function OAuthButtons({ providers, enabled, hrefFor, label, onUnavailable }: {
  providers: readonly Exclude<BrandKey, 'zalo' | 'tiktok' | 'messenger'>[];
  enabled: Partial<Record<string, boolean>> | undefined;
  hrefFor: (provider: string) => string;
  label: (provider: string) => string;
  onUnavailable: (provider: string) => void;
}) {
  return (
    <>
      {providers.map((p) => {
        const cls = cn(
          'flex h-12 items-center justify-center gap-3 rounded-full text-sm font-bold transition active:scale-[0.98]',
          p === 'facebook' ? 'bg-brand-facebook text-on-primary hover:brightness-110' : 'border border-border bg-surface text-ink shadow-card hover:bg-surface-muted',
        );
        const inner = <><BrandIcon brand={p} />{label(p)}</>;
        return enabled?.[p] === true
          ? <a key={p} href={hrefFor(p)} className={cls}>{inner}</a>
          : <button key={p} type="button" className={cls} onClick={() => onUnavailable(p)}>{inner}</button>;
      })}
    </>
  );
}
