import { Button } from '@xin-via/ui';
import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';

export function PageHeader({ title, sub, action }: { title: string; sub?: string | undefined; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-3xl font-extrabold text-ink">{title}</h1>{sub ? <p className="mt-0.5 max-w-3xl text-sm text-ink-muted">{sub}</p> : null}</div>
      {action}
    </div>
  );
}

export function Pager({ page, hasMore, onPage }: { page: number; hasMore: boolean; onPage: (page: number) => void }) {
  const t = useTranslations('admin.common');
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t('prev')}</Button>
      <span className="text-sm font-semibold text-ink-muted">{t('page', { page })}</span>
      <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => onPage(page + 1)}>{t('next')}</Button>
    </div>
  );
}

/** Bảng cuộn ngang trên màn nhỏ. */
export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-card bg-surface shadow-card"><table className="w-full min-w-[40rem] text-left text-sm">{children}</table></div>;
}
export const Th = ({ children }: { children?: ReactNode }) => (
  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-subtle">{children}</th>
);
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={`border-b border-border px-4 py-3 align-top ${className ?? ''}`}>{children}</td>;
