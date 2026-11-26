'use client';

import { useGetHomeQuery } from '@chot-via/api-client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useTranslations } from 'use-intl';
import { ActionCards, HomeHero } from '@/components/home/hero';
import { ComposeBar, FeedList, HomeFeedFilters, HomeSortControl } from '@/components/post/feed';
import { composerOpened } from '@/features/composer/composerSlice';
import { ReflectCard } from '@/components/home/reflect-card';
import { CommunityCard, ChallengeTasks, CreateStoreCard, DeityBanner, FeaturedEventCard, MobileShortcutCards } from '@/components/home/home-extras';
import { QuickWishCard } from '@/components/rail/quick-wish-card';
import { ChallengeCard } from '@/components/rail/side-cards';
import { WeeklyBoard } from '@/components/rail/weekly-board';
import { selectFeedFilters } from '@/features/feed/feedSlice';
import { deviceClass, track } from '@/lib/analytics';
import { Button } from '@chot-via/ui';
import { Pencil } from 'lucide-react';
import { useRequireMember } from '@/lib/use-member';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Trang chủ theo thiết kế: Phố 3D (nút Xin vía nổi bật nhất) → 4 thẻ hành động → Bảng tin cộng đồng 2 cột.
 * Menu trái và cột phải (Xin vía nhanh · Thử thách tuần · Bảng xếp hạng) do khung trang cung cấp.
 */
export function HomePage() {
  const t = useTranslations('home');
  const { data: home } = useGetHomeQuery();
  const filters = useAppSelector(selectFeedFilters);
  const { isMember } = useRequireMember();
  const dispatch = useAppDispatch();

  useEffect(() => { track('home_view', { member: isMember, device: deviceClass() }); }, [isMember]);

  const feedSection = (
    <section className="flex min-w-0 flex-col gap-3 rounded-sheet border border-border/70 bg-surface-muted/70 p-3 shadow-card sm:p-4 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none" aria-labelledby="feed-title">
      <div className="contents xl:flex xl:flex-col xl:gap-3.5 xl:rounded-3xl xl:bg-surface xl:p-5 xl:shadow-card xl:ring-1 xl:ring-border/40">
        <div className="flex items-center gap-2">
          <img src="/images/logo-than-tai.webp" alt="" aria-hidden className="size-8 shrink-0 object-contain xl:size-11" draggable={false} />
          <h2 id="feed-title" className="min-w-0 truncate font-display text-[1.05rem] font-extrabold leading-none text-primary-strong sm:text-[1.5rem] xl:overflow-visible xl:text-2xl xl:text-ink xl:after:mt-1.5 xl:after:block xl:after:h-[3px] xl:after:w-72 xl:after:rounded-full xl:after:bg-linear-to-r xl:after:from-primary xl:after:to-transparent">{t('feedTitle')}</h2>
          <HomeSortControl variant="icon" />
          <Button type="button" size="sm" className="ml-auto shrink-0 md:hidden" onClick={() => dispatch(composerOpened(undefined))}><Pencil className="size-4" aria-hidden />{t('extras.postNow')}</Button>
        </div>
        <HomeFeedFilters />
        <div className="hidden xl:block"><ComposeBar /></div>
      </div>
      <FeedList variant="compact" query={{ type: filters.type, sort: filters.sort, pinned: 'first', ...(filters.role ? { role: filters.role } : {}) }} infinite={false} />
      <Link href="/bang-tin" className="self-center rounded-full bg-primary-soft px-6 py-2.5 text-sm font-bold text-primary-strong">{t('seeFullFeed')} →</Link>
    </section>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <HomeHero home={home} />
        <ActionCards actions={home?.layout.actions ?? []} />
      </div>
      <ReflectCard />
      {/* Điện thoại (ảnh thiết kế mobile): banner Xin vía Thần Tài ngay dưới hàng nút. */}
      <div className="md:hidden"><DeityBanner /></div>
      {/* iPad dọc: cột phải của desktop/iPad ngang được đưa vào luồng trang để chức năng không bị mất (RESP-01). */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:hidden">
        <QuickWishCard />
        <ChallengeCard />
        <div className="md:col-span-2"><WeeklyBoard variant="rail" /></div>
      </div>
      {/* Máy tính (ảnh thiết kế desktop): 3 cột dưới hero — Xin vía Thần Tài · Thử thách · Tạo cửa hàng | Bảng tin | Xếp hạng · Sự kiện · Cộng đồng. */}
      <div className="xl:grid xl:grid-cols-[16.5rem_minmax(0,1fr)_17rem] xl:items-start xl:gap-5 3xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
        <div className="hidden flex-col gap-4 xl:flex">
          <DeityBanner compact />
          <ChallengeTasks />
          <CreateStoreCard />
        </div>
        {feedSection}
        <div className="hidden flex-col gap-4 xl:flex">
          <WeeklyBoard variant="rail" />
          <FeaturedEventCard />
          <CommunityCard />
        </div>
      </div>
      <MobileShortcutCards />
    </div>
  );
}
