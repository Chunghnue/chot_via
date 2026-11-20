'use client';

import { useGetSavedPostsQuery } from '@chot-via/api-client';
import { Button, EmptyState, Skeleton } from '@chot-via/ui';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageTitle, RequireMember } from '@/components/common/require-member';
import { PostCard } from '@/components/post/post-card';

function SavedPage({ page, onMore }: { page: number; onMore: () => void }) {
  const t = useTranslations('post');
  const { data, isLoading } = useGetSavedPostsQuery(page);
  if (isLoading) return <Skeleton className="h-40" />;
  return (
    <>
      {data?.items.map((p) => <PostCard key={p.id} post={p} />)}
      {data?.meta.hasMore ? <Button variant="outline" onClick={onMore}>{t('loadMore')}</Button> : null}
    </>
  );
}

function Content() {
  const t = useTranslations('nav');
  const tp = useTranslations('profile');
  const [pages, setPages] = useState(1);
  const first = useGetSavedPostsQuery(1);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <PageTitle>{t('saved')}</PageTitle>
      {first.data?.items.length === 0 ? <EmptyState icon="🔖" title={tp('savedEmpty')} /> : Array.from({ length: pages }, (_, i) => <SavedPage key={i} page={i + 1} onMore={() => setPages(i + 2)} />)}
    </div>
  );
}

export default function SavedPostsPage() {
  const t = useTranslations('profile');
  return <RequireMember reason="profile" message={t('loginPrompt')}><Content /></RequireMember>;
}
