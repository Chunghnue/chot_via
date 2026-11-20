import { useAdminUserUpdateMutation, useAdminUsersQuery } from '@chot-via/api-client';
import { ACCOUNT_ROLES } from '@chot-via/shared';
import { Badge, Button, Chip, Input, Select, Skeleton, toast, useFormatters } from '@chot-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageHeader, Pager, TableShell, Td, Th } from '../components/common';
import { useApiToast } from '../lib/use-api-toast';

export function UsersPage({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations('admin.users');
  const tc = useTranslations('admin.common');
  const f = useFormatters();
  const toastApi = useApiToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsersQuery({ page, pageSize: 20, ...(q ? { q } : {}), ...(status ? { status } : {}) });
  const [update] = useAdminUserUpdateMutation();
  const saved = (): void => { toast.success(tc('saved')); };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} />
      <div className="flex flex-wrap items-center gap-2">
        <Input className="max-w-sm" placeholder={t('searchPlaceholder')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        {(['active', 'banned'] as const).map((s) => <Chip key={s} active={status === s} onClick={() => { setStatus(status === s ? undefined : s); setPage(1); }}>{t(s)}</Chip>)}
      </div>
      {isLoading ? <Skeleton className="h-48" /> : (
        <TableShell>
          <thead><tr><Th>{t('name')}</Th><Th>{t('phone')}</Th><Th>{t('role')}</Th><Th>{t('points')}</Th><Th>{tc('status')}</Th><Th>{tc('createdAt')}</Th><Th>{tc('actions')}</Th></tr></thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id}>
                <Td><b>{u.displayName}</b>{u.memberRole ? <p className="text-xs text-ink-subtle">{t('memberRole')}: {u.memberRole}</p> : null}</Td>
                <Td>{u.phoneMasked ?? tc('none')}</Td>
                <Td>{isAdmin ? (
                  <Select className="h-10 min-w-40 text-sm" value={u.accountRole} onChange={(e) => { const role = ACCOUNT_ROLES.find((r) => r === e.target.value); if (role) void update({ id: u.id, body: { accountRole: role } }).unwrap().then(saved).catch(toastApi.error); }}>
                    {ACCOUNT_ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
                  </Select>) : t(`roles.${u.accountRole}`)}</Td>
                <Td>{u.points}</Td>
                <Td><Badge tone={u.status === 'active' ? 'success' : 'danger'}>{t(u.status)}</Badge></Td>
                <Td>{f.date(u.createdAt)}</Td>
                <Td><Button size="sm" variant={u.status === 'active' ? 'danger' : 'soft'} onClick={() => { void update({ id: u.id, body: { status: u.status === 'active' ? 'banned' : 'active' } }).unwrap().then(saved).catch(toastApi.error); }}>{u.status === 'active' ? t('ban') : t('unban')}</Button></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <Pager page={page} hasMore={data?.meta.hasMore ?? false} onPage={setPage} />
    </div>
  );
}
