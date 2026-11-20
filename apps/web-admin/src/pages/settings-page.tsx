import { useAdminSettingsQuery, useAdminSettingsSaveMutation } from '@chot-via/api-client';
import { AppSettingsSchema, type AppSettings } from '@chot-via/shared';
import { Button, Card, FormField, Input, Label, Skeleton, Switch, SwitchField, toast } from '@chot-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { PageHeader } from '../components/common';
import { useApiToast } from '../lib/use-api-toast';

type NumPath =
  | 'timeWindows.morningStartHour' | 'timeWindows.afternoonStartHour' | 'timeWindows.eveningStartHour' | 'wishCounterTtlHours' | 'storyMaxChars' | 'achievementMaxChars'
  | 'commentMaxChars' | 'wishMessageMaxChars' | 'postMaxImages' | 'imageMaxMb' | 'hashtagMax' | 'hot.halfLifeHours' | 'hot.windowDays' | 'hot.weights.reaction' | 'hot.weights.comment'
  | 'hot.weights.wish' | 'hot.weights.share' | 'leaderboard.maxMembers' | 'leaderboard.defaultVisible' | 'rateLimits.wishPerMinute' | 'rateLimits.postPerHour' | 'rateLimits.commentPerMinute'
  | 'rateLimits.reportPerDay' | 'moderation.escalateReportCount';

function Num({ form, name, label }: { form: UseFormReturn<AppSettings>; name: NumPath; label: string }) {
  return <FormField label={label} htmlFor={name}><Input id={name} type="number" step="any" {...form.register(name, { valueAsNumber: true })} /></FormField>;
}

const nullableNumber = (v: unknown): number | null => (v === '' || v === null || v === undefined ? null : Number(v));

function RangeEditor({ form, name, title }: { form: UseFormReturn<AppSettings>; name: 'achievementRanges.ownerRevenue' | 'achievementRanges.saleDeal'; title: string }) {
  const t = useTranslations('admin.settings');
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  return (
    <div className="rounded-2xl bg-surface-muted p-3">
      <p className="mb-2 font-semibold">{title}</p>
      <div className="flex flex-col gap-2">
        {fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-[5rem_1fr_1fr_auto] items-end gap-2">
            <div><Label className="text-xs">{t('fields.rangeCode')}</Label><Input {...form.register(`${name}.${i}.code`)} /></div>
            <div><Label className="text-xs">{t('fields.minVnd')}</Label><Input type="number" {...form.register(`${name}.${i}.minVnd`, { setValueAs: nullableNumber })} /></div>
            <div><Label className="text-xs">{t('fields.maxVnd')}</Label><Input type="number" {...form.register(`${name}.${i}.maxVnd`, { setValueAs: nullableNumber })} /></div>
            <Button variant="ghost" size="icon" aria-label={t('fields.removeRange')} onClick={() => remove(i)}><Trash2 className="size-4" aria-hidden /></Button>
          </div>
        ))}
      </div>
      <Button variant="soft" size="sm" className="mt-2" onClick={() => append({ code: `r${fields.length + 1}`, minVnd: null, maxVnd: null })}><Plus className="size-4" aria-hidden />{t('fields.addRange')}</Button>
    </div>
  );
}

