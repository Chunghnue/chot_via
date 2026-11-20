'use client';

import { StoryRailPanels } from '@/components/story/story-rail-panels';
import { WeeklyBoard } from './weekly-board';
import { QuickWishCard } from './quick-wish-card';
import { ActivityCard, ChallengeCard, HotTopicsCard } from './side-cards';

export type RailVariant = 'home' | 'story' | 'ranking' | 'events' | 'default';

/** Cột phải theo từng trang: trang chủ (Xin vía nhanh · Thử thách tuần · Bảng xếp hạng), Kể khổ (Chủ đề hot · Bình chọn vui · Top Kể Khổ tuần), còn lại thêm Hoạt động mới / Chủ đề hot. */
export function RightRail({ variant }: { variant: RailVariant }) {
  if (variant === 'story') return <StoryRailPanels />;
  return (
    <div className="flex flex-col gap-4">
      <QuickWishCard />
      {variant === 'events' ? null : <ChallengeCard />}
      {variant === 'ranking' ? null : <WeeklyBoard variant="rail" />}
      {variant === 'home' ? null : (
        <>
          <ActivityCard />
          <HotTopicsCard />
        </>
      )}
    </div>
  );
}
