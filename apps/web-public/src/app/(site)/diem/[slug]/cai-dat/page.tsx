'use client';

import { useDeletePlaceMutation, useGetAutoRepliesQuery, useGetCatalogQuery, useGetPlaceQuery, useSetAutoRepliesMutation } from '@xin-via/api-client';
import { Button, Card, EmptyState, Skeleton, Textarea, toast, useConfirm, AppIcon } from '@xin-via/ui';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageTitle, RequireMember } from '@/components/common/require-member';
import { PlaceForm } from '@/components/place/place-form';
import { useApiToast } from '@/lib/use-api-toast';

function AutoReplyTexts({ placeId }: { placeId: string }) {
  const t = useTranslations('place.form');
  const tc = useTranslations('common');
  const { data: catalog } = useGetCatalogQuery();
  const { data } = useGetAutoRepliesQuery(placeId);
  const [save, { isLoading }] = useSetAutoRepliesMutation();
  const toastApi = useApiToast();
  const [edits, setEdits] = useState<Record<string, string>>({});
  if (!catalog || !data) return <Skeleton className="h-40" />;
  const value = (wishTypeId: string): string => edits[wishTypeId] ?? data.replies.find((r) => r.wishTypeId === wishTypeId)?.text ?? '';

  const submit = async (): Promise<void> => {
    const replies = catalog.wishTypes.map((w) => ({ wishTypeId: w.id, text: value(w.id).trim() })).filter((r) => r.text.length >= 2);
    try { await save({ id: placeId, body: { replies } }).unwrap(); toast.success(t('saved')); } catch (e) { toastApi.error(e); }
  };

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div><h2 className="font-display text-xl font-extrabold">{t('autoReplyTexts')}</h2><p className="text-xs text-ink-muted">{t('autoReplyTextsHelp')}</p></div>
      {catalog.wishTypes.map((w) => (
        <label key={w.id} className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-sm font-bold"><AppIcon iconKey={w.iconKey} />{w.name}</span>
          <Textarea value={value(w.id)} maxLength={200} className="min-h-16" onChange={(e) => setEdits((prev) => ({ ...prev, [w.id]: e.target.value }))} />
        </label>
      ))}
      <Button loading={isLoading} onClick={() => void submit()}>{tc('save')}</Button>
    </Card>
  );
}

function Content() {
  const t = useTranslations('place');
  const tc = useTranslations('common');
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const toastApi = useApiToast();
  const { data: place, isLoading } = useGetPlaceQuery(slug);
  const [remove, { isLoading: removing }] = useDeletePlaceMutation();
  const confirm = useConfirm();
  if (isLoading) return <Skeleton className="h-72" />;
  if (!place) return <EmptyState icon="🏚️" title={t('notFound')} />;
  if (!place.viewer?.isOwner) return <EmptyState icon="🔒" title={t('form.notOwner')} />;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageTitle>{t('form.editTitle')}</PageTitle>
      <Card className="p-5"><PlaceForm place={place} /></Card>
      <AutoReplyTexts placeId={place.id} />
      <Button variant="danger" loading={removing} onClick={() => {
        void (async () => {
          if (!(await confirm({ title: t('form.deleteTitle'), description: t('form.deleteBody'), confirmLabel: tc('delete') }))) return;
          void remove(place.id).unwrap().then(() => { toast.success(t('form.deleted')); router.push('/tao-diem'); }).catch(toastApi.error);
        })();
      }}>{tc('delete')}</Button>
    </div>
  );
}

export default function PlaceSettingsPage() {
  const t = useTranslations('place.form');
  return <RequireMember reason="place" message={t('loginNeeded')}><Content /></RequireMember>;
}
