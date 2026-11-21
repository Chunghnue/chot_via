'use client';

import { useCreatePlaceMutation, useGetCatalogQuery, useUpdatePlaceMutation } from '@chot-via/api-client';
import { PLACE_KINDS, PlaceInputSchema, type PlaceDetail, type PlaceInput } from '@chot-via/shared';
import { Button, Chip, FieldError, Input, Label, PlaceIllustration, Select, Switch, Textarea, cn, toast, useValidationMessage } from '@chot-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import type { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { ritualOffered } from '@/features/ui/uiSlice';
import { useApiToast } from '@/lib/use-api-toast';
import { useAppDispatch } from '@/store/hooks';

type PlaceFormInput = z.input<typeof PlaceInputSchema>;

/** Tạo/sửa cửa hàng hoặc văn phòng sale 3D từ mẫu dựng sẵn (P1). */
export function PlaceForm({ place }: { place?: PlaceDetail }) {
  const t = useTranslations('place.form');
  const tk = useTranslations('place.kind');
  const validation = useValidationMessage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toastApi = useApiToast();
  const { data: catalog } = useGetCatalogQuery();
  const [create, { isLoading: creating }] = useCreatePlaceMutation();
  const [update, { isLoading: updating }] = useUpdatePlaceMutation();
  const first = catalog?.categories[0];
  const form = useForm<PlaceFormInput, unknown, PlaceInput>({
    resolver: zodResolver(PlaceInputSchema),
    values: place
      ? { kind: place.kind, title: place.title, tagline: place.tagline ?? '', description: place.description ?? '', province: place.province ?? '', categoryId: place.categoryId, sceneTemplateId: place.sceneTemplateId, autoReplyEnabled: place.autoReplyEnabled }
      : undefined,
    defaultValues: { kind: 'store', title: '', tagline: '', description: '', province: '', categoryId: first?.id ?? '', sceneTemplateId: '', autoReplyEnabled: false },
  });
  const kind = form.watch('kind');
  const categories = catalog?.categories.filter((c) => c.kind === kind) ?? [];
  const templates = catalog?.sceneTemplates.filter((s) => s.kind === kind) ?? [];

  const setKind = (next: PlaceFormInput['kind']): void => {
    form.setValue('kind', next);
    form.setValue('categoryId', catalog?.categories.find((c) => c.kind === next)?.id ?? '');
    form.setValue('sceneTemplateId', catalog?.sceneTemplates.find((s) => s.kind === next)?.id ?? '');
  };

  const submit = form.handleSubmit(async (values) => {
    const body: PlaceInput = { ...values, tagline: values.tagline?.trim() || null, description: values.description?.trim() || null, province: values.province?.trim() || null };
    try {
      if (place) { await update({ id: place.id, body }).unwrap(); toast.success(t('saved')); }
      else { const created = await create(body).unwrap(); toast.success(t('created')); dispatch(ritualOffered({ placeId: created.id, title: created.title, modelKey: created.modelKey })); router.push(`/diem/${created.slug}/cai-dat`); }
    } catch (e) { toastApi.error(e); }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
      {!place ? (
        <div>
          <Label>{t('kind')}</Label>
          <div className="grid grid-cols-2 gap-2">{PLACE_KINDS.map((k) => <Chip key={k} active={kind === k} className="justify-center" onClick={() => setKind(k)}>{tk(k)}</Chip>)}</div>
        </div>
      ) : null}
      <div>
        <Label htmlFor="categoryId">{t('category')}</Label>
        <Select id="categoryId" {...form.register('categoryId')}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      </div>
      <div>
        <Label>{t('template')}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {templates.map((tpl) => (
            <button key={tpl.id} type="button" aria-pressed={form.watch('sceneTemplateId') === tpl.id} onClick={() => form.setValue('sceneTemplateId', tpl.id, { shouldValidate: true })}
              className={cn('flex flex-col items-center gap-1 rounded-2xl border-2 bg-linear-to-b from-scene-sky to-scene-ground p-2 text-xs font-bold text-ink', form.watch('sceneTemplateId') === tpl.id ? 'border-primary' : 'border-transparent')}>
              <PlaceIllustration modelKey={tpl.modelKey} />{tpl.name}
            </button>
          ))}
        </div>
        <FieldError message={form.formState.errors.sceneTemplateId ? validation('required') : undefined} />
      </div>
      <div><Label htmlFor="title">{t('title')}</Label><Input id="title" maxLength={60} {...form.register('title')} /><FieldError message={form.formState.errors.title ? validation('too_small', { min: 2 }) : undefined} /></div>
      <div><Label htmlFor="tagline">{t('tagline')}</Label><Input id="tagline" maxLength={100} {...form.register('tagline')} /></div>
      <div><Label htmlFor="description">{t('description')}</Label><Textarea id="description" maxLength={500} {...form.register('description')} /></div>
      <div><Label htmlFor="province">{t('province')}</Label><Input id="province" maxLength={40} {...form.register('province')} /></div>
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-surface-muted p-4">
        <div><Label className="mb-0.5">{t('autoReply')}</Label><p className="text-xs text-ink-muted">{t('autoReplyHelp')}</p></div>
        <Switch label={t('autoReply')} checked={form.watch('autoReplyEnabled') === true} onCheckedChange={(v) => form.setValue('autoReplyEnabled', v)} />
      </div>
      <p className="text-xs text-ink-subtle">{t('freeNote')}</p>
      <Button type="submit" size="lg" loading={creating || updating}>{place ? t('saveSettings') : t('create')}</Button>
    </form>
  );
}
