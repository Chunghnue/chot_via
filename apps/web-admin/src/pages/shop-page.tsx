import { useAdminShopQuery, useAdminShopSaveMutation } from '@chot-via/api-client';
import { ShopCatalogSchema, type ShopCatalog } from '@chot-via/shared';
import { Button, Card, Skeleton, toast } from '@chot-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { PageHeader } from '../components/common';
import { ShopItemsEditor, ShopRevenueEditor } from '../components/shop-lists-editor';
import { ShopPlansEditor } from '../components/shop-plans-editor';
import { useApiToast } from '../lib/use-api-toast';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      {children}
    </Card>
  );
}

/** Quản lý nội dung hai trang công khai Bảng giá (gói, quyền lợi, nguồn thu) và Vật phẩm 3D. Lưu thành một khối cài đặt, không có bảng database riêng. */
export function ShopPage() {
  const t = useTranslations('admin.shop');
  const tc = useTranslations('admin.common');
  const toastApi = useApiToast();
  const { data } = useAdminShopQuery();
  const [save, { isLoading }] = useAdminShopSaveMutation();
  const form = useForm<ShopCatalog>({ resolver: zodResolver(ShopCatalogSchema), values: data });
  if (!data) return <Skeleton className="h-64" />;
  const submit = form.handleSubmit(async (values) => {
    try { await save(values).unwrap(); toast.success(t('saved')); } catch (e) { toastApi.error(e); }
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
      <PageHeader title={t('title')} sub={t('note')} action={<Button type="submit" size="lg" loading={isLoading}>{tc('save')}</Button>} />
      <Section title={t('plans')}><ShopPlansEditor form={form} /></Section>
      <Section title={t('revenue')}><ShopRevenueEditor form={form} /></Section>
      <Section title={t('items')}><ShopItemsEditor form={form} /></Section>
    </form>
  );
}
