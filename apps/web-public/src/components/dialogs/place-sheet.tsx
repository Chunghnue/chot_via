'use client';

import { useGetCatalogQuery, useGetPlaceQuery, usePlaceWishMutation, useVisitPlaceMutation } from '@chot-via/api-client';
import { Badge, Button, FieldError, SHOP_IMAGES, Sheet, Skeleton, Textarea, ToggleTile, buttonClass, cn, compactCount, AppIcon, useCodeMessage } from '@chot-via/ui';
import { parseApiError } from '@chot-via/api-client';
import type { PlaceDetail, PlaceWishResult } from '@chot-via/shared';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { placeSheetClosed, placeSheetOpened, placeSheetStepChanged, selectPlaceSheet } from '@/features/ui/uiSlice';
import { useWishSettings } from '@/features/wish/use-deity-wish';
import { track } from '@/lib/analytics';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCurrentUser } from '@/lib/use-member';

export function PlaceCover({ place }: { place: Pick<PlaceDetail, 'modelKey' | 'isDemo'> }) {
  const t = useTranslations('common');
  return (
    <div className="relative overflow-hidden rounded-card bg-linear-to-b from-scene-sky to-scene-ground px-6 pb-1 pt-4">
      <img src={SHOP_IMAGES[place.modelKey]} alt="" aria-hidden className="mx-auto max-h-60 w-auto max-w-full object-contain drop-shadow-lg" draggable={false} />
      {place.isDemo ? <Badge tone="gold" className="absolute left-3 top-3">{t('demoLabel')}</Badge> : null}
    </div>
  );
}

