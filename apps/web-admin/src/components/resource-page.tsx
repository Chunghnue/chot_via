import { useAdminAssetUploadMutation, useUploadMediaMutation } from '@xin-via/api-client';
import { Badge, Button, FormField, Input, Select, Sheet, Skeleton, SwitchField, Textarea, toast, useConfirm } from '@xin-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import type { z } from 'zod';
import { useApiToast } from '../lib/use-api-toast';
import { PageHeader, TableShell, Td, Th } from './common';

export interface SelectOption { value: string; label: string }

export interface FieldDef<I extends FieldValues> {
  name: Path<I>;
  label: string;
  kind: 'text' | 'textarea' | 'number' | 'nullableNumber' | 'switch' | 'select' | 'nullableText' | 'nullableSelect' | 'datetime' | 'image' | 'tags' | 'asset';
  options?: SelectOption[];
}

type Trigger<A> = (arg: A) => { unwrap(): Promise<unknown> };
type MutationHook<A> = () => readonly [Trigger<A>, { isLoading: boolean }];

export interface ResourceConfig<Item extends { id: string }, I extends FieldValues> {
  title: string;
  note?: string | undefined;
  fields: FieldDef<NoInfer<I>>[];
  schema: z.ZodType<I, z.ZodTypeDef, I>;
  defaults: DefaultValues<NoInfer<I>>;
  toInput: (item: NoInfer<Item>) => NoInfer<I>;
  columns: { header: string; cell: (item: NoInfer<Item>) => ReactNode }[];
  useList: () => { data: Item[] | undefined; isLoading: boolean };
  useCreate: MutationHook<NoInfer<I>>;
  useUpdate: MutationHook<{ id: string; body: NoInfer<I> }>;
  useRemove: MutationHook<string>;
}

const text = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const toLocalInput = (iso: unknown): string => {
  if (typeof iso !== 'string' || !iso) return '';
  const d = new Date(iso);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Ô tải ảnh: chọn file → tải lên máy chủ (nén WebP) → lưu đường dẫn ảnh vào trường. */
export function ImageInput({ value, onChange, label }: { value: string | null; onChange: (url: string | null) => void; label: string }) {
  const t = useTranslations('admin.common');
  const [upload, { isLoading }] = useUploadMediaMutation();
  const { error: toastError } = useApiToast();
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-16 w-24 rounded-xl bg-surface-muted object-cover" />
      ) : (
        <span className="flex h-16 w-24 items-center justify-center rounded-xl bg-surface-muted text-xs text-ink-subtle">—</span>
      )}
      <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-muted">
        {isLoading ? t('uploading') : label}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void upload(file)
                .unwrap()
                .then((m) => onChange(m.url))
                .catch(toastError);
          }}
        />
      </label>
      {value ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          {t('removeImage')}
        </Button>
      ) : null}
    </div>
  );
}

/** Ô nhập đường dẫn file (ảnh gốc hoặc .glb) kèm nút tải lên máy chủ, giữ nguyên chất lượng file. */
export function AssetInput({ id, value, onChange, accept }: { id: string; value: string | null; onChange: (url: string | null) => void; accept: string }) {
  const t = useTranslations('admin.common');
  const tf = useTranslations('admin.resources.fields');
  const [upload, { isLoading }] = useAdminAssetUploadMutation();
  const { error: toastError } = useApiToast();
  return (
    <div className="flex items-center gap-2">
      <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />
      <label className="shrink-0 cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-muted">
        {isLoading ? t('uploading') : tf('uploadFile')}
        <input type="file" accept={accept} className="sr-only" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file).unwrap().then((r) => onChange(r.url)).catch(toastError);
        }} />
      </label>
    </div>
  );
}

