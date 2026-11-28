'use client';

import { useGetActivityQuery, useGetChallengeQuery, useGetHotHashtagsQuery } from '@xin-via/api-client';
import { Card, ProgressBar, Skeleton, useFormatters } from '@xin-via/ui';
import { Flame, Target } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { useRequireMember } from '@/lib/use-member';
import { useMounted } from '@/lib/use-mounted';

export function ChallengeCard() {
  const t = useTranslations('home.rail');
  const te = useTranslations('community.events');
  const { data, isLoading } = useGetChallengeQuery();
  const { isMember } = useRequireMember();
  const f = useFormatters();
  const mounted = useMounted();
  if (isLoading || !mounted) return <Skeleton className="h-28" />;
  if (!data) return null;
  return (
    <Card className="p-4">
      <Link href="/su-kien" className="block">
        <h2 className="mb-1.5 flex items-center gap-2 font-display text-xl font-extrabold text-ink"><Target className="size-6 text-danger" aria-hidden />{t('challenge')}</h2>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-ink">{data.name}</p>
            {data.description ? <p className="mt-0.5 text-xs leading-snug text-ink-muted">{data.description}</p> : null}
          </div>
          <img loading="lazy" decoding="async" src="/images/ic-gift.webp" alt="" aria-hidden className="size-14 shrink-0 object-contain" draggable={false} />
        </div>
        {data.progress !== null ? (
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={data.progress} max={data.target} className="flex-1" />
            <span className="text-sm font-bold text-ink">{te('progress', { done: data.progress, target: data.target })}</span>
          </div>
        ) : <p className="mt-2 text-xs text-ink-muted">{isMember ? '' : te('loginToTrack')}</p>}
        <p className="mt-2 text-[0.7rem] text-ink-subtle">{te('challengeEnds', { date: f.date(data.endsAt) })}</p>
      </Link>
    </Card>
  );
}

export function ActivityCard() {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const { data, isLoading } = useGetActivityQuery(undefined, { pollingInterval: 60_000 });
  const f = useFormatters();
  return (
    <Card className="p-4">
      <h2 className="mb-2 font-display text-lg font-extrabold text-ink">{t('rail.activity')}</h2>
      {isLoading ? <Skeleton className="h-24" /> : null}
      {data && data.length === 0 ? <p className="text-sm text-ink-muted">{t('rail.noActivity')}</p> : null}
      <ul className="flex flex-col gap-2.5">
        {data?.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            {item.kind === 'place_wished' ? (
              <Link href={`/diem/${item.placeSlug}`} className="block text-sm text-ink hover:text-primary-strong">
                {t('activity.place_wished', { actor: item.actorName ?? tc('guestName'), place: item.placeTitle })}
                <span className="block text-[0.7rem] text-ink-subtle">{f.relative(item.createdAt)}</span>
              </Link>
            ) : (
              <Link href={`/bai/${item.postId}`} className="block text-sm text-ink hover:text-primary-strong">
                {t('activity.post_published', { actor: item.actorName })}
                <span className="block text-[0.7rem] text-ink-subtle">{f.relative(item.createdAt)}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function HotTopicsCard() {
  const t = useTranslations('home.rail');
  const { data } = useGetHotHashtagsQuery();
  if (!data || data.length === 0) return null;
  return (
    <Card className="p-4">
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><Flame className="size-5 text-wish" aria-hidden />{t('hotTopics')}</h2>
      <ol className="flex flex-col gap-1.5">
        {data.map((h, i) => (
          <li key={h.tag}>
            <Link href={`/bang-tin?hashtag=${encodeURIComponent(h.tag)}`} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-ink hover:bg-surface-muted">
              <span className="flex size-6 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold-strong">{i + 1}</span>
              <span className="flex-1 truncate">#{h.tag}</span>
              <span className="text-xs text-ink-subtle">{h.count}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