function SendWishForm({ place, onDone }: { place: PlaceDetail; onDone: () => void }) {
  const t = useTranslations('place');
  const tc = useTranslations('common');
  const message = useCodeMessage();
  const { data: catalog } = useGetCatalogQuery();
  const settings = useWishSettings();
  const user = useCurrentUser();
  const [send, { isLoading }] = usePlaceWishMutation();
  const [typeId, setTypeId] = useState<string | null>(null);
  const [stickerId, setStickerId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlaceWishResult | null>(null);

  const submit = async (): Promise<void> => {
    if (!typeId) { setError(message('WISH_TYPE_INVALID')); return; }
    setError(null);
    try {
      const data = await send({ placeId: place.id, body: { wishTypeId: typeId, ...(stickerId ? { stickerId } : {}), ...(text.trim() ? { message: text.trim() } : {}) } }).unwrap();
      track('wish_sent_place', { place_id: place.id, auto_reply: data.reply.kind === 'auto' });
      track('wish_received', { target: 'place', member: user !== null, offline: false });
      setResult(data);
    } catch (e) {
      const info = parseApiError(e);
      setError(message(info.code, info.params));
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="font-display text-2xl font-extrabold text-primary-strong">{t('sentTitle', { place: result.placeTitle })}</h3>
        <div className="w-full rounded-2xl bg-surface-muted p-4 text-left">
          <Badge tone={result.reply.kind === 'auto' ? 'info' : 'neutral'}>{result.reply.kind === 'auto' ? t('reply.autoLabel') : t('reply.systemLabel')}</Badge>
          <p className="mt-2 text-sm text-ink-muted">{result.reply.kind === 'auto' ? t('reply.autoBody', { place: result.placeTitle }) : t('reply.systemBody', { place: result.placeTitle })}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{result.reply.text}</p>
          <p className="mt-2 text-[0.7rem] text-ink-subtle">{t('reply.notChat')}</p>
        </div>
        {result.pointsAwarded ? <Badge tone="success"><Check className="size-3" aria-hidden />+1</Badge> : null}
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setTypeId(null); setText(''); }}>{t('sendMore')}</Button>
          <Button className="flex-1" onClick={onDone}>{tc('close')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img
          src={SHOP_IMAGES[place.modelKey]}
          alt=""
          aria-hidden
          className="size-14 shrink-0 rounded-2xl bg-linear-to-b from-scene-sky to-scene-ground object-contain p-1"
          draggable={false}
        />
        <p className="font-display text-xl font-extrabold text-ink">{place.title}</p>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">{t('chooseType')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {catalog?.wishTypes.map((w) => (
            <ToggleTile
              key={w.id}
              tone="solid"
              active={typeId === w.id}
              onClick={() => setTypeId(w.id)}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center text-xs font-bold"
            >
              <AppIcon iconKey={w.iconKey} className="text-3xl" />
              {w.name}
            </ToggleTile>
          ))}
        </div>
      </div>
      {catalog && catalog.stickers.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-bold text-ink">{t('chooseSticker')}</h3>
          <div className="flex gap-2">
            {catalog.stickers.map((s) => (
              <ToggleTile
                key={s.id}
                tone="outline"
                aria-label={s.name}
                active={stickerId === s.id}
                onClick={() => setStickerId(stickerId === s.id ? null : s.id)}
                className="flex size-14 items-center justify-center rounded-2xl border-2"
              >
                <AppIcon iconKey={s.iconKey} className="text-3xl" />
              </ToggleTile>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <Textarea value={text} maxLength={settings.wishMessageMaxChars} onChange={(e) => setText(e.target.value)} placeholder={t('messagePlaceholder')} className="min-h-20" />
        <p className="mt-1 text-right text-xs text-ink-subtle">
          {text.length}/{settings.wishMessageMaxChars}
        </p>
      </div>
      <FieldError message={error ?? undefined} />
      <Button size="lg" loading={isLoading} onClick={() => void submit()}>
        {t('sendNow')}
      </Button>
    </div>
  );
}

/** SCR-04/05: chi tiết điểm trên phố + gửi vía; guest dùng được không cần đăng nhập. */
export function PlaceSheet() {
  const t = useTranslations('place');
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const { placeId, step } = useAppSelector(selectPlaceSheet);
  const { data: place, isLoading } = useGetPlaceQuery(placeId ?? '', { skip: placeId === null });
  const [visit] = useVisitPlaceMutation();
  const visited = useRef<string | null>(null);

  useEffect(() => {
    if (placeId && place && visited.current !== placeId) {
      visited.current = placeId;
      void visit(place.slug);
      track('place_visit', { place_id: placeId, mode: '3d' });
    }
    if (!placeId) visited.current = null;
  }, [placeId, place, visit]);

  return (
    <Sheet
      open={placeId !== null}
      onOpenChange={(o) => {
        if (!o) dispatch(placeSheetClosed());
      }}
      size="lg"
      title={step === 'wish' && place ? t('sendWishTo', { place: place.title }) : (place?.title ?? tc('loading'))}
      closeLabel={tc('close')}
    >
      {isLoading || !place ? (
        <Skeleton className="h-64" />
      ) : step === 'wish' ? (
        <SendWishForm place={place} onDone={() => dispatch(placeSheetClosed())} />
      ) : (
        <div className="flex flex-col gap-4">
          <PlaceCover place={place} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">{place.categoryName}</Badge>
            <Badge tone={place.kind === 'sale_office' ? 'sale' : 'owner'}>{t(`kind.${place.kind}`)}</Badge>
            {place.autoReplyEnabled ? <Badge tone="info">{t('reply.autoLabel')}</Badge> : null}
          </div>
          {place.tagline ? <p className="text-ink-muted">{place.tagline}</p> : null}
          <dl className="grid grid-cols-3 gap-2 text-center">
            {(
              [
                ['visits', place.visitCount],
                ['followers', place.followCount],
                ['wishes', place.wishCount],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="rounded-2xl bg-surface-muted py-2">
                <dt className="text-xs text-ink-muted">{t(`stats.${key}`)}</dt>
                <dd className="font-display text-xl font-extrabold text-ink">{compactCount(value)}</dd>
              </div>
            ))}
          </dl>
          {place.isDemo ? <p className="rounded-xl bg-gold-soft px-3 py-2 text-xs text-gold-strong">{t('demoNote')}</p> : null}
          <div className="flex gap-2">
            <Button className="flex-1" size="lg" onClick={() => dispatch(placeSheetStepChanged('wish'))}>
              <span aria-hidden>🙏</span>
              {t('sendWishCta')}
            </Button>
            <Link href={`/diem/${place.slug}`} onClick={() => dispatch(placeSheetClosed())} className={cn(buttonClass({ variant: 'outline', size: 'lg' }), 'flex-1')}>
              {t('visit')}
            </Link>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function useOpenPlaceWish() {
  const dispatch = useAppDispatch();
  return (placeId: string): void => { dispatch(placeSheetOpened({ placeId, step: 'wish' })); };
}
