import { SwitchField, Button, FormField, Input } from '@chot-via/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import type { ShopCatalog } from '@chot-via/shared';

/** Mã gói/dòng mới: duy nhất trong biểu mẫu, đủ ngắn để hiển thị trong dữ liệu. */
export const newId = (prefix: string): string => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 2).toString(36)}`;

/** Sửa danh sách gói thành viên và bảng quyền lợi (mỗi quyền lợi chọn gói nào có). */
export function ShopPlansEditor({ form }: { form: UseFormReturn<ShopCatalog> }) {
  const t = useTranslations('admin.shop');
  const plans = useFieldArray({ control: form.control, name: 'plans' });
  const features = useFieldArray({ control: form.control, name: 'features' });
  const planList = form.watch('plans');
  const removePlan = (index: number): void => {
    const id = planList[index]?.id;
    plans.remove(index);
    features.fields.forEach((_, i) => {
      const ids = form.getValues(`features.${i}.planIds`);
      form.setValue(`features.${i}.planIds`, ids.filter((p) => p !== id), { shouldDirty: true });
    });
  };
  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">{t('plansHint')}</p>
        {plans.fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <FormField label={t('planName')} error={form.formState.errors.plans?.[i]?.name?.message}><Input {...form.register(`plans.${i}.name`)} /></FormField>
            <FormField label={t('planPrice')} error={form.formState.errors.plans?.[i]?.price?.message}><Input {...form.register(`plans.${i}.price`)} /></FormField>
            <Button variant="ghost" size="icon" aria-label={t('removePlan')} disabled={plans.fields.length <= 1} onClick={() => removePlan(i)}><Trash2 className="size-4" aria-hidden /></Button>
          </div>
        ))}
        <Button variant="soft" size="sm" className="self-start" disabled={plans.fields.length >= 6} onClick={() => plans.append({ id: newId('p'), name: '', price: '' })}>
          <Plus className="size-4" aria-hidden />{t('addPlan')}
        </Button>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="font-display text-lg font-extrabold">{t('features')}</h3>
        {features.fields.map((f, i) => (
          <div key={f.id} className="flex flex-col gap-2 rounded-2xl bg-surface-muted p-3">
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <FormField label={t('featureLabel')} error={form.formState.errors.features?.[i]?.label?.message}><Input {...form.register(`features.${i}.label`)} /></FormField>
              <Button variant="ghost" size="icon" aria-label={t('removeFeature')} onClick={() => features.remove(i)}><Trash2 className="size-4" aria-hidden /></Button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {planList.map((p) => {
                const ids = form.watch(`features.${i}.planIds`);
                return (
                  <SwitchField
                    key={p.id} label={p.name || '—'} checked={ids.includes(p.id)}
                    onCheckedChange={(on) => form.setValue(`features.${i}.planIds`, on ? [...ids, p.id] : ids.filter((x) => x !== p.id), { shouldDirty: true })}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <Button variant="soft" size="sm" className="self-start" disabled={features.fields.length >= 20} onClick={() => features.append({ id: newId('f'), label: '', planIds: [] })}>
          <Plus className="size-4" aria-hidden />{t('addFeature')}
        </Button>
      </div>
    </>
  );
}
