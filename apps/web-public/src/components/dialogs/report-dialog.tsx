'use client';

import { useCreateReportMutation } from '@xin-via/api-client';
import { REPORT_REASONS, type ReportReason } from '@xin-via/shared';
import { Button, RadioOption, Sheet, Textarea } from '@xin-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { reportDismissed, selectReport } from '@/features/ui/uiSlice';
import { useApiToast } from '@/lib/use-api-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useTurnstile } from '@/components/turnstile';

/** Báo cáo nội dung (khách cũng báo cáo được). */
export function ReportDialog() {
  const t = useTranslations('post.report');
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const target = useAppSelector(selectReport);
  const [create, { isLoading }] = useCreateReportMutation();
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  const toast = useApiToast();
  const turnstile = useTurnstile();

  const submit = async (): Promise<void> => {
    if (!target) return;
    try {
      await create({ ...target, reason, ...(detail.trim() ? { detail: detail.trim() } : {}), ...(turnstile.token ? { turnstileToken: turnstile.token } : {}) }).unwrap();
      toast.success('REPORT_RECEIVED');
      setDetail('');
      dispatch(reportDismissed());
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <Sheet open={target !== null} onOpenChange={(open) => { if (!open) dispatch(reportDismissed()); }} title={t('title')} closeLabel={tc('close')}>
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-semibold">{t('reasonLabel')}</legend>
          {REPORT_REASONS.map((r) => (
            <RadioOption key={r} name="reason" checked={reason === r} onChange={() => setReason(r)}>{t(`reasons.${r}`)}</RadioOption>
          ))}
        </fieldset>
        <Textarea value={detail} maxLength={500} onChange={(e) => setDetail(e.target.value)} placeholder={t('detail')} />
        <div ref={turnstile.containerRef} />
        <Button size="lg" loading={isLoading} disabled={!turnstile.ready} onClick={() => void submit()}>{t('submit')}</Button>
      </div>
    </Sheet>
  );
}
