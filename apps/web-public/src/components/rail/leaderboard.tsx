'use client';

import { useGetLeaderboardQuery } from '@xin-via/api-client';
import { Badge, Button, Card, RankRow, SectionTitle, Skeleton, cn } from '@xin-via/ui';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { useWishSettings } from '@/features/wish/use-deity-wish';
import { useMounted } from '@/lib/use-mounted';
import { useCurrentUser } from '@/lib/use-member';

/** TOP thành viên theo điểm vía: tối đa 100, mặc định hiện 5, có nút xem toàn bộ. Không xếp hạng theo doanh thu. */
export function Leaderboard({ variant }: { variant: 'rail' | 'page' }) {
  const t = useTranslations('community.leaderboard');
  const tc = useTranslations('common');
  const settings = useWishSettings();
  const user = useCurrentUser();
  const [expanded, setExpanded] = useState(false);
  const { maxMembers, defaultVisible } = settings.leaderboard;
  const { data, isLoading: loading } = useGetLeaderboardQuery(expanded ? maxMembers : defaultVisible);
  const mounted = useMounted();
  const isLoading = loading || !mounted;

  return (
    <Card className={cn('p-4', variant === 'page' && 'p-5 sm:p-6')}>
      <SectionTitle icon="/images/ic-trophy.webp" title={t('title')} sub={t('subtitle')} />

      {isLoading ? <div className="flex flex-col gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11" />)}</div> : null}
      {data && data.items.length === 0 ? <p className="py-4 text-center text-sm text-ink-muted">{t('empty')}</p> : null}
      <ol className="flex flex-col gap-1">
        {data?.items.map((row) => (
          <li key={row.user.id}>
            <RankRow
              rank={row.rank} rankLabel={t('rankAria', { rank: row.rank })} highlight={row.user.id === user?.id}
              avatar={{ src: row.user.avatarUrl, name: row.user.displayName }}
              title={`${row.user.displayName}${row.user.id === user?.id ? ` (${t('you')})` : ''}`}
              sub={row.user.level ? <Badge tone="gold" className="mt-0.5">{tc('level', { name: row.user.level.name })}</Badge> : null}
              value={t('points', { points: row.points })}
              render={(className, children) => <Link href={`/u/${row.user.id}`} className={className}>{children}</Link>}
            />
          </li>
        ))}
      </ol>

      {data?.me ? (
        <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-center text-xs font-medium text-ink-muted">
          {data.me.rank ? t('yourRank', { rank: data.me.rank }) : t('notInTop', { count: maxMembers })}
        </p>
      ) : null}
      {!user ? <p className="mt-3 text-center text-xs text-ink-subtle">{t('guestHint')}</p> : null}

      {data && (data.total > defaultVisible || expanded) ? (
        <Button variant="soft" size="sm" className="mt-3 w-full" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('collapse') : t('seeAll', { count: maxMembers })}
        </Button>
      ) : null}
      <p className="mt-3 text-[0.7rem] leading-snug text-ink-subtle">{t('rule')}</p>
    </Card>
  );
}
