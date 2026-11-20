'use client';

import { Button, Card, Skeleton } from '@chot-via/ui';
import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { loginRequested, type LoginReason } from '@/features/ui/uiSlice';
import { useAuthStatus } from '@/lib/use-member';
import { useAppDispatch } from '@/store/hooks';

/** Trang cần tài khoản: hiện thẻ mời đăng nhập (không tự bật popup — UX-01). */
export function RequireMember({ reason, message, children }: { reason: LoginReason; message: string; children: ReactNode }) {
  const t = useTranslations('auth');
  const dispatch = useAppDispatch();
  const status = useAuthStatus();
  if (status === 'unknown') return <Skeleton className="h-48" />;
  if (status === 'guest') {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <span aria-hidden className="text-5xl">🔐</span>
        <p className="max-w-sm text-ink-muted">{message}</p>
        <Button size="lg" onClick={() => dispatch(loginRequested(reason))}>{t('loginCta')}</Button>
      </Card>
    );
  }
  return <>{children}</>;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h1 className="font-display text-3xl font-extrabold text-primary-strong">{children}</h1>
      {sub ? <p className="text-sm text-ink-muted">{sub}</p> : null}
    </div>
  );
}
