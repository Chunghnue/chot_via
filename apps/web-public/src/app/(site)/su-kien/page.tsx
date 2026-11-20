'use client';

import { useGetChallengeQuery, useGetEventsQuery, useGetMissionsQuery } from '@chot-via/api-client';
import { Card, EmptyState, ProgressBar, Skeleton, Tabs, buttonClass, cn, useFormatters } from '@chot-via/ui';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageTitle } from '@/components/common/require-member';

type Tab = 'challenge' | 'events';

/** Sự kiện & Thử thách: chỉ theo dõi tiến độ, KHÔNG cộng điểm và không có quà đổi (điểm chỉ đến từ xin vía/gửi vía). */
export default function EventsPage() {
  const t = useTranslations('community.events');
  const f = useFormatters();
  const [tab, setTab] = useState<Tab>('challenge');
  const missions = useGetMissionsQuery();
  const challenge = useGetChallengeQuery();
  const events = useGetEventsQuery();
  const guest = missions.data?.every((m) => m.progress === null) ?? false;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageTitle>{t('title')}</PageTitle>
      <Tabs value={tab} onChange={setTab} items={[{ key: 'challenge', label: t('tabs.challenge') }, { key: 'events', label: t('tabs.events') }]} />

      {tab === 'challenge' ? (
        <>
          {challenge.isLoading ? <Skeleton className="h-40" /> : challenge.data ? (
            <Card className="relative overflow-hidden bg-linear-to-br from-story to-info p-5 text-on-primary">
              <img src="/images/ic-gift.webp" alt="" aria-hidden className="absolute -right-2 top-3 size-24 object-contain" draggable={false} />
              <h2 className="font-display text-2xl font-extrabold">{t('challengeTitle')}</h2>
              <p className="mt-1 max-w-[16rem] text-sm font-medium opacity-95">{challenge.data.name}</p>
              {challenge.data.description ? <p className="mt-1 max-w-[16rem] text-xs opacity-90">{challenge.data.description}</p> : null}
              {challenge.data.progress !== null ? (
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={challenge.data.progress} max={challenge.data.target} className="flex-1 bg-surface/30" />
                  <span className="text-sm font-bold">{t('progress', { done: challenge.data.progress, target: challenge.data.target })}</span>
                </div>
              ) : <p className="mt-4 text-sm font-semibold">{t('loginToTrack')}</p>}
              <p className="mt-2 text-xs opacity-80">{t('challengeEnds', { date: f.date(challenge.data.endsAt) })}</p>
            </Card>
          ) : <EmptyState icon="🏁" title={t('noChallenge')} />}

          <Card className="p-4">
            <h2 className="mb-3 font-display text-xl font-extrabold text-ink">{t('missionsList')}</h2>
            {guest ? <p className="mb-2 text-sm font-semibold text-primary-strong">{t('loginToTrack')}</p> : null}
            {missions.isLoading ? <Skeleton className="h-32" /> : missions.data?.length === 0 ? <EmptyState icon="🎯" title={t('noMissions')} /> : (
              <ul className="flex flex-col divide-y divide-border">
                {missions.data?.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft"><img src="/images/ic-home.webp" alt="" aria-hidden className="size-6 object-contain" draggable={false} /></span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{m.name}</span>
                    {m.progress !== null ? <span className="shrink-0 text-sm font-bold text-ink-muted">{t('progress', { done: Math.min(m.progress, m.target), target: m.target })}</span> : null}
                    <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', m.completed ? 'bg-success text-on-primary' : 'border border-border')} aria-label={m.completed ? t('completed') : t('todo')}>
                      {m.completed ? <Check className="size-4" aria-hidden /> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 rounded-xl bg-info-soft px-3 py-2 text-xs font-medium text-info">{t('noPointsNote')}</p>
          </Card>
          <Link href="/pho-3d" className={cn(buttonClass({ variant: 'primary', size: 'lg' }), 'w-full font-bold')}>{t('joinNow')}</Link>
        </>
      ) : null}

      {tab === 'events' ? (events.isLoading ? <Skeleton className="h-40" /> : events.data?.length === 0 ? <EmptyState icon="📅" title={t('noEvents')} /> : events.data?.map((e) => (
        <Card key={e.id} className="overflow-hidden">
          {e.coverUrl ? <img src={e.coverUrl} alt="" className="h-40 w-full object-cover" loading="lazy" /> : null}
          <div className="p-4"><h2 className="font-display text-xl font-extrabold">{e.title}</h2><p className="mt-1 text-sm text-ink-muted">{e.description}</p><p className="mt-2 text-xs text-ink-subtle">{t('eventTime', { from: f.date(e.startsAt), to: f.date(e.endsAt) })}</p></div>
        </Card>
      ))) : null}
    </div>
  );
}
