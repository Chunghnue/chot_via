import { useAdminAuditQuery } from '@chot-via/api-client';
import { Skeleton, useFormatters } from '@chot-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageHeader, Pager, TableShell, Td, Th } from '../components/common';

export function AuditPage() {
  const t = useTranslations('admin.audit');
  const f = useFormatters();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminAuditQuery(page);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} />
      {isLoading ? <Skeleton className="h-48" /> : (
        <TableShell>
          <thead><tr><Th>{t('time')}</Th><Th>{t('actor')}</Th><Th>{t('action')}</Th><Th>{t('object')}</Th></tr></thead>
          <tbody>{data?.items.map((a) => (
            <tr key={a.id}><Td>{f.relative(a.createdAt)}</Td><Td>{a.actorName ?? '—'}</Td><Td><code>{a.action}</code></Td><Td>{a.objectType}{a.objectId ? ` · ${a.objectId.slice(0, 8)}` : ''}</Td></tr>
          ))}</tbody>
        </TableShell>
      )}
      <Pager page={page} hasMore={data?.meta.hasMore ?? false} onPage={setPage} />
    </div>
  );
}
