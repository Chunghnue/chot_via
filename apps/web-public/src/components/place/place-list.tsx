'use client';

import type { PlaceSummary } from '@chot-via/shared';
import { Badge, Card, PlaceIllustration, cn } from '@chot-via/ui';
import { useTranslations } from 'use-intl';

export function PlaceListItem({ place, active, onClick }: { place: PlaceSummary; active?: boolean; onClick: () => void }) {
  const t = useTranslations('street');
  const tp = useTranslations('place');
  return (
    <button type="button" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-2xl border bg-surface p-2.5 text-left transition hover:bg-surface-muted', active ? 'border-primary' : 'border-transparent shadow-card')}>
      <span className="w-16 shrink-0 rounded-xl bg-linear-to-b from-scene-sky to-scene-ground p-1"><PlaceIllustration modelKey={place.modelKey} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-bold text-ink">{place.title}</span>
        <span className="block truncate text-xs text-ink-muted">{place.categoryName} · {tp(`kind.${place.kind}`)}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-primary-strong">🙏 {t('wishCount', { count: place.wishCount })}</span>
          {place.isDemo ? <Badge tone="gold" className="px-1.5 py-0 text-[0.6rem]">{t('demo')}</Badge> : null}
        </span>
      </span>
    </button>
  );
}

export function PlaceGrid({ places, onSelect }: { places: PlaceSummary[]; onSelect: (id: string) => void }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {places.map((p) => <li key={p.id}><PlaceListItem place={p} onClick={() => onSelect(p.id)} /></li>)}
    </ul>
  );
}

export { Card };
