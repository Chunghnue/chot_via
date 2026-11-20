'use client';

import { ConfirmPanel, Sheet, cn } from '@chot-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { composerClosed, kindChosen, selectComposer, type ComposerKind } from '@/features/composer/composerSlice';
import type { MemberRole } from '@chot-via/shared';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { ComposerForm } from './composer-form';

const OPTIONS: { key: string; kind: ComposerKind; role?: MemberRole; icon: string; tone: string; title: 'optStory' | 'optRevenue' | 'optDeal' | 'optWish'; desc: 'optStoryDesc' | 'optRevenueDesc' | 'optDealDesc' | 'optWishDesc' }[] = [
  { key: 'story', kind: 'story', icon: '/images/ic-laugh.webp', tone: 'bg-story-soft text-story', title: 'optStory', desc: 'optStoryDesc' },
  { key: 'revenue', kind: 'brag', role: 'owner', icon: '/images/ic-money-bag.webp', tone: 'bg-brag-soft text-brag', title: 'optRevenue', desc: 'optRevenueDesc' },
  { key: 'deal', kind: 'brag', role: 'sale', icon: '/images/ic-trophy.webp', tone: 'bg-deal-soft text-deal', title: 'optDeal', desc: 'optDealDesc' },
];

/** SCR-06/07: popup soạn bài (bottom sheet trên điện thoại, modal từ iPad). Bản nháp được giữ qua bước đăng nhập. */
export function ComposerDialog() {
  const t = useTranslations('post.composer');
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const { open, step, draft } = useAppSelector(selectComposer);
  const [confirming, setConfirming] = useState(false);
  const dirty = !!draft && (draft.body.trim().length > 0 || draft.media.length > 0 || draft.hashtags.length > 0);

  const requestClose = (value: boolean): void => {
    if (value) return;
    if (dirty) setConfirming(true);
    else dispatch(composerClosed({ discard: true }));
  };

  const title = step === 'choose' || !draft ? t('chooseTitle') : t('composeTitle');

  return (
    <Sheet open={open} onOpenChange={requestClose} size="lg" title={title} closeLabel={tc('close')}>
      {confirming ? (
        <ConfirmPanel
          title={t('discardTitle')} description={t('discardBody')} confirmLabel={t('discardYes')} cancelLabel={t('keepEditing')}
          onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); dispatch(composerClosed({ discard: true })); }}
        />
      ) : step === 'choose' || !draft ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">{t('chooseSub')}</p>
          {OPTIONS.map((o) => (
            <button key={o.key} type="button" onClick={() => dispatch(kindChosen({ kind: o.kind, ...(o.role ? { role: o.role } : {}) }))}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:bg-surface-muted active:scale-[0.99]">
              <span className={cn('flex size-14 shrink-0 items-center justify-center rounded-2xl', o.tone)} aria-hidden><img src={o.icon} alt="" className="size-10 object-contain" draggable={false} /></span>
              <span><span className="block font-display text-xl font-extrabold text-ink">{t(o.title)}</span><span className="text-sm text-ink-muted">{t(o.desc)}</span></span>
            </button>
          ))}
        </div>
      ) : (
        <ComposerForm key={`${draft.kind}-${draft.role}`} draft={draft} preview={step === 'preview'} />
      )}
    </Sheet>
  );
}
