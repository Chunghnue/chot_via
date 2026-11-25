'use client';

import { useGetPlaceLeaderboardQuery } from '@chot-via/api-client';
import type { PlaceKind } from '@chot-via/shared';
import { Card, RankRow, SectionTitle, Skeleton, Tabs, cn, compactCount } from '@chot-via/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { useMounted } from '@/lib/use-mounted';
import { Leaderboard } from './leaderboard';

type Tab = PlaceKind | 'community';

function PlaceRows({ kind, limit, big }: { kind: PlaceKind; limit: number; big: boolean }) {
  const t = useTranslations('community.leaderboard');
  const { data, isLoading } = useGetPlaceLeaderboardQuery({ kind, limit });
  const mounted = useMounted();
  if (isLoading || !mounted) return <div className="flex flex-col gap-2">{Array.from({ length: Math.min(limit, 3) }, (_, i) => <Skeleton key={i} className="h-11" />)}</div>;
  if (!data || data.items.length === 0) return <p className="py-6 text-center text-sm text-ink-muted">{t('emptyWeek')}</p>;
  const [first, ...rest] = data.items;
  return (
    <div className="flex flex-col gap-1">
      {big && first ? (
        <Link href={`/diem/${first.place.slug}`} className="mb-2 flex flex-col items-center gap-1 rounded-2xl bg-linear-to-b from-gold-soft to-surface px-3 py-4 text-center">
          <img loading="lazy" decoding="async" src="/images/ic-crown.webp" alt="" aria-hidden className="size-12 object-contain" draggable={false} />
          <img loading="lazy" decoding="async" src="/images/ic-medal-1.webp" alt="" aria-hidden className="-mt-1 size-12 object-contain" draggable={false} />
          <span className="font-display text-lg font-extrabold text-ink">{first.place.title}</span>
          <span className="text-sm font-bold text-primary-strong">{t('viaCount', { count: compactCount(first.wishes).toUpperCase() })}</span>
        </Link>
      ) : null}
      {(big ? rest : data.items).map((row) => (
        <RankRow
          key={row.place.id} rank={row.rank} avatar={{ src: row.place.coverUrl ?? '/images/cua-hang-mau.webp', name: row.place.title }} title={row.place.title}
          value={t('viaCount', { count: compactCount(row.wishes) })} valueClassName="font-sans text-sm font-bold"
          render={(className, children) => <Link href={`/diem/${row.place.slug}`} className={className}>{children}</Link>}
        />
      ))}
    </div>
  );
}

/** "Bảng xếp hạng (Tuần)": Cửa hàng / Sale theo số vía nhận trong tuần; trang đầy đủ có thêm tab Cộng đồng (điểm thành viên). */
export function WeeklyBoard({ variant }: { variant: 'rail' | 'page' }) {
  const t = useTranslations('community.leaderboard');
  const [tab, setTab] = useState<Tab>('store');
  const tabs: Tab[] = variant === 'page' ? ['store', 'sale_office', 'community'] : ['store', 'sale_office'];
  const label = (x: Tab): string => (x === 'store' ? t('tabs.store') : x === 'sale_office' ? t('tabs.sale') : t('tabs.community'));
  return (
    <div className="flex flex-col gap-3">
      <Card className={cn('p-4', variant === 'page' && 'p-5')}>
        <SectionTitle icon="/images/ic-crown.webp" title={variant === 'page' ? t('pageTitle') : t('weeklyTitle')} />
        <Tabs size="sm" value={tab} onChange={setTab} items={tabs.map((x) => ({ key: x, label: label(x) }))} className="mb-3" />
        {tab === 'community' ? null : <PlaceRows kind={tab} limit={variant === 'page' ? 10 : 3} big={variant === 'page'} />}
        {tab !== 'community' && variant === 'page' ? <p className="mt-3 text-center text-xs text-ink-subtle">{t('weekHint')}</p> : null}
        {variant === 'rail' ? <Link href="/bang-xep-hang" className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-primary-strong hover:underline">{t('seeFull')}<ArrowRight className="size-4" aria-hidden /></Link> : null}
      </Card>
      {tab === 'community' ? <Leaderboard variant="page" /> : null}
    </div>
  );
}
