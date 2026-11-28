import { SHOP_ITEM_IMAGES, type ShopCatalog } from '@xin-via/shared';
import { Button, FormField, Input, Select, SwitchField } from '@xin-via/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { newId } from './shop-plans-editor';

/** Sửa danh sách nguồn thu tham khảo (trang Bảng giá). */
export function ShopRevenueEditor({ form }: { form: UseFormReturn<ShopCatalog> }) {
  const t = useTranslations('admin.shop');
  const rows = useFieldArray({ control: form.control, name: 'revenue' });
  return (
    <div className="flex flex-col gap-3">
      {rows.fields.map((f, i) => (
        <div key={f.id} className="grid grid-cols-[1fr_1fr_6rem_auto] items-end gap-2">
          <FormField label={t('revenueName')} error={form.formState.errors.revenue?.[i]?.name?.message}><Input {...form.register(`revenue.${i}.name`)} /></FormField>
          <FormField label={t('revenuePrice')} error={form.formState.errors.revenue?.[i]?.price?.message}><Input {...form.register(`revenue.${i}.price`)} /></FormField>
          <FormField label={t('revenuePriority')} error={form.formState.errors.revenue?.[i]?.priority?.message}><Input {...form.register(`revenue.${i}.priority`)} /></FormField>
          <Button variant="ghost" size="icon" aria-label={t('removeRevenue')} onClick={() => rows.remove(i)}><Trash2 className="size-4" aria-hidden /></Button>
        </div>
      ))}
      <Button variant="soft" size="sm" className="self-start" disabled={rows.fields.length >= 12} onClick={() => rows.append({ id: newId('r'), name: '', price: '', priority: 'P1' })}>
        <Plus className="size-4" aria-hidden />{t('addRevenue')}
      </Button>
    </div>
  );
}

/** Sửa danh sách vật phẩm 3D (trang Vật phẩm): tên, giá, ảnh có sẵn và công tắc hiện/ẩn. */
export function ShopItemsEditor({ form }: { form: UseFormReturn<ShopCatalog> }) {
  const t = useTranslations('admin.shop');
  const rows = useFieldArray({ control: form.control, name: 'items' });
  return (
    <div className="flex flex-col gap-3">
      {rows.fields.map((f, i) => (
        <div key={f.id} className="flex flex-col gap-2 rounded-2xl bg-surface-muted p-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
            <FormField label={t('itemName')} error={form.formState.errors.items?.[i]?.name?.message}><Input {...form.register(`items.${i}.name`)} /></FormField>
            <FormField label={t('itemPrice')} error={form.formState.errors.items?.[i]?.price?.message}><Input {...form.register(`items.${i}.price`)} /></FormField>
            <FormField label={t('itemImage')}>
              <Select {...form.register(`items.${i}.image`)}>
                {SHOP_ITEM_IMAGES.map((img) => <option key={img} value={img}>{t(`images.${img}`)}</option>)}
              </Select>
            </FormField>
            <Button variant="ghost" size="icon" aria-label={t('removeItem')} onClick={() => rows.remove(i)}><Trash2 className="size-4" aria-hidden /></Button>
          </div>
          <SwitchField label={t('itemActive')} checked={form.watch(`items.${i}.active`)} onCheckedChange={(on) => form.setValue(`items.${i}.active`, on, { shouldDirty: true })} />
        </div>
      ))}
      <Button variant="soft" size="sm" className="self-start" disabled={rows.fields.length >= 40} onClick={() => rows.append({ id: newId('i'), name: '', price: '', image: 'vp-cay', active: true })}>
        <Plus className="size-4" aria-hidden />{t('addItem')}
      </Button>
    </div>
  );
}
