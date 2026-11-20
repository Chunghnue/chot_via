import { useAdminHomeConfigQuery, useAdminHomeConfigSaveMutation, adminApi } from '@chot-via/api-client';
import { HomeConfigSchema, type HomeConfig } from '@chot-via/shared';
import { Button, Card, FormField, Input, Skeleton, SwitchField, Textarea, toast } from '@chot-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { AssetInput } from '../components/resource-page';
import { PageHeader } from '../components/common';
import { useApiToast } from '../lib/use-api-toast';

type NumPath = 'camera.fov' | 'camera.distance' | 'camera.height' | 'camera.minPolarDeg' | 'camera.maxPolarDeg' | 'deityScale' | 'deityRegion.x' | 'deityRegion.y' | 'deityRegion.w' | 'deityRegion.h';

function Num({ form, name, label }: { form: UseFormReturn<HomeConfig>; name: NumPath; label: string }) {
  return <FormField label={label} htmlFor={name}><Input id={name} type="number" step="any" {...form.register(name, { valueAsNumber: true })} /></FormField>;
}

/** Khung ảnh phố kèm các vùng bấm (cửa hàng + Thần Tài) để admin canh toạ độ bằng mắt. */
function RegionPreview({ imageUrl, deity }: { imageUrl: string; deity: HomeConfig['deityRegion'] }) {
  const { data: slots } = adminApi.useStreetSlotsListQuery();
  const box = (r: { x: number; y: number; w: number; h: number }, label: string, key: string) => (
    <div key={key} className="absolute border-2 border-dashed border-wish bg-wish/15 text-[0.7rem] font-bold text-on-primary" style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}>
      <span className="rounded bg-wish px-1">{label}</span>
    </div>
  );
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface-muted" style={{ aspectRatio: '1672 / 941' }}>
      <img src={imageUrl} alt="" className="size-full object-cover" />
      {(slots ?? []).filter((s) => s.active && s.imageW > 0 && s.imageH > 0).map((s) => box({ x: s.imageX, y: s.imageY, w: s.imageW, h: s.imageH }, s.label, s.id))}
      {box(deity, 'Thần Tài', 'deity')}
    </div>
  );
}

export function HomeConfigPage() {
  const t = useTranslations('admin.homeConfig');
  const tc = useTranslations('admin.common');
  const toastApi = useApiToast();
  const { data } = useAdminHomeConfigQuery();
  const [save, { isLoading }] = useAdminHomeConfigSaveMutation();
  const form = useForm<HomeConfig>({ resolver: zodResolver(HomeConfigSchema), values: data });
  if (!data) return <Skeleton className="h-64" />;

  const submit = form.handleSubmit(async (values) => {
    try { await save(values).unwrap(); toast.success(t('saved')); } catch (e) { toastApi.error(e); }
  });
  const section = (title: string, children: React.ReactNode) => <Card className="flex flex-col gap-3 p-5"><h2 className="font-display text-xl font-extrabold">{title}</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div></Card>;
  const heroUrl = form.watch('heroImageUrl');

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
      <PageHeader title={t('title')} sub={t('note')} action={<Button type="submit" size="lg" loading={isLoading}>{tc('save')}</Button>} />
      {section(t('sectionHero'), <>
        <FormField className="md:col-span-2 xl:col-span-3" label={t('heroImageUrl')} htmlFor="heroImageUrl" error={form.formState.errors.heroImageUrl ? tc('required') : undefined}>
          <Controller control={form.control} name="heroImageUrl" render={({ field }) => <AssetInput id="heroImageUrl" accept="image/*" value={field.value} onChange={(v) => field.onChange(v ?? '')} />} />
        </FormField>
        <FormField label={t('heroTitle')} htmlFor="heroTitle"><Input id="heroTitle" {...form.register('heroTitle')} /></FormField>
        <FormField label={t('heroSubtitle')} htmlFor="heroSubtitle"><Input id="heroSubtitle" {...form.register('heroSubtitle')} /></FormField>
        <FormField label={t('ctaHint')} htmlFor="ctaHint"><Input id="ctaHint" {...form.register('ctaHint')} /></FormField>
        <FormField className="md:col-span-2" label={t('signLines')} htmlFor="signLines">
          <Controller control={form.control} name="signLines" render={({ field }) => (
            <Textarea id="signLines" rows={4} value={field.value.join('\n')} onChange={(e) => field.onChange(e.target.value.split('\n').map((x) => x.trim()).filter((x) => x !== ''))} />
          )} />
        </FormField>
        <FormField label={t('streetGlbUrl')} htmlFor="streetGlbUrl">
          <Controller control={form.control} name="streetGlbUrl" render={({ field }) => <AssetInput id="streetGlbUrl" accept=".glb" value={field.value} onChange={field.onChange} />} />
        </FormField>
      </>)}
      {section(t('sectionCamera'), <>
        <Num form={form} name="camera.fov" label={t('fov')} /><Num form={form} name="camera.distance" label={t('distance')} /><Num form={form} name="camera.height" label={t('height')} />
        <Num form={form} name="camera.minPolarDeg" label={t('minPolarDeg')} /><Num form={form} name="camera.maxPolarDeg" label={t('maxPolarDeg')} />
        <SwitchField label={t('autoRotate')} checked={form.watch('camera.autoRotate')} onCheckedChange={(v) => form.setValue('camera.autoRotate', v, { shouldDirty: true })} />
      </>)}
      {section(t('sectionDeity'), <>
        <FormField label={t('deityGlbUrl')} htmlFor="deityGlbUrl">
          <Controller control={form.control} name="deityGlbUrl" render={({ field }) => <AssetInput id="deityGlbUrl" accept=".glb" value={field.value} onChange={field.onChange} />} />
        </FormField>
        <Num form={form} name="deityScale" label={t('deityScale')} />
        <Num form={form} name="deityRegion.x" label={t('x')} /><Num form={form} name="deityRegion.y" label={t('y')} /><Num form={form} name="deityRegion.w" label={t('w')} /><Num form={form} name="deityRegion.h" label={t('h')} />
      </>)}
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-xl font-extrabold">{t('sectionPreview')}</h2>
        <RegionPreview imageUrl={heroUrl} deity={{ x: form.watch('deityRegion.x'), y: form.watch('deityRegion.y'), w: form.watch('deityRegion.w'), h: form.watch('deityRegion.h') }} />
      </Card>
      <Button type="submit" size="lg" loading={isLoading} className="self-start">{tc('save')}</Button>
    </form>
  );
}
