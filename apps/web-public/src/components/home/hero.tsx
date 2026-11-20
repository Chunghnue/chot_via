'use client';

import { DEFAULT_HOME_CONFIG, type HomeActionDto, type HomeDto, type StreetSlotDto } from '@chot-via/shared';
import { Button, cn } from '@chot-via/ui';
import { GlbStreetView } from '@chot-via/scene-3d';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { useGlbLabels, useStreetLabels } from '@/components/place/use-street-labels';
import { composerOpened } from '@/features/composer/composerSlice';
import { placeSheetOpened, wishDialogToggled } from '@/features/ui/uiSlice';
import { useAppDispatch } from '@/store/hooks';
import { useWishTitle } from '@/features/wish/use-deity-wish';
import { useCurrentUser } from '@/lib/use-member';

/** Tỉ lệ ảnh phố thiết kế (pho-3d-hero.png): vùng bấm tính theo % khung ảnh nên luôn khớp dù khung hero bị cắt ở các cỡ màn khác nhau. */
const HERO_IMAGE_RATIO = 1672 / 941;

function RegionButton({ slot, onOpen, label }: { slot: StreetSlotDto; onOpen: (placeId: string) => void; label: string }) {
  if (slot.placeId === null || slot.region.w <= 0 || slot.region.h <= 0) return null;
  const placeId = slot.placeId;
  return (
    <button
      type="button" aria-label={label} onClick={() => onOpen(placeId)}
      className="group absolute rounded-2xl outline-offset-2 transition hover:bg-gold/10 hover:ring-2 hover:ring-gold/70 focus-visible:outline-2 focus-visible:outline-primary"
      style={{ left: `${slot.region.x}%`, top: `${slot.region.y}%`, width: `${slot.region.w}%`, height: `${slot.region.h}%` }}
    >
      <span className="pointer-events-none absolute left-1/2 top-[6%] hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink shadow-card group-hover:block group-focus-visible:block">{slot.label}</span>
    </button>
  );
}

