'use client';

import { DeityAvatar, Sheet, cn } from '@chot-via/ui';
import { RITUAL_BEATS, RITUAL_SECONDS, useSceneCapability, type RitualKind } from '@chot-via/scene-3d';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { ShareButtons } from '@/components/common/share-buttons';
import { HOME_SHARE_VIA } from '@/lib/post-share';
import { siteUrl } from '@/lib/share';
import { Burst } from '@/components/dialogs/wish-burst';
import { useRitual } from '@/features/ritual/use-ritual';
import { ritualEnded, ritualOfferClosed, ritualPlaying, selectRitual, selectRitualOffer, selectRitualPending } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Các câu chúc có sẵn cho mỗi nghi lễ (xem `wish.ritual.blessings`). */
const BLESSING_KEYS = ['n0', 'n1', 'n2', 'n3', 'n4'] as const;
/** Thời gian thẻ lời chúc còn hiện sau khi nghi lễ kết thúc (ms) và thời gian hiệu ứng nổ ở máy không có 3D (ms). */
const CARD_AFTER_MS = 4000;
const BURST_MS = 2200;
/** Quá thời gian này mà cảnh 3D chưa báo bắt đầu thì cứ chạy phụ đề và lời chúc (ms). */
const START_FAILSAFE_MS = 10000;

/** Mốc (giây) hiện thẻ lời chúc: Thần Tài chúc sau khi cửa mở; đốt vía thì khi giấy cháy hết. */
const CARD_AT: Record<RitualKind, number> = { invoke: RITUAL_BEATS.invoke.greet, burn: RITUAL_BEATS.burn.ash };

type CaptionKey = 'invoke.start' | 'invoke.run' | 'invoke.knock' | 'invoke.open' | 'invoke.greet' | 'invoke.throw' | 'invoke.back' | 'burn.start' | 'burn.burning' | 'burn.ash';

function captionFor(kind: RitualKind, a: number): CaptionKey {
  if (kind === 'burn') {
    const B = RITUAL_BEATS.burn;
    return a < B.ignite ? 'burn.start' : a < B.ash ? 'burn.burning' : 'burn.ash';
  }
  const B = RITUAL_BEATS.invoke;
  if (a < B.run) return 'invoke.start';
  if (a < B.knocks[0]) return 'invoke.run';
  if (a < B.open) return 'invoke.knock';
  if (a < B.greet) return 'invoke.open';
  if (a < B.throws[0]) return 'invoke.greet';
  if (a < B.back) return 'invoke.throw';
  return 'invoke.back';
}

