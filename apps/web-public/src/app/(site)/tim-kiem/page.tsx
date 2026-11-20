'use client';

import { useSearchQuery } from '@chot-via/api-client';
import { Avatar, Card, EmptyState, Input, Skeleton } from '@chot-via/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageTitle } from '@/components/common/require-member';
import { PlaceGrid } from '@/components/place/place-list';
import { PostCard } from '@/components/post/post-card';
import { placeSheetOpened } from '@/features/ui/uiSlice';
import { useAppDispatch } from '@/store/hooks';

function SearchPage() {
  const t = useTranslations('community.search');
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const q = params.get('q')?.trim() ?? '';
  const [text, setText] = useState(q);
  const { data, isFetching } = useSearchQuery(q, { skip: q === '' });

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>{t('title')}</PageTitle>
      <form onSubmit={(e) => { e.preventDefault(); router.push(`/tim-kiem?q=${encodeURIComponent(text.trim())}`); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('placeholder')} aria-label={t('placeholder')} />
      </form>
      {q === '' ? <EmptyState icon="🔎" title={t('hint')} /> : isFetching ? <Skeleton className="h-40" /> : data && data.posts.length + data.places.length + data.users.length === 0 ? <EmptyState icon="🤷" title={t('empty')} /> : data ? (
        <>
          {data.places.length ? <section><h2 className="mb-2 font-display text-xl font-bold">{t('places')}</h2><PlaceGrid places={data.places} onSelect={(id) => dispatch(placeSheetOpened({ placeId: id }))} /></section> : null}
          {data.users.length ? (
            <section><h2 className="mb-2 font-display text-xl font-bold">{t('users')}</h2>
              <Card className="divide-y divide-border">{data.users.map((u) => (
                <Link key={u.id} href={`/u/${u.id}`} className="flex items-center gap-3 p-3 hover:bg-surface-muted"><Avatar src={u.avatarUrl} name={u.displayName} size={40} /><span className="font-semibold">{u.displayName}</span></Link>
              ))}</Card>
            </section>
          ) : null}
          {data.posts.length ? <section className="flex flex-col gap-3"><h2 className="font-display text-xl font-bold">{t('posts')}</h2>{data.posts.map((p) => <PostCard key={p.id} post={p} />)}</section> : null}
        </>
      ) : null}
    </div>
  );
}

export default function Page() {
  return <Suspense><SearchPage /></Suspense>;
}
