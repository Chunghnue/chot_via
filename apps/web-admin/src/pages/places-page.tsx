import { useAdminPlaceCreateMutation, useAdminPlaceDeleteMutation, useAdminPlaceUpdateMutation, useAdminPlacesQuery, useDemoUsersListQuery, useGetCatalogQuery } from '@chot-via/api-client';
import { AdminPlaceInputSchema, PLACE_KINDS, PLACE_STATUSES, type AdminPlaceInput, type PlaceDetail } from '@chot-via/shared';
import { Badge, Button, FormField, Input, Select, Sheet, Skeleton, SwitchField, Textarea, toast, useConfirm } from '@chot-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import type { z } from 'zod';
import { PageHeader, Pager, TableShell, Td, Th } from '../components/common';
import { ImageInput } from '../components/resource-page';
import { useApiToast } from '../lib/use-api-toast';

type FormInput = z.input<typeof AdminPlaceInputSchema>;
const EMPTY: FormInput = {
  kind: 'store',
  title: '',
  tagline: '',
  description: '',
  province: '',
  categoryId: '',
  sceneTemplateId: '',
  autoReplyEnabled: true,
  ownerId: null,
  isDemo: true,
  status: 'visible',
  sortOrder: 0,
  coverUrl: null,
};

export function PlacesPage() {
  const t = useTranslations('admin.places');
  const tc = useTranslations('admin.common');
  const toastApi = useApiToast();
  const { data: catalog } = useGetCatalogQuery();
  const { data: demoUsers } = useDemoUsersListQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPlacesQuery({ page, pageSize: 20, ...(search ? { search } : {}) });
  const [create, { isLoading: creating }] = useAdminPlaceCreateMutation();
  const [update, { isLoading: updating }] = useAdminPlaceUpdateMutation();
  const [remove] = useAdminPlaceDeleteMutation();
  const confirm = useConfirm();
  const askDelete = async (id: string): Promise<void> => {
    if (!(await confirm({ title: tc('confirmDelete'), confirmLabel: tc('delete') }))) return;
    void remove(id).unwrap().then(() => toast.success(tc('deleted'))).catch(toastApi.error);
  };
  const [editing, setEditing] = useState<{ place: PlaceDetail | null } | null>(null);
  const form = useForm<FormInput, unknown, AdminPlaceInput>({ resolver: zodResolver(AdminPlaceInputSchema), defaultValues: EMPTY });
  const kind = form.watch('kind');
  const categories = catalog?.categories.filter((c) => c.kind === kind) ?? [];
  const templates = catalog?.sceneTemplates.filter((s) => s.kind === kind) ?? [];

  const open = (place: PlaceDetail | null): void => {
    const firstKind = place?.kind ?? 'store';
    form.reset(
      place
        ? {
            kind: place.kind,
            title: place.title,
            tagline: place.tagline ?? '',
            description: place.description ?? '',
            province: place.province ?? '',
            categoryId: place.categoryId,
            sceneTemplateId: place.sceneTemplateId,
            autoReplyEnabled: place.autoReplyEnabled,
            ownerId: place.owner?.id ?? null,
            isDemo: place.isDemo,
            status: place.status,
            sortOrder: place.sortOrder,
            coverUrl: place.coverUrl,
          }
        : {
            ...EMPTY,
            categoryId: catalog?.categories.find((c) => c.kind === firstKind)?.id ?? '',
            sceneTemplateId: catalog?.sceneTemplates.find((s) => s.kind === firstKind)?.id ?? '',
          },
    );
    setEditing({ place });
  };

  const submit = form.handleSubmit(async (values) => {
    const body: AdminPlaceInput = {
      ...values,
      tagline: values.tagline?.trim() || null,
      description: values.description?.trim() || null,
      province: values.province?.trim() || null,
      ownerId: values.ownerId?.trim() || null,
    };
    try {
      if (editing?.place) await update({ id: editing.place.id, body }).unwrap();
      else await create(body).unwrap();
      toast.success(tc('saved'));
      setEditing(null);
    } catch (e) { toastApi.error(e); }
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t('title')}
        sub={t('demoNote')}
        action={
          <Button onClick={() => open(null)}>
            <Plus className="size-4" aria-hidden />
            {tc('create')}
          </Button>
        }
      />
      <Input
        className="max-w-xs"
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>{t('form.title')}</Th>
              <Th>{t('form.category')}</Th>
              <Th>{t('owner')}</Th>
              <Th>{tc('status')}</Th>
              <Th>{tc('actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id}>
                <Td>
                  <b>{p.title}</b> {p.isDemo ? <Badge tone="gold">{t('demo')}</Badge> : null}
                  <p className="text-xs text-ink-subtle">
                    {p.wishCount} 🙏 · {p.visitCount} · {t(`kinds.${p.kind}`)}
                  </p>
                </Td>
                <Td>{p.categoryName}</Td>
                <Td>{p.owner?.displayName ?? t('noOwner')}</Td>
                <Td>
                  <Badge tone={p.status === 'visible' ? 'success' : 'warning'}>{p.status === 'visible' ? t('visible') : t('hiddenStatus')}</Badge>
                </Td>
                <Td className="whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => open(p)}>
                    <Pencil className="size-4" aria-hidden />
                    {tc('edit')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => void askDelete(p.id)}>
                    <Trash2 className="size-4" aria-hidden />
                    {tc('delete')}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <Pager page={page} hasMore={data?.meta.hasMore ?? false} onPage={setPage} />

      <Sheet
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        size="lg"
        title={editing?.place ? t('form.editTitle') : t('form.createTitle')}
        closeLabel={tc('close')}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormField label={t('form.kind')}>
            <Select
              value={kind}
              onChange={(e) => {
                const k = PLACE_KINDS.find((x) => x === e.target.value) ?? 'store';
                form.setValue('kind', k);
                form.setValue('categoryId', catalog?.categories.find((c) => c.kind === k)?.id ?? '');
                form.setValue('sceneTemplateId', catalog?.sceneTemplates.find((s) => s.kind === k)?.id ?? '');
              }}
            >
              {PLACE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`kinds.${k}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('form.category')}>
            <Select {...form.register('categoryId')}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('form.template')}>
            <Select {...form.register('sceneTemplateId')}>
              {templates.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('form.title')} error={form.formState.errors.title ? tc('required') : undefined}>
            <Input {...form.register('title')} />
          </FormField>
          <FormField label={t('form.tagline')}>
            <Input {...form.register('tagline')} />
          </FormField>
          <FormField label={t('form.description')}>
            <Textarea {...form.register('description')} />
          </FormField>
          <FormField label={t('form.province')}>
            <Input {...form.register('province')} />
          </FormField>
          <FormField label={t('form.ownerId')}>
            <Select value={form.watch('ownerId') ?? ''} onChange={(e) => form.setValue('ownerId', e.target.value === '' ? null : e.target.value)}>
              <option value="">{t('noOwner')}</option>
              {demoUsers?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('form.coverUrl')}>
            <ImageInput label={t('form.coverUrl')} value={form.watch('coverUrl') ?? null} onChange={(url) => form.setValue('coverUrl', url)} />
          </FormField>
          <FormField label={t('form.sortOrder')}>
            <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} />
          </FormField>
          <FormField label={t('form.status')}>
            <Select {...form.register('status')}>
              {PLACE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'visible' ? t('visible') : t('hiddenStatus')}
                </option>
              ))}
            </Select>
          </FormField>
          <SwitchField label={t('form.isDemo')} checked={form.watch('isDemo') === true} onCheckedChange={(v) => form.setValue('isDemo', v)} />
          <SwitchField label={t('form.autoReply')} checked={form.watch('autoReplyEnabled') === true} onCheckedChange={(v) => form.setValue('autoReplyEnabled', v)} />
          <Button type="submit" size="lg" loading={creating || updating}>
            {tc('save')}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