export function SettingsPage() {
  const t = useTranslations('admin.settings');
  const tf = useTranslations('admin.settings.fields');
  const ts = useTranslations('admin.settings.sections');
  const tc = useTranslations('admin.common');
  const toastApi = useApiToast();
  const { data } = useAdminSettingsQuery();
  const [save, { isLoading }] = useAdminSettingsSaveMutation();
  const form = useForm<AppSettings>({ resolver: zodResolver(AppSettingsSchema), values: data });

  if (!data) return <Skeleton className="h-64" />;
  const submit = form.handleSubmit(async (values) => {
    try { await save(values).unwrap(); toast.success(t('saved')); } catch (e) { toastApi.error(e); }
  });

  const section = (title: string, children: React.ReactNode) => <Card className="flex flex-col gap-3 p-5"><h2 className="font-display text-xl font-extrabold">{title}</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div></Card>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
      <PageHeader title={t('title')} sub={t('note')} action={<Button type="submit" size="lg" loading={isLoading}>{tc('save')}</Button>} />
      {section(ts('time'), <>
        <Num form={form} name="timeWindows.morningStartHour" label={tf('morningStartHour')} />
        <Num form={form} name="timeWindows.afternoonStartHour" label={tf('afternoonStartHour')} />
        <Num form={form} name="timeWindows.eveningStartHour" label={tf('eveningStartHour')} />
        <Num form={form} name="wishCounterTtlHours" label={tf('wishCounterTtlHours')} />
        <SwitchField className="md:col-span-2" label={tf('campaignMode')} checked={form.watch('campaignMode')} onCheckedChange={(v) => form.setValue('campaignMode', v, { shouldDirty: true })} />
      </>)}
      <Card className="flex items-center justify-between gap-3 p-5">
        <Label className="mb-0">{tf('showDemoData')}</Label>
        <Switch label={tf('showDemoData')} checked={form.watch('showDemoData')} onCheckedChange={(v) => form.setValue('showDemoData', v, { shouldDirty: true })} />
      </Card>
      {section(ts('content'), <>
        <Num form={form} name="storyMaxChars" label={tf('storyMaxChars')} /><Num form={form} name="achievementMaxChars" label={tf('achievementMaxChars')} />
        <Num form={form} name="commentMaxChars" label={tf('commentMaxChars')} /><Num form={form} name="wishMessageMaxChars" label={tf('wishMessageMaxChars')} />
        <Num form={form} name="postMaxImages" label={tf('postMaxImages')} /><Num form={form} name="imageMaxMb" label={tf('imageMaxMb')} /><Num form={form} name="hashtagMax" label={tf('hashtagMax')} />
      </>)}
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-xl font-extrabold">{ts('ranges')}</h2><p className="text-xs text-ink-muted">{t('rangeHint')}</p>
        <div className="grid gap-3 xl:grid-cols-2">
          <RangeEditor form={form} name="achievementRanges.ownerRevenue" title={tf('ownerRevenue')} />
          <RangeEditor form={form} name="achievementRanges.saleDeal" title={tf('saleDeal')} />
        </div>
      </Card>
      {section(ts('hot'), <>
        <Num form={form} name="hot.halfLifeHours" label={tf('halfLifeHours')} /><Num form={form} name="hot.windowDays" label={tf('windowDays')} />
        <Num form={form} name="hot.weights.reaction" label={tf('weightReaction')} /><Num form={form} name="hot.weights.comment" label={tf('weightComment')} />
        <Num form={form} name="hot.weights.wish" label={tf('weightWish')} /><Num form={form} name="hot.weights.share" label={tf('weightShare')} />
      </>)}
      {section(ts('leaderboard'), <><Num form={form} name="leaderboard.maxMembers" label={tf('maxMembers')} /><Num form={form} name="leaderboard.defaultVisible" label={tf('defaultVisible')} /></>)}
      {section(ts('rate'), <>
        <Num form={form} name="rateLimits.wishPerMinute" label={tf('wishPerMinute')} /><Num form={form} name="rateLimits.postPerHour" label={tf('postPerHour')} />
        <Num form={form} name="rateLimits.commentPerMinute" label={tf('commentPerMinute')} /><Num form={form} name="rateLimits.reportPerDay" label={tf('reportPerDay')} />
      </>)}
      {section(ts('moderation'), <Num form={form} name="moderation.escalateReportCount" label={tf('escalateReportCount')} />)}
      <Button type="submit" size="lg" loading={isLoading} className="self-start">{tc('save')}</Button>
    </form>
  );
}
