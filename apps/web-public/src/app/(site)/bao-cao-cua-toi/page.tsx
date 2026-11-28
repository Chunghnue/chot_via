'use client';

import { useGetMyReportsQuery } from '@xin-via/api-client';
import { Badge, Card, EmptyState, Skeleton, useFormatters } from '@xin-via/ui';
import { useTranslations } from 'use-intl';
import { PageTitle, RequireMember } from '@/components/common/require-member';

function Content() {
  const t = useTranslations('profile');
  const tr = useTranslations('post.report.reasons');
  const f = useFormatters();
  const { data, isLoading } = useGetMyReportsQuery();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <PageTitle>{t('reportsTitle')}</PageTitle>
      {isLoading ? <Skeleton className="h-32" /> : data?.length === 0 ? <EmptyState icon="🛡️" title={t('reportsEmpty')} /> : (
        <Card className="divide-y divide-border">
          {data?.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div><p className="font-semibold">{t(`reportTarget.${r.targetType}`)} · {tr(r.reason)}</p><p className="text-xs text-ink-subtle">{f.relative(r.createdAt)}</p></div>
              <Badge tone={r.state === 'pending' ? 'warning' : r.state === 'resolved' ? 'success' : 'neutral'}>{t(`reportState.${r.state}`)}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function MyReportsPage() {
  const t = useTranslations('profile');
  return <RequireMember reason="profile" message={t('loginPrompt')}><Content /></RequireMember>;
}