/** CRUD dùng chung cho các danh mục cấu hình: một khai báo gồm cột, trường nhập, schema Zod và 4 hook RTK Query có kiểu. */
export function ResourcePage<Item extends { id: string }, I extends FieldValues>({ config }: { config: ResourceConfig<Item, I> }) {
  const t = useTranslations('admin.common');
  const { error: toastError } = useApiToast();
  const { data, isLoading } = config.useList();
  const [create, { isLoading: creating }] = config.useCreate();
  const [update, { isLoading: updating }] = config.useUpdate();
  const [remove] = config.useRemove();
  const confirm = useConfirm();
  const askDelete = async (id: string): Promise<void> => {
    if (!(await confirm({ title: t('confirmDelete'), confirmLabel: t('delete') }))) return;
    void remove(id).unwrap().then(() => toast.success(t('deleted'))).catch(toastError);
  };
  const [editing, setEditing] = useState<{ item: Item | null } | null>(null);
  const form = useForm<I, unknown, I>({ resolver: zodResolver(config.schema), defaultValues: config.defaults });

  const open = (item: Item | null): void => {
    form.reset(item ? config.toInput(item) : config.defaults);
    setEditing({ item });
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      if (editing?.item) await update({ id: editing.item.id, body: values }).unwrap();
      else await create(values).unwrap();
      toast.success(t('saved'));
      setEditing(null);
    } catch (e) { toastError(e); }
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={config.title} sub={config.note} action={<Button onClick={() => open(null)}><Plus className="size-4" aria-hidden />{t('create')}</Button>} />
      {isLoading ? <Skeleton className="h-48" /> : !data || data.length === 0 ? <p className="rounded-card bg-surface p-8 text-center text-ink-muted shadow-card">{t('empty')}</p> : (
        <TableShell>
          <thead><tr>{config.columns.map((c) => <Th key={c.header}>{c.header}</Th>)}<Th>{t('actions')}</Th></tr></thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-surface-muted/60">
                {config.columns.map((c) => <Td key={c.header}>{c.cell(item)}</Td>)}
                <Td className="whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => open(item)}><Pencil className="size-4" aria-hidden />{t('edit')}</Button>
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => void askDelete(item.id)}><Trash2 className="size-4" aria-hidden />{t('delete')}</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }} title={editing?.item ? t('edit') : t('create')} closeLabel={t('close')} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
          {config.fields.map((f) => {
            const err = form.formState.errors[f.name];
            return (
              <div key={f.name}>
                {f.kind === 'switch' ? (
                  <Controller
                    control={form.control}
                    name={f.name}
                    render={({ field }) => <SwitchField label={f.label} checked={field.value === true} onCheckedChange={field.onChange} />}
                  />
                ) : (
                  <FormField label={f.label} htmlFor={f.name} error={err ? text(err.message) || t('required') : undefined}>
                    {f.kind === 'text' ? <Input id={f.name} {...form.register(f.name)} /> : null}
                    {f.kind === 'nullableText' ? (
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => <Input id={f.name} value={text(field.value)} onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)} />}
                      />
                    ) : null}
                    {f.kind === 'textarea' ? <Textarea id={f.name} {...form.register(f.name)} /> : null}
                    {f.kind === 'number' ? <Input id={f.name} type="number" {...form.register(f.name, { valueAsNumber: true })} /> : null}
                    {f.kind === 'nullableNumber' ? (
                      <Input id={f.name} type="number" {...form.register(f.name, { setValueAs: (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v)) })} />
                    ) : null}
                    {f.kind === 'select' ? (
                      <Select id={f.name} {...form.register(f.name)}>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    ) : null}
                    {f.kind === 'nullableSelect' ? (
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => (
                          <Select id={f.name} value={text(field.value)} onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}>
                            {f.options?.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Select>
                        )}
                      />
                    ) : null}
                    {f.kind === 'image' ? (
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => <ImageInput label={f.label} value={typeof field.value === 'string' ? field.value : null} onChange={field.onChange} />}
                      />
                    ) : null}
                    {f.kind === 'asset' ? (
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => (
                          <AssetInput id={f.name} accept=".glb,image/*" value={typeof field.value === 'string' ? field.value : null} onChange={field.onChange} />
                        )}
                      />
                    ) : null}
                    {f.kind === 'tags' ? (
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => (
                          <Input
                            id={f.name}
                            value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .split(',')
                                  .map((x) => x.trim().replace(/^#/, ''))
                                  .filter((x) => x !== ''),
                              )
                            }
                          />
                        )}
                      />
                    ) : null}
                    {f.kind === 'datetime' ? (
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => (
                          <Input
                            id={f.name}
                            type="datetime-local"
                            value={toLocalInput(field.value)}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                          />
                        )}
                      />
                    ) : null}
                  </FormField>
                )}
              </div>
            );
          })}
          <Button type="submit" size="lg" loading={creating || updating}>{t('save')}</Button>
        </form>
      </Sheet>
    </div>
  );
}

export const ActiveBadge = ({ active }: { active: boolean }) => <ActiveBadgeInner active={active} />;
function ActiveBadgeInner({ active }: { active: boolean }) {
  const t = useTranslations('admin.common');
  return <Badge tone={active ? 'success' : 'neutral'}>{active ? t('active') : t('inactive')}</Badge>;
}