/** Hộp hiện ngay sau khi tạo cửa hàng xong: hai nút nổi bật để bắt đầu nghi lễ. */
function RitualOffer() {
  const t = useTranslations('wish.ritual');
  const dispatch = useAppDispatch();
  const offer = useAppSelector(selectRitualOffer);
  const pending = useAppSelector(selectRitualPending);
  const { begin } = useRitual();
  const kinds: RitualKind[] = pending === 'burn' ? ['burn', 'invoke'] : ['invoke', 'burn'];
  const style: Record<RitualKind, string> = {
    invoke: 'from-wish via-wish to-wish-strong text-on-wish',
    burn: 'from-gold via-wish to-danger text-on-wish',
  };
  const icon: Record<RitualKind, string> = { invoke: '/images/ic-pray.webp', burn: '/images/ic-fire.webp' };
  return (
    <Sheet open={offer !== null} onOpenChange={(open) => { if (!open) dispatch(ritualOfferClosed()); }} title={t('readyTitle')} closeLabel={t('closeAria')} tone="wish">
      {offer ? (
        <div className="flex flex-col items-center gap-4 pb-2 text-center" data-testid="ritual-offer">
          <div className="w-32"><DeityAvatar glow src="/images/than-tai-nhan-via.webp" /></div>
          <p className="text-base font-medium text-ink">{t('readyHint', { place: offer.title })}</p>
          <div className="flex w-full flex-col gap-3">
            {kinds.map((kind, i) => (
              <button
                key={kind} type="button" onClick={() => begin(kind, offer)} data-testid={`ritual-start-${kind}`}
                className={cn(
                  'animate-glow relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border-4 border-surface bg-linear-to-b px-6 font-display font-extrabold shadow-cta transition active:scale-95',
                  i === 0 ? 'h-[4.25rem] text-2xl' : 'h-14 text-xl', style[kind],
                )}
              >
                <img src={icon[kind]} alt="" aria-hidden className="size-[1.6em] object-contain" draggable={false} />
                {kind === 'invoke' ? t('invokeCta') : t('burnCta')}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => dispatch(ritualOfferClosed())} className="text-sm font-semibold text-ink-muted hover:underline">{t('later')}</button>
        </div>
      ) : null}
    </Sheet>
  );
}

interface Card { kind: RitualKind; title: string; text: string; tick: number }

/** Phụ đề, thẻ lời chúc và (máy không có 3D) hiệu ứng nổ đi cùng cảnh nghi lễ đang chạy ở thành phố 3D. */
function RitualPlay() {
  const t = useTranslations('wish.ritual');
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const ritual = useAppSelector(selectRitual);
  const capability = useSceneCapability();
  const [elapsed, setElapsed] = useState(0);
  const [card, setCard] = useState<Card | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const cardShown = useRef(0);
  const tick = ritual?.tick ?? 0;
  const startedAt = ritual?.startedAt ?? null;
  const flat = capability.ready && (!capability.supports3D || capability.reducedMotion);

  // Máy không có 3D / bật giảm chuyển động: không có cảnh để chờ nên bắt đầu ngay. Máy có 3D: chờ cảnh báo bắt đầu, quá hạn thì tự chạy.
  useEffect(() => {
    if (tick === 0 || startedAt !== null || !capability.ready) return undefined;
    const id = window.setTimeout(() => dispatch(ritualPlaying(tick)), flat ? 0 : START_FAILSAFE_MS);
    return () => window.clearTimeout(id);
  }, [tick, startedAt, flat, capability.ready, dispatch]);

  // Đồng hồ: cập nhật phụ đề, hiện thẻ lời chúc đúng mốc, hết giờ thì kết thúc nghi lễ.
  useEffect(() => {
    if (!ritual || startedAt === null) return undefined;
    const { kind, title } = ritual;
    const seconds = RITUAL_SECONDS[kind];
    const id = window.setInterval(() => {
      const a = (Date.now() - startedAt) / 1000;
      setElapsed(a);
      if (a >= CARD_AT[kind] && cardShown.current !== tick) {
        cardShown.current = tick;
        const key = BLESSING_KEYS[tick % BLESSING_KEYS.length] ?? 'n0';
        setCard({ kind, title: t(`card.${kind}`, { place: title }), text: t(`blessings.${kind}.${key}`, { place: title }), tick });
        if (flat) setBurstKey(tick);
      }
      if (a >= seconds + 0.5) { dispatch(ritualEnded()); window.clearInterval(id); }
    }, 200);
    return () => window.clearInterval(id);
  }, [ritual, startedAt, tick, flat, t, dispatch]);

  useEffect(() => {
    if (burstKey === 0) return undefined;
    const id = window.setTimeout(() => setBurstKey(0), BURST_MS);
    return () => window.clearTimeout(id);
  }, [burstKey]);

  // Thẻ lời chúc tự tắt sau khi nghi lễ kết thúc.
  useEffect(() => {
    if (!card || ritual) return undefined;
    const id = window.setTimeout(() => setCard(null), CARD_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [card, ritual]);

  const show = ritual !== null && startedAt !== null;
  return (
    <>
      {burstKey !== 0 ? <Burst key={burstKey} /> : null}
      {show && ritual ? (
        <p
          role="status" aria-live="polite" data-testid="ritual-caption"
          className="pointer-events-none fixed inset-x-3 bottom-24 z-60 mx-auto w-fit max-w-[92vw] animate-pop-in rounded-full bg-surface/95 px-5 py-2 text-center text-sm font-bold text-primary-strong shadow-card md:bottom-10 md:text-base"
        >
          {t(`caption.${captionFor(ritual.kind, elapsed)}`)}
        </p>
      ) : null}
      {card ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-60 flex justify-center px-3">
          <div role="status" aria-live="polite" data-testid="ritual-card" className="pointer-events-auto relative flex w-full max-w-md animate-pop-in items-center gap-3 rounded-3xl bg-linear-to-b from-gold-soft to-surface p-3 pr-9 shadow-card ring-2 ring-wish/40">
            <div className="w-16 shrink-0 sm:w-20">
              {card.kind === 'invoke' ? <DeityAvatar glow src="/images/than-tai-nhan-via.webp" /> : <img src="/images/ic-fire.webp" alt="" aria-hidden className="w-full object-contain" draggable={false} />}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-display text-xl font-extrabold leading-tight text-wish-strong">{card.title}</h3>
              <p className="text-base font-medium leading-snug text-ink">{card.text}</p>
              <ShareButtons text={card.text} card={{ kind: 'receive' }} link={`${siteUrl()}/?via=${HOME_SHARE_VIA.receive}`} />
              <p className="text-[0.68rem] leading-snug text-ink-subtle">{tc('disclaimer')}</p>
            </div>
            <button type="button" aria-label={t('closeAria')} onClick={() => setCard(null)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-ink-muted hover:bg-surface-muted">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Nghi lễ Đốt vía / Thỉnh Thần Tài: hộp mời bắt đầu (sau khi tạo cửa hàng) và phần chữ đi kèm cảnh 3D. */
export function RitualHost() {
  return (
    <>
      <RitualOffer />
      <RitualPlay />
    </>
  );
}
