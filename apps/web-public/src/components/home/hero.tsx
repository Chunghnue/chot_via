'use client';

import { DEFAULT_HOME_CONFIG, DEFAULT_STREET_SLOTS, type HomeActionDto, type HomeDto, type StreetSlotDto } from '@xin-via/shared';
import { Button, cn } from '@xin-via/ui';
import { CityView, useSceneCapability } from '@xin-via/scene-3d';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { useStreetLabels } from '@/components/place/use-street-labels';
import { composerOpened } from '@/features/composer/composerSlice';
import { useRitual } from '@/features/ritual/use-ritual';
import { useRitualScene } from '@/features/ritual/use-ritual-scene';
import { placeSheetOpened, selectWishRequest, wishRequested } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useWishTitle } from '@/features/wish/use-deity-wish';
import { useCurrentUser } from '@/lib/use-member';
import { HeroSubtitle } from './hero-subtitle';
import { WoodSign } from './wood-sign';
import { HeroTitle } from './hero-title';

/** Tỉ lệ ảnh phố thiết kế (pho-3d-hero.png): vùng bấm tính theo % khung ảnh nên luôn khớp dù khung hero bị cắt ở các cỡ màn khác nhau. */
const HERO_IMAGE_RATIO = 1672 / 941;

function RegionButton({ slot, onOpen, label }: { slot: StreetSlotDto; onOpen: (placeId: string) => void; label: string }) {
  if (slot.placeId === null || slot.region.w <= 0 || slot.region.h <= 0) return null;
  const placeId = slot.placeId;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onOpen(placeId)}
      className="group absolute rounded-2xl outline-offset-2 transition hover:bg-gold/10 hover:ring-2 hover:ring-gold/70 focus-visible:outline-2 focus-visible:outline-primary"
      style={{ left: `${slot.region.x}%`, top: `${slot.region.y}%`, width: `${slot.region.w}%`, height: `${slot.region.h}%` }}
    >
      <span className="pointer-events-none absolute left-1/2 top-[6%] hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink shadow-card group-hover:block group-focus-visible:block">
        {slot.label}
      </span>
    </button>
  );
}

/**
 * Hero Phố Xin Vía 3D: luôn là thành phố 3D (cảnh WebGL dựng từ hình tách nền của bộ thiết kế): kéo để xoay đủ 360°, nút +/− để phóng to, nút ▲▼ để đi tới/lui, người đi lại.
 * Thiết bị không hỗ trợ WebGL thì hiện ảnh phố tĩnh (vùng bấm theo %). Nút Xin vía luôn nổi bật nhất.
 */
