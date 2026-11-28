'use client';

import { parseApiError, useCreatePostMutation, useGetCatalogQuery, useUploadMediaMutation } from '@xin-via/api-client';
import {
  CreatePostBodySchema, DISPLAY_MODES, MEMBER_ROLES, MONEY_METRICS, OWNER_METRICS, RANGE_METRICS, SALE_METRICS, type MetricType,
} from '@xin-via/shared';
import { AppIcon, Button, Chip, FieldError, Input, Label, Notice, RadioOption, Switch, Textarea, cn, pillClass, toast, useFormatters, useRoleLabel, useValidationMessage, useCodeMessage } from '@xin-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { EmojiPicker } from '@/components/common/emoji-picker';
import { buildSchema, rangesFor, toCandidate } from './composer-schema';
import { PostContent, type PostContentData } from '@/components/post/post-content';
import { composerClosed, draftChanged, firstMetric, stepChanged, type ComposerDraft } from '@/features/composer/composerSlice';
import { loginRequested } from '@/features/ui/uiSlice';
import { useWishSettings } from '@/features/wish/use-deity-wish';
import { track } from '@/lib/analytics';
import { useApiToast } from '@/lib/use-api-toast';
import { useRequireMember } from '@/lib/use-member';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function ComposerForm({ draft, preview }: { draft: ComposerDraft; preview: boolean }) {
  const t = useTranslations('post');
  const roleLabel = useRoleLabel();
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const settings = useWishSettings();
  const { data: catalog } = useGetCatalogQuery();
  const f = useFormatters();
  const validation = useValidationMessage();
  const codeMessage = useCodeMessage();
  const toastApi = useApiToast();
  const { isMember, user } = useRequireMember();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [upload, { isLoading: uploading }] = useUploadMediaMutation();
  const loginGate = useAppSelector((s) => s.ui.login.open);
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => buildSchema(settings), [settings]);
  const form = useForm<ComposerDraft>({ defaultValues: draft, resolver: zodResolver(schema) });
  const values = form.watch();

  useEffect(() => {
    const sub = form.watch(() => dispatch(draftChanged(form.getValues())));
    return () => sub.unsubscribe();
  }, [form, dispatch]);

  const max = values.kind === 'brag' ? settings.achievementMaxChars : settings.storyMaxChars;
  const metrics: readonly MetricType[] = values.role === 'owner' ? OWNER_METRICS : SALE_METRICS;
  const ranges = rangesFor(values.role, settings);
  const rangeAllowed = RANGE_METRICS.includes(values.metricType);
  const isMoney = MONEY_METRICS.includes(values.metricType);
  const bodyError = form.formState.errors.body?.message;
  const bodyField = form.register('body');
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  /** Chèn biểu tượng vào chỗ con trỏ trong ô nội dung (hoặc cuối bài nếu chưa chọn chỗ), rồi đặt con trỏ ngay sau biểu tượng. */
  const insertEmoji = (emoji: string): void => {
    const el = bodyRef.current;
    const current = form.getValues('body');
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    form.setValue('body', current.slice(0, start) + emoji + current.slice(end), { shouldDirty: true, shouldValidate: bodyError !== undefined });
    const caret = start + emoji.length;
    window.requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(caret, caret); });
  };

  const addTag = (): void => {
    const tag = tagInput.replace(/^#+/, '').replace(/\s+/g, '').toLowerCase();
    setTagInput('');
    if (tag.length < 2 || values.hashtags.includes(tag) || values.hashtags.length >= settings.hashtagMax) return;
    form.setValue('hashtags', [...values.hashtags, tag], { shouldDirty: true });
  };

  const addPhotos = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;
    if (!isMember) { dispatch(loginRequested('post')); return; }
    const added: { id: string; url: string }[] = [];
    for (const file of Array.from(files).slice(0, Math.max(0, settings.postMaxImages - values.media.length))) {
      try { const m = await upload(file).unwrap(); added.push({ id: m.id, url: m.url }); } catch (e) { toastApi.error(e); }
    }
    form.setValue('media', [...values.media, ...added], { shouldDirty: true });
  };

  const submit = form.handleSubmit(async (v) => {
    if (v.kind === 'story') track('story_compose', { draft_length: v.body.length, login_gate_seen: loginGate || !isMember });
    if (v.kind === 'brag') track('achievement_compose', { role: v.role, display_mode: v.displayMode, login_gate_seen: loginGate || !isMember });
    if (!isMember) { dispatch(loginRequested('post')); return; }
    const parsed = CreatePostBodySchema.safeParse(toCandidate(v));
    if (!parsed.success) { toast.error(codeMessage('COMMON_VALIDATION_FAILED')); return; }
    try {
      const post = await createPost(parsed.data).unwrap();
      track('post_published', { post_type: post.type, role: post.role });
      toast.success(codeMessage('POST_CREATED'));
      dispatch(composerClosed({ discard: true }));
    } catch (error) {
      const info = parseApiError(error);
      if (info.code.startsWith('POST_BODY')) form.setError('body', { message: info.code === 'POST_BODY_TOO_LONG' ? 'too_big' : 'required' });
      else toastApi.error(error);
    }
  });

  const previewData: PostContentData = {
    type: values.kind === 'story' ? 'story' : values.kind === 'wish' ? 'wish_share' : 'achievement',
    role: values.kind === 'brag' ? values.role : null, body: values.body.trim(), sticker: values.sticker, location: values.location.trim() || null,
    hashtags: values.hashtags, media: values.media, wishType: catalog?.wishTypes.find((w) => w.id === values.wishTypeId) ?? null,
    poll: values.kind === 'story' && values.pollEnabled ? { options: values.pollOptions.filter((o) => o.trim()).map((o, i) => ({ id: `o${i}`, text: o, votes: 0 })), totalVotes: 0, myVoteId: null } : null,
    achievement: values.kind === 'brag' ? {
      metricType: values.metricType, displayMode: values.displayMode, rangeCode: values.rangeCode,
      amount: values.displayMode === 'exact' ? Number(values.amount) || null : null, verification: 'self_declared',
    } : null,
  };

  if (preview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-muted">{user?.displayName}</div>
          <PostContent post={previewData} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => dispatch(stepChanged('edit'))}>{t('composer.backToEdit')}</Button>
          <Button className="flex-1" loading={isLoading} onClick={() => void submit()}>{t('composer.submit')}</Button>
        </div>
      </div>
    );
  }

  const hint = values.kind === 'story' ? t('composer.storyHint') : values.kind === 'wish' ? t('composer.wishHint') : null;
  const placeholder = values.kind === 'story' ? t('composer.storyPlaceholder') : values.kind === 'wish' ? t('composer.wishPlaceholder') : t('composer.bragPlaceholder');
  const submitLabel = t('composer.submit');
  const kindIcon = values.kind === 'story' ? '/images/ic-laugh.webp' : values.kind === 'wish' ? '/images/ic-pray.webp' : values.role === 'sale' ? '/images/ic-trophy.webp' : '/images/ic-money-bag.webp';
  const kindTitle = values.kind === 'story' ? t('composer.optStory') : values.kind === 'wish' ? t('composer.optWish') : values.role === 'sale' ? t('composer.optDeal') : t('composer.optRevenue');

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
      <div className="flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 font-display text-base font-extrabold text-primary-strong"><img src={kindIcon} alt="" aria-hidden className="size-6 object-contain" draggable={false} />{kindTitle}</div>
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}

      {values.kind === 'brag' ? (
        <>
          <div>
            <Label>{t('composer.whoAreYou')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {MEMBER_ROLES.map((r) => (
                <Chip key={r} active={values.role === r} tone={r === 'sale' ? 'deal' : 'brag'} className="justify-center" onClick={() => {
                  form.setValue('role', r); form.setValue('metricType', firstMetric(r)); form.setValue('rangeCode', null);
                }}>{roleLabel(r)}</Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>{t('composer.metric')}</Label>
            <div className="flex flex-wrap gap-2">
              {metrics.map((m) => <Chip key={m} active={values.metricType === m} onClick={() => { form.setValue('metricType', m); if (!RANGE_METRICS.includes(m) && values.displayMode === 'range') form.setValue('displayMode', 'hidden'); }}>{t(`metrics.${m}`)}</Chip>)}
            </div>
          </div>
          <div>
            <Label>{t('composer.display')}</Label>
            <div className="flex flex-col gap-1.5">
              {DISPLAY_MODES.map((mode) => (
                <RadioOption key={mode} checked={values.displayMode === mode} disabled={mode === 'range' && !rangeAllowed} onChange={() => form.setValue('displayMode', mode)}>{t(`display.${mode}`)}</RadioOption>
              ))}
              {!rangeAllowed ? <p className="text-xs text-ink-subtle">{t('composer.rangeUnavailable')}</p> : null}
            </div>
          </div>
          {values.displayMode === 'range' && rangeAllowed ? (
            <div>
              <Label>{t('composer.pickRange')}</Label>
              <div className="flex flex-wrap gap-2">{ranges.map((r) => <Chip key={r.code} active={values.rangeCode === r.code} onClick={() => form.setValue('rangeCode', r.code, { shouldValidate: true })}>{f.range(r)}</Chip>)}</div>
              <FieldError message={form.formState.errors.rangeCode ? validation('required') : undefined} />
            </div>
          ) : null}
          {values.displayMode === 'exact' ? (
            <div>
              <Label htmlFor="amount">{isMoney ? t('composer.amountMoney') : t('composer.amountCount')}</Label>
              <Input id="amount" inputMode="numeric" value={values.amount} onChange={(e) => form.setValue('amount', e.target.value.replace(/\D/g, '').slice(0, 13), { shouldValidate: true })} />
              <FieldError message={form.formState.errors.amount ? validation('required') : undefined} />
            </div>
          ) : null}
        </>
      ) : null}

      {values.kind === 'wish' ? (
        <div className="flex flex-wrap gap-2">
          {catalog?.wishTypes.map((w) => <Chip key={w.id} tone="wish" active={values.wishTypeId === w.id} onClick={() => form.setValue('wishTypeId', values.wishTypeId === w.id ? null : w.id)}><AppIcon iconKey={w.iconKey} />{w.name}</Chip>)}
        </div>
      ) : null}

      <div>
        <Textarea aria-label={placeholder} placeholder={placeholder} aria-invalid={!!bodyError} className="min-h-36" {...bodyField} ref={(el) => { bodyField.ref(el); bodyRef.current = el; }} />
        <div className="mt-1.5 flex items-center gap-2">
          <button type="button" aria-label={emojiOpen ? t('composer.emojiClose') : t('composer.emojiOpen')} aria-expanded={emojiOpen} onClick={() => setEmojiOpen((v) => !v)}
            className={pillClass({ active: emojiOpen, bordered: true }, 'text-sm font-bold text-ink')}><span aria-hidden className="text-xl leading-none">😊</span>{t('composer.emoji')}</button>
        </div>
        {emojiOpen ? <EmojiPicker className="mt-1.5" onPick={insertEmoji} /> : null}
        <div className="mt-1 flex items-start justify-between gap-2">
          <FieldError message={bodyError ? validation(bodyError, { min: 1, max }) : undefined} />
          <p className={cn('ml-auto shrink-0 text-xs', values.body.length > max ? 'text-danger' : 'text-ink-subtle')}>{tc('counter', { count: values.body.length, max })}</p>
        </div>
      </div>

      <div>
        <Label>{t('composer.photos')}</Label>
        <div className="flex flex-wrap gap-2">
          {values.media.map((m) => (
            <div key={m.id} className="relative size-20 overflow-hidden rounded-xl">
              <img src={m.url} alt="" className="size-full object-cover" />
              <button type="button" aria-label={t('composer.removePhoto')} onClick={() => form.setValue('media', values.media.filter((x) => x.id !== m.id))} className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-overlay text-on-primary"><X className="size-3.5" aria-hidden /></button>
            </div>
          ))}
          {values.media.length < settings.postMaxImages ? (
            <button type="button" onClick={() => (isMember ? fileRef.current?.click() : dispatch(loginRequested('post')))} disabled={uploading}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs font-semibold text-ink-muted hover:bg-surface-muted"><ImagePlus className="size-5" aria-hidden />{uploading ? t('composer.uploading') : t('composer.addPhoto')}</button>
          ) : null}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
        </div>
      </div>

      <div>
        <Label htmlFor="tag">{t('composer.hashtags')}</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {values.hashtags.map((tag) => (
            <button key={tag} type="button" onClick={() => form.setValue('hashtags', values.hashtags.filter((x) => x !== tag))} className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-medium text-primary-strong">#{tag}<X className="size-3" aria-hidden /></button>
          ))}
          {values.hashtags.length < settings.hashtagMax ? (
            <Input id="tag" value={tagInput} placeholder={t('composer.hashtagPlaceholder')} className="h-10 min-w-48 flex-1" onChange={(e) => setTagInput(e.target.value)} onBlur={addTag}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} />
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="loc">{t('composer.location')}</Label>
        <Input id="loc" maxLength={40} placeholder={t('composer.locationPlaceholder')} {...form.register('location')} />
      </div>

      {values.kind === 'story' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between"><Label className="mb-0">{t('composer.poll')}</Label><Switch label={t('composer.poll')} checked={values.pollEnabled} onCheckedChange={(v) => form.setValue('pollEnabled', v)} /></div>
          {values.pollEnabled ? (
            <>
              {values.pollOptions.map((o, i) => (
                <Input key={i} value={o} maxLength={60} placeholder={t('composer.pollOption', { n: i + 1 })} onChange={(e) => form.setValue('pollOptions', values.pollOptions.map((x, j) => (j === i ? e.target.value : x)))} />
              ))}
              {values.pollOptions.length < 4 ? <Button variant="ghost" size="sm" className="w-fit" onClick={() => form.setValue('pollOptions', [...values.pollOptions, ''])}>+ {t('composer.addOption')}</Button> : null}
              <FieldError message={form.formState.errors.pollOptions ? validation('required') : undefined} />
            </>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-ink-subtle">{t('composer.privacyNote')}</p>
      {!isMember ? <Notice>{t('composer.needLogin')} · {t('composer.draftKept')}</Notice> : null}

      <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-border bg-surface px-5 pb-1 pt-3">
        <Button variant="outline" className="flex-1" onClick={() => { void form.trigger().then((ok) => { if (ok) dispatch(stepChanged('preview')); }); }}>{t('composer.preview')}</Button>
        <Button type="submit" className="flex-[2]" size="lg" loading={isLoading}>{submitLabel}</Button>
      </div>
    </form>
  );
}