/** Hero Phố Chốt Vía 3D: ảnh phố theo thiết kế (cửa hàng và Thần Tài bấm được), "Ghé phố 3D" mở cảnh WebGL dựng từ file GLB; nút Xin vía luôn nổi bật nhất. */
export function HomeHero({ home }: { home: HomeDto | undefined }) {
  const t = useTranslations('home');
  const dispatch = useAppDispatch();
  const labels = useStreetLabels();
  const glbLabels = useGlbLabels();
  const tw = useTranslations('wish');
  const { titleCode } = useWishTitle();
  const [view3d, setView3d] = useState(false);
  const config = home?.layout.config ?? DEFAULT_HOME_CONFIG;
  const slots = home?.layout.street ?? [];
  const openPlace = (id: string): void => { dispatch(placeSheetOpened({ placeId: id })); };
  const openWish = (): void => { dispatch(wishDialogToggled(true)); };
  const imageStage = (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: `max(100cqw, calc(100cqh * ${HERO_IMAGE_RATIO}))`, height: `max(100cqh, calc(100cqw / ${HERO_IMAGE_RATIO}))` }}
    >
      <img src={config.heroImageUrl} alt="" aria-hidden className="absolute inset-0 size-full select-none object-cover" draggable={false} fetchPriority="high" />
      {slots.map((slot) => <RegionButton key={slot.id} slot={slot} onOpen={openPlace} label={labels.open(slot.label)} />)}
      <button
        type="button" aria-label={labels.deity} onClick={openWish}
        className="absolute rounded-full outline-offset-2 transition hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-primary"
        style={{ left: `${config.deityRegion.x}%`, top: `${config.deityRegion.y}%`, width: `${config.deityRegion.w}%`, height: `${config.deityRegion.h}%` }}
      />
    </div>
  );

  return (
    <section aria-label={t('heroAlt')} className="relative isolate overflow-hidden rounded-sheet bg-surface-muted shadow-card">
      <div className="relative aspect-[555/470] w-full [container-type:size] sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[2.3/1] xl:aspect-[2.5/1]">
        {view3d ? (
          <GlbStreetView
            className="absolute inset-0" config={config} slots={slots} onSelectPlace={openPlace} onSelectDeity={openWish} labels={glbLabels}
            fallback={imageStage}
          />
        ) : imageStage}
        <div className="pointer-events-none absolute inset-x-0 top-[3%] flex flex-col items-center gap-[1.2cqw] text-center">
          <h1 className="font-display text-[clamp(1.1rem,5.6cqw,5.2rem)] font-extrabold leading-none text-title-light md:text-title md:text-[clamp(1.9rem,5.6cqw,5.2rem)]">{config.heroTitle}</h1>
          <p className="rounded-full border-2 border-surface bg-gold px-[1.2cqw] py-[0.2cqw] text-[clamp(0.55rem,1.65cqw,1.4rem)] font-bold text-on-gold shadow-card md:border-0 md:px-[1.6cqw] md:py-[0.2cqw] md:text-[clamp(0.7rem,1.7cqw,1.4rem)]">{config.heroSubtitle}</p>
        </div>
        {!view3d && config.signLines.length > 0 ? (
          <div aria-hidden className="pointer-events-none absolute right-[3%] top-[10%] hidden flex-col items-center md:flex">
            <span className="h-[2cqw] w-[0.5cqw] bg-[#7a4a23]" />
            <div className="flex flex-col items-center gap-[0.3cqw] rounded-[1cqw] border-[0.4cqw] border-[#7a4a23] bg-[#d9a15f] px-[1.8cqw] py-[1cqw] shadow-card [background-image:repeating-linear-gradient(90deg,transparent_0_2.4cqw,rgb(122_74_35/0.18)_2.4cqw_2.6cqw)]">
              {config.signLines.map((line) => <span key={line} className="whitespace-nowrap font-display text-[clamp(0.6rem,1.5cqw,1.3rem)] font-extrabold text-[#4a2a10]">{line}</span>)}
            </div>
          </div>
        ) : null}
        <Button
          type="button" variant="soft" size="sm" aria-pressed={view3d} onClick={() => setView3d((v) => !v)}
          className="absolute left-[2%] top-[3%] z-10 shadow-card"
        >{view3d ? t('backToImage') : t('visit3d')}</Button>
        {view3d ? null : HERO_COINS.map((c) => (
          <img key={`${c.x}-${c.y}`} src="/images/ic-coin.webp" alt="" aria-hidden draggable={false}
            className="pointer-events-none absolute animate-float object-contain drop-shadow-md md:hidden" style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}cqw`, animationDelay: `${c.d}s` }} />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-[7%] flex flex-col items-center gap-[2.4cqw] px-[7%] md:bottom-[12%] md:gap-1.5 md:px-3">
          <div className="relative w-full md:w-auto">
            <span aria-hidden className="pointer-events-none absolute inset-x-[-4%] -bottom-[36%] h-[90%] rounded-[50%] border-[0.6cqw] border-gold/70 bg-[radial-gradient(ellipse_at_center,var(--color-gold)_0%,transparent_70%)] opacity-90 blur-[1px] md:hidden" />
            <span aria-hidden className="pointer-events-none absolute inset-x-[2%] -bottom-[24%] h-[70%] rounded-[50%] border-[0.5cqw] border-surface/70 md:hidden" />
            <Button variant="wish" size="lg" className="pointer-events-auto animate-glow relative h-[17cqw] w-full border-[0.9cqw] border-surface bg-linear-to-b from-[color-mix(in_srgb,var(--color-wish)_72%,white)] via-wish to-wish-strong px-4 text-[clamp(1.1rem,6.1cqw,2.2rem)] shadow-[0_0_0_0.9cqw_var(--color-gold),inset_0_0.8cqw_0_rgb(255_255_255/0.35),0_2.4cqw_5cqw_rgb(242_80_26/0.55)] md:h-14 md:w-auto md:border-0 md:bg-linear-to-b md:from-wish md:via-wish md:to-wish-strong md:px-12 md:text-2xl md:shadow-cta xl:h-[4.25rem] xl:px-16 xl:text-3xl" onClick={openWish}>
              <img src="/images/ic-pray.webp" alt="" aria-hidden className="size-[1.5em] object-contain" draggable={false} />{tw(`title.${titleCode}`)}
              <PointerHand />
            </Button>
          </div>
          <p className="relative z-10 text-center text-[clamp(0.65rem,3.3cqw,0.95rem)] font-bold text-on-primary [text-shadow:0_1px_2px_rgb(0_0_0/0.75),0_0_8px_rgb(0_0_0/0.4)] md:rounded-full md:bg-surface/90 md:px-3 md:py-0.5 md:text-xs md:font-semibold md:text-ink-muted md:[text-shadow:none]">{config.ctaHint}<span aria-hidden className="md:hidden"> ✨</span></p>
        </div>
      </div>
    </section>
  );
}

/** Đồng xu bay quanh Thần Tài trên điện thoại (toạ độ % theo khung hero, w theo cqw). */
const HERO_COINS = [
  { x: 22, y: 56, w: 9, d: 0 }, { x: 25, y: 38, w: 6, d: 0.6 }, { x: 70, y: 50, w: 8, d: 1.1 },
  { x: 76, y: 63, w: 6, d: 0.3 }, { x: 66, y: 32, w: 5, d: 0.9 }, { x: 33, y: 27, w: 4, d: 1.5 },
] as const;

/** Bàn tay chỉ trỏ ở cuối nút (ảnh thiết kế). Đặt file 3D vào /images/ic-pointer.webp rồi gán đường dẫn vào đây để thay emoji tạm. */
const POINTER_IMAGE: string | null = null;
function PointerHand() {
  return (
    <span aria-hidden className="pointer-events-none absolute -bottom-[62%] -right-[2%] w-[2.3em] drop-shadow-md md:hidden">
      {POINTER_IMAGE ? <img src={POINTER_IMAGE} alt="" className="size-full object-contain" draggable={false} /> : (
        <svg viewBox="0 0 64 64" className="size-full">
          <g className="fill-surface stroke-ink" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" transform="rotate(-24 32 36)">
            <rect x="37" y="26" width="9" height="16" rx="4.5" />
            <rect x="45" y="29" width="8" height="14" rx="4" />
            <rect x="26" y="4" width="11" height="34" rx="5.5" />
            <path d="M20 32 h26 q5 0 5 5 v10 q0 8 -9 8 h-12 q-9 0 -9 -8 z" />
            <path d="M21 40 q-9 -5 -12 1 q1 7 12 11" />
            <rect x="20" y="55" width="30" height="7" rx="3" />
          </g>
        </svg>
      )}
    </span>
  );
}

/** Lớp hiển thị theo thiết bị: điện thoại < md, iPad = md..xl, máy tính >= xl (RESP-01). */
function deviceClass(a: HomeActionDto): string {
  return cn(!a.showMobile && 'max-md:hidden', !a.showTablet && 'md:max-xl:hidden', !a.showDesktop && 'xl:hidden');
}

/**
 * Hàng nút hành động dưới hero (Kể khổ · Khoe doanh thu / Deal · Gửi vía · Nhận vía · Thử thách · Tạo cửa hàng 3D): nội dung và thiết bị hiển thị do admin cấu hình.
 * Số cột bằng số nút hiển thị trên từng loại thiết bị; khi cột giữa của máy tính hẹp (< 56rem) thì xuống 3 cột × 2 hàng để chữ không bị bóp.
 */
export function ActionCards({ actions }: { actions: readonly HomeActionDto[] }) {
  const t = useTranslations('home');
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const role = user?.memberRole ?? null;
  const count = (pick: (a: HomeActionDto) => boolean): number => Math.max(1, actions.filter(pick).length);
  const vars = { '--cm': Math.min(3, count((a) => a.showMobile)), '--ct': count((a) => a.showTablet), '--cd': count((a) => a.showDesktop) } as React.CSSProperties;
  const base = 'flex min-w-0 items-center gap-2 rounded-2xl bg-linear-to-b from-primary-soft to-surface p-2 shadow-card ring-1 ring-border/60 transition active:scale-[0.97] max-md:flex-col max-md:text-center md:rounded-full md:pr-4';

  const inner = (a: HomeActionDto, title: string) => (
    <>
      {a.iconUrl ? <img src={a.iconUrl} alt="" aria-hidden className="size-9 shrink-0 object-contain md:size-10" draggable={false} /> : null}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-display text-[0.7rem] font-extrabold leading-tight text-ink sm:text-xs md:text-[0.85rem] xl:text-[0.95rem]">{title}</span>
        {a.subLabel ? <span className="hidden text-xs font-medium leading-tight text-ink-muted @min-[56rem]:block">{a.subLabel}</span> : null}
      </span>
    </>
  );

  return (
    <div className="@container relative z-10 -mt-5 md:-mt-8 xl:-mt-9">
      <nav
        aria-label={t('actions.label')} style={vars}
        className="grid grid-cols-[repeat(var(--cm),minmax(0,1fr))] gap-2 px-2 sm:px-4 md:grid-cols-[repeat(var(--ct),minmax(0,1fr))] md:gap-3 md:px-5 xl:grid-cols-[repeat(var(--cd),minmax(0,1fr))] xl:gap-3 xl:px-6 @max-[56rem]:xl:grid-cols-3"
      >
        {actions.map((a) => {
          const cls = cn(base, deviceClass(a));
          const title = a.kind === 'brag' && role === 'owner' ? t('actions.bragOwner') : a.kind === 'brag' && role === 'sale' ? t('actions.bragSale') : a.label;
          if (a.kind === 'story') return <button key={a.code} type="button" className={cls} onClick={() => dispatch(composerOpened({ kind: 'story' }))}>{inner(a, title)}</button>;
          if (a.kind === 'brag') return <button key={a.code} type="button" className={cls} onClick={() => dispatch(composerOpened(role ? { kind: 'brag', role } : { kind: 'brag' }))}>{inner(a, title)}</button>;
          if (a.kind === 'wish') return <button key={a.code} type="button" className={cls} onClick={() => dispatch(wishDialogToggled(true))}>{inner(a, title)}</button>;
          return <Link key={a.code} href={a.href ?? '/'} className={cls}>{inner(a, title)}</Link>;
        })}
      </nav>
    </div>
  );
}