export function HomeHero({ home }: { home: HomeDto | undefined }) {
  const t = useTranslations('home');
  const dispatch = useAppDispatch();
  const labels = useStreetLabels();
  const tw = useTranslations('wish');
  const { titleCode } = useWishTitle();
  const capability = useSceneCapability();
  const wishRequest = useAppSelector(selectWishRequest);
  const ritualScene = useRitualScene();
  const config = home?.layout.config ?? DEFAULT_HOME_CONFIG;
  // Server mới chưa có ô cửa hàng nào thì vẫn hiện phố mặc định (không để phố trống).
  const slots = home && home.layout.street.length > 0 ? home.layout.street : DEFAULT_STREET_SLOTS;
  const openPlace = (id: string): void => { dispatch(placeSheetOpened({ placeId: id })); };
  const openWish = (): void => { dispatch(wishRequested()); };
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
      <div className="relative aspect-[10/9] w-full [container-type:size] sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[2.2/1] xl:aspect-[2.5/1]">
        <CityView
          className="absolute inset-0"
          config={config}
          slots={slots}
          fitHalfWidth={16}
          burstTick={wishRequest}
          {...ritualScene}
          onSelectPlace={openPlace}
          onSelectDeity={openWish}
          fallback={imageStage}
        />
        <div className="pointer-events-none absolute inset-x-0 top-[1%] flex flex-col items-center gap-[1.2cqw] text-center">
          <HeroTitle text={config.heroTitle} className="w-[min(88cqw,98cqh)]" />
          <HeroSubtitle text={config.heroSubtitle} className="-mt-[min(9cqw,11.5cqh)] w-[min(60cqw,68cqh)]" />
        </div>
        {config.signLines.length > 0 && capability.ready && !capability.supports3D ? (
          <div aria-hidden className="pointer-events-none absolute right-[3%] top-[34%] hidden w-[24cqw] md:block">
            <WoodSign lines={config.signLines} />
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-[7%] flex flex-col items-center gap-[2.4cqw] px-[7%] md:bottom-[12%] md:gap-1.5 md:px-3">
          <div className="relative w-full md:w-auto">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[-4%] -bottom-[36%] h-[90%] rounded-[50%] border-[0.6cqw] border-gold/70 bg-[radial-gradient(ellipse_at_center,var(--color-gold)_0%,transparent_70%)] opacity-90 blur-[1px] md:hidden"
            />
            <span aria-hidden className="pointer-events-none absolute inset-x-[2%] -bottom-[24%] h-[70%] rounded-[50%] border-[0.5cqw] border-surface/70 md:hidden" />
            <Button
              variant="wish"
              size="lg"
              aria-label={tw(`title.${titleCode}`)}
              className="pointer-events-auto animate-glow relative h-[15.5cqw] w-full border-[0.8cqw] border-surface/90 bg-linear-to-b from-cta-top via-cta-mid to-cta-bottom px-4 font-display text-[clamp(1rem,5.6cqw,2.2rem)] font-extrabold uppercase tracking-wide text-on-wish shadow-[0_0_0_0.9cqw_var(--color-cta-glow),0_0_5cqw_1.5cqw_rgb(255_212_59/0.55),inset_0_0.8cqw_0_rgb(255_255_255/0.35)] [text-shadow:0_0.4cqw_0_rgb(150_30_0/0.55)] md:h-14 md:w-auto md:border-[3px] md:px-12 md:text-2xl md:shadow-[0_0_0_4px_var(--color-cta-glow),0_0_28px_6px_rgb(255_212_59/0.5),inset_0_3px_0_rgb(255_255_255/0.35)] xl:h-[4.25rem] xl:px-16 xl:text-3xl"
              onClick={openWish}
            >
              {tw('titleLead')}
              <img src="/images/ic-pray.webp" alt="" aria-hidden className="size-[1.5em] object-contain normal-case drop-shadow" draggable={false} />
              {tw(`titleTail.${titleCode}`)}
            </Button>
          </div>
          <p className="relative z-10 text-center text-[clamp(0.65rem,3.3cqw,0.95rem)] font-bold text-ink [text-shadow:0_0_6px_rgb(255_255_255),0_0_10px_rgb(255_255_255/0.9),0_1px_0_rgb(255_255_255)] md:text-sm">
            {config.ctaHint}
            <span aria-hidden> ✨</span>
          </p>
        </div>
      </div>
    </section>
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
export function ActionCards({ actions: all }: { actions: readonly HomeActionDto[] }) {
  const t = useTranslations('home');
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const { request } = useRitual();
  const role = user?.memberRole ?? null;
  // Đốt vía và Thỉnh Thần Tài luôn hiện; chưa đăng nhập thì bấm vào sẽ được mời đăng nhập, chưa có cửa hàng thì dẫn đi tạo (xem useRitual).
  const actions = all;
  // Chưa có nút nào (database chưa nạp, hoặc admin tắt hết): không dựng khối rỗng, vì khối này kéo lên đè hero bằng lề âm.
  if (actions.length === 0) return null;
  const count = (pick: (a: HomeActionDto) => boolean): number => Math.max(1, actions.filter(pick).length);
  const vars = { '--cm': Math.min(6, count((a) => a.showMobile)), '--ct': count((a) => a.showTablet), '--cd': count((a) => a.showDesktop) } as React.CSSProperties;
  const base =
    'order-(--om) md:order-(--ot) xl:order-(--od) flex min-w-0 items-center justify-center gap-2.5 rounded-full max-md:h-14 md:flex-none md:px-6 xl:px-8 bg-linear-to-br from-surface via-surface to-story-soft p-2 shadow-[0_6px_14px_rgb(60_40_120/0.16)] ring-2 ring-surface/90 transition hover:-translate-y-0.5 active:scale-[0.97] md:max-xl:gap-2 md:max-xl:p-1.5 md:max-xl:px-4 md:whitespace-nowrap md:@max-[50rem]:min-w-[12rem] md:@max-[50rem]:flex-[0_0_calc(50%-0.4rem)] md:@max-[50rem]:max-w-[17rem]';

  const inner = (a: HomeActionDto, title: string, featured = false) => (
    <>
      {a.iconUrl ? (
        <img
          src={a.iconUrl}
          alt=""
          aria-hidden
          className={cn('shrink-0 object-contain', featured ? 'size-11 md:size-12 md:max-xl:size-10' : 'size-10 md:size-11 md:max-xl:size-8')}
          draggable={false}
        />
      ) : null}
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span
          className={cn(
            'font-display text-[0.82rem] font-extrabold leading-tight sm:text-xs md:text-[0.85rem] xl:text-[0.95rem]',
            featured ? cn('text-[1.05rem] md:text-[1.2rem] xl:text-[1.3rem]', a.kind === 'invoke' ? 'text-on-gold' : 'text-on-wish') : 'text-ink',
          )}
        >
          {title}
        </span>
        {a.subLabel ? (
          <span
            className={cn(
              'hidden text-xs font-medium leading-tight @min-[56rem]:block md:max-xl:block md:max-xl:text-[0.62rem]',
              featured ? (a.kind === 'invoke' ? 'text-on-gold/90' : 'text-on-wish/90') : 'text-ink-muted',
            )}
          >
            {a.subLabel}
          </span>
        ) : null}
      </span>
    </>
  );
  const orderStyle = (a: HomeActionDto, index: number): React.CSSProperties => ({ '--om': index, '--ot': a.sortTablet ?? index, '--od': a.sortDesktop ?? index } as React.CSSProperties);

  return (
    <div className="@container relative z-10 -mt-5 md:-mt-8 xl:-mt-9">
      <nav
        aria-label={t('actions.label')} style={vars}
        className="grid grid-cols-2 gap-2.5 px-2 sm:px-4 md:flex md:flex-wrap md:justify-center md:gap-3 md:px-5 xl:gap-4 xl:px-6 items-end"
      >
        {actions.map((a, index) => {
          const featured = a.kind === 'burn' || a.kind === 'invoke';
          // Đốt vía và Thỉnh Thần Tài: cùng một chiều cao, cao và nổi bật hơn các nút còn lại.
          const cls = cn(
            base,
            deviceClass(a),
            featured && 'h-14 border-2 border-gold shadow-cta md:h-[5rem] md:max-xl:h-[4.5rem]',
            featured ? '@max-[50rem]:order-1' : '@max-[50rem]:order-2',
            a.kind === 'burn' && 'bg-linear-to-b from-fire-top via-fire-mid to-fire-bottom',
            a.kind === 'invoke' && 'bg-linear-to-b from-gold-bright via-gold to-gold-deep',
          );
          const style = orderStyle(a, index);
          const title = a.kind === 'brag' && role === 'owner' ? t('actions.bragOwner') : a.kind === 'brag' && role === 'sale' ? t('actions.bragSale') : a.label;
          if (a.kind === 'story') return <button key={a.code} type="button" className={cls} style={style} onClick={() => dispatch(composerOpened({ kind: 'story' }))}>{inner(a, title)}</button>;
          if (a.kind === 'brag')
            return (
              <button key={a.code} type="button" className={cls} style={style} onClick={() => dispatch(composerOpened(role ? { kind: 'brag', role } : { kind: 'brag' }))}>
                {inner(a, title)}
              </button>
            );
          if (a.kind === 'burn' || a.kind === 'invoke')
            return (
              <button key={a.code} type="button" className={cls} style={style} data-testid={`action-${a.kind}`} onClick={() => void request(a.kind === 'burn' ? 'burn' : 'invoke')}>
                {inner(a, title, true)}
              </button>
            );
          if (a.kind === 'wish') return <button key={a.code} type="button" className={cls} style={style} onClick={() => dispatch(wishRequested())}>{inner(a, title)}</button>;
          return <Link key={a.code} href={a.href ?? '/'} className={cls} style={style}>{inner(a, title)}</Link>;
        })}
      </nav>
    </div>
  );
}
