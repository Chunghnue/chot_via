import { useAdminReportActMutation, useAdminReportsQuery } from '@chot-via/api-client';
import { REPORT_ACTIONS, REPORT_STATES, type ReportAction, type ReportState } from '@chot-via/shared';
import { Badge, Button, Card, Chip, Skeleton, toast, useConfirm, useFormatters } from '@chot-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageHeader, Pager } from '../components/common';
import { useApiToast } from '../lib/use-api-toast';

export function ReportsPage() {
  const t = useTranslations('admin.reports');
  const tc = useTranslations('admin.common');
  const f = useFormatters();
  const toastApi = useApiToast();
  const [state, setState] = useState<ReportState | undefined>('pending');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminReportsQuery({ page, pageSize: 20, ...(state ? { state } : {}) });
  const [act, { isLoading: acting }] = useAdminReportActMutation();
  const confirm = useConfirm();
  const runAction = async (id: string, action: ReportAction): Promise<void> => {
    if (action === 'ban_author' && !(await confirm({ title: t('confirmBan'), confirmLabel: t(`actions.${action}`) }))) return;
    void act({ id, action }).unwrap().then(() => toast.success(tc('saved'))).catch(toastApi.error);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} />
      <div className="flex flex-wrap gap-2">
        {REPORT_STATES.map((s) => <Chip key={s} active={state === s} onClick={() => { setState(s); setPage(1); }}>{t(s)}</Chip>)}
        <Chip active={state === undefined} onClick={() => { setState(undefined); setPage(1); }}>{tc('all')}</Chip>
      </div>
      {isLoading ? <Skeleton className="h-48" /> : data?.items.length === 0 ? <p className="rounded-card bg-surface p-8 text-center text-ink-muted shadow-card">{t('empty')}</p> : (
        <div className="grid gap-3 xl:grid-cols-2">
          {data?.items.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{t(`targets.${r.targetType}`)}</Badge>
                <Badge tone="warning">{t(`reasons.${r.reason}`)}</Badge>
                {r.escalated ? <Badge tone="danger">{t('escalated')}</Badge> : null}
                {r.isAuto ? <Badge>{t('auto')}</Badge> : null}
                <Badge tone={r.state === 'pending' ? 'warning' : r.state === 'resolved' ? 'success' : 'neutral'}>{t(r.state)}</Badge>
                <span className="ml-auto text-xs text-ink-subtle">{f.relative(r.createdAt)}</span>
              </div>
              <div className="rounded-xl bg-surface-muted p-3 text-sm">
                <p className="whitespace-pre-wrap break-words">{r.preview.text ?? '—'}</p>
                <p className="mt-1 text-xs text-ink-subtle">{t('author')}: {r.preview.authorName ?? tc('none')} {r.preview.status ? `· ${r.preview.status}` : ''}</p>
              </div>
              {r.detail ? <p className="text-sm text-ink-muted">“{r.detail}”</p> : null}
              <p className="text-xs text-ink-subtle">{t('reporter')}: {r.reporterName ?? t('guest')} · {t('count', { count: r.targetReportCount })}</p>
              {r.state === 'pending' ? (
                <div className="flex flex-wrap gap-2">
                  {REPORT_ACTIONS.map((a) => (
                    <Button key={a} size="sm" variant={a === 'ban_author' || a === 'remove' ? 'danger' : a === 'dismiss' || a === 'keep' ? 'outline' : 'soft'} disabled={acting}
                      onClick={() => void runAction(r.id, a)}>{t(`actions.${a}`)}</Button>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      <Pager page={page} hasMore={data?.meta.hasMore ?? false} onPage={setPage} />
    </div>
  );
}
