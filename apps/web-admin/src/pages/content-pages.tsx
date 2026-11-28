import { useAdminCommentStatusMutation, useAdminCommentsQuery, useAdminPostPinMutation, useAdminPostStatusMutation, useAdminPostsQuery } from '@xin-via/api-client';
import { Badge, Button, Chip, Input, Skeleton, toast, useFormatters } from '@xin-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageHeader, Pager, TableShell, Td, Th } from '../components/common';
import { useApiToast } from '../lib/use-api-toast';

export function PostsPage() {
  const t = useTranslations('admin.posts');
  const tc = useTranslations('admin.common');
  const f = useFormatters();
  const toastApi = useApiToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPostsQuery({ page, pageSize: 20, ...(q ? { q } : {}), ...(status ? { status } : {}) });
  const [setPostStatus] = useAdminPostStatusMutation();
  const [pinPost] = useAdminPostPinMutation();
  const pin = (id: string, pinned: boolean): void => { void pinPost({ id, pinned }).unwrap().then(() => toast.success(tc('saved'))).catch(toastApi.error); };
  const change = (id: string, next: 'published' | 'hidden' | 'removed'): void => { void setPostStatus({ id, status: next }).unwrap().then(() => toast.success(tc('saved'))).catch(toastApi.error); };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xs"
          placeholder={t('searchPlaceholder')}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        {(['published', 'hidden', 'removed'] as const).map((s) => (
          <Chip
            key={s}
            active={status === s}
            onClick={() => {
              setStatus(status === s ? undefined : s);
              setPage(1);
            }}
          >
            {t(s)}
          </Chip>
        ))}
      </div>
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>{t('author')}</Th>
              <Th>{t('content')}</Th>
              <Th>{tc('status')}</Th>
              <Th>{tc('createdAt')}</Th>
              <Th>{tc('actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id}>
                <Td>
                  <b>{p.author.displayName}</b>
                  {p.pinned ? (
                    <Badge tone="gold" className="ml-2">
                      {t('pinned')}
                    </Badge>
                  ) : null}
                </Td>
                <Td>
                  <p className="line-clamp-3 max-w-lg whitespace-pre-wrap break-words">{p.body}</p>
                  <p className="mt-1 text-xs text-ink-subtle">{t('counts', { reactions: p.counts.reactions, comments: p.counts.comments, wishes: p.counts.wishes })}</p>
                </Td>
                <Td>
                  <Badge tone={p.status === 'published' ? 'success' : p.status === 'hidden' ? 'warning' : 'danger'}>{t(p.status)}</Badge>
                </Td>
                <Td>{f.relative(p.createdAt)}</Td>
                <Td className="whitespace-nowrap">
                  {p.status === 'published' ? (
                    <Button size="sm" variant={p.pinned ? 'primary' : 'outline'} onClick={() => pin(p.id, !p.pinned)}>
                      {p.pinned ? t('unpin') : t('pin')}
                    </Button>
                  ) : null}
                  {p.status === 'published' ? (
                    <Button size="sm" variant="soft" onClick={() => change(p.id, 'hidden')}>
                      {t('hide')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="soft" onClick={() => change(p.id, 'published')}>
                      {t('show')}
                    </Button>
                  )}
                  {p.status !== 'removed' ? (
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => change(p.id, 'removed')}>
                      {t('remove')}
                    </Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <Pager page={page} hasMore={data?.meta.hasMore ?? false} onPage={setPage} />
    </div>
  );
}

export function CommentsPage() {
  const t = useTranslations('admin.comments');
  const tc = useTranslations('admin.common');
  const f = useFormatters();
  const toastApi = useApiToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminCommentsQuery({ page, pageSize: 20, ...(q ? { q } : {}) });
  const [setStatus] = useAdminCommentStatusMutation();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} />
      <Input
        className="max-w-xs"
        placeholder={t('searchPlaceholder')}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>{tc('status')}</Th>
              <Th>{t('title')}</Th>
              <Th>{tc('createdAt')}</Th>
              <Th>{tc('actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((c) => (
              <tr key={c.id}>
                <Td>
                  <Badge tone={c.status === 'published' ? 'success' : 'warning'}>{t(c.status)}</Badge>
                </Td>
                <Td>
                  <b>{c.author.displayName}</b>
                  <p className="max-w-lg whitespace-pre-wrap break-words">{c.body}</p>
                </Td>
                <Td>{f.relative(c.createdAt)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      void setStatus({ id: c.id, status: c.status === 'published' ? 'hidden' : 'published' })
                        .unwrap()
                        .then(() => toast.success(tc('saved')))
                        .catch(toastApi.error);
                    }}
                  >
                    {c.status === 'published' ? t('hide') : t('show')}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <Pager page={page} hasMore={data?.meta.hasMore ?? false} onPage={setPage} />
    </div>
  );
}
