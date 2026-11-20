'use client';

import { FEED_TYPES } from '@chot-via/shared';
import { Chip } from '@chot-via/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { PageTitle } from '@/components/common/require-member';
import { ComposeBar, FeedFilters, FeedList } from '@/components/post/feed';
import { STORY_FILTER_DEFAULT, StoryBanner, StoryFilters, type StoryFilterState } from '@/components/story/story-header';
import { FunPollPanel, HotTopicsPanel, TopStoryAuthorsPanel } from '@/components/story/story-rail';
import { feedTypeChanged, selectFeedFilters } from '@/features/feed/feedSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Trang Kể khổ: banner + thanh lọc + bảng tin 2 cột. Vẫn là cùng một bảng tin chung, chỉ lọc theo loại Kể khổ. */
function StoryFeed() {
  const [filter, setFilter] = useState<StoryFilterState>(STORY_FILTER_DEFAULT);
  return (
    <div className="flex flex-col gap-4">
      <StoryBanner />
      <div className="grid gap-4 md:grid-cols-2 lg:hidden"><HotTopicsPanel /><FunPollPanel /><div className="md:col-span-2"><TopStoryAuthorsPanel /></div></div>
      <StoryFilters value={filter} onChange={setFilter} />
      <FeedList
        variant="wide"
        query={{ type: 'story', sort: filter.sort, ...(filter.has ? { has: filter.has } : {}), ...(filter.hashtag ? { hashtag: filter.hashtag } : {}) }}
      />
    </div>
  );
}

/** "Cộng đồng": toàn bộ bảng tin chung. Kể khổ/Khoe chỉ là bộ lọc của cùng một feed. */
function FeedPage() {
  const t = useTranslations('post');
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFeedFilters);
  const typeParam = FEED_TYPES.find((x) => x === params.get('type'));
  const hashtag = params.get('hashtag') ?? undefined;

  useEffect(() => { if (typeParam) dispatch(feedTypeChanged(typeParam)); }, [typeParam, dispatch]);

  if (typeParam === 'story' && !hashtag) return <StoryFeed />;

  return (
    <div className="flex flex-col gap-3">
      <PageTitle>{hashtag ? t('hashtagFeed', { tag: hashtag }) : t('feedHeading')}</PageTitle>
      {hashtag ? <Chip active onClick={() => router.push('/bang-tin')}>#{hashtag} ✕</Chip> : null}
      <ComposeBar />
      <FeedFilters />
      <FeedList query={{ type: filters.type, sort: filters.sort, ...(filters.role ? { role: filters.role } : {}), ...(hashtag ? { hashtag } : {}) }} />
    </div>
  );
}

export default function Page() {
  return <Suspense><FeedPage /></Suspense>;
}
