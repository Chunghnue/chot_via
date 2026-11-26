import { useAdminStatsQuery } from '@chot-via/api-client';
import { Card, Skeleton, formatNumber } from '@chot-via/ui';
import { useTranslations } from 'use-intl';
import { PageHeader } from '../components/common';

const KEYS = ['members', 'newMembers7d', 'bannedMembers', 'postsTotal', 'posts7d', 'wishesTotal', 'wishes7d', 'placesTotal', 'pendingReports'] as const;

export function DashboardPage() {
  const t = useTranslations('admin.dashboard');
  const { data, isLoading } = useAdminStatsQuery();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} sub={t('note')} />
      {isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {KEYS.map((k) => (
            <Card key={k} className="p-4">
              <p className="text-xs font-semibold text-ink-muted">{t(k)}</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-primary-strong">{formatNumber(data[k])}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
