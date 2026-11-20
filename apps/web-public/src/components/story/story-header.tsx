'use client';

import { useGetHotHashtagsQuery } from '@chot-via/api-client';
import { Chip, cn } from '@chot-via/ui';
import { ChevronDown, Flame } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { useAppDispatch } from '@/store/hooks';

/** Banner "Kể khổ" (ảnh theo thiết kế); vùng nút "Đăng bài ngay" trong ảnh mở popup soạn bài Kể khổ. */
export function StoryBanner() {
  const t = useTranslations('post.story');
  const dispatch = useAppDispatch();
  return (
    <section aria-label={t('bannerAlt')} className="relative overflow-hidden rounded-sheet shadow-card">
      <img src="/images/kk-banner.webp" alt={t('bannerAlt')} className="block w-full select-none" draggable={false} fetchPriority="high" />
      <button
        type="button" aria-label={t('postNow')} onClick={() => dispatch(composerOpened({ kind: 'story' }))}
        className="absolute rounded-full outline-offset-2 transition hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-primary"
        style={{ left: '9.6%', top: '72%', width: '28%', height: '21%' }}
      />
    </section>
  );
}

export type StorySort = 'hot' | 'new';
export type StoryHas = 'photo' | 'poll' | null;
export interface StoryFilterState { sort: StorySort; has: StoryHas; hashtag: string | null }
export const STORY_FILTER_DEFAULT: StoryFilterState = { sort: 'hot', has: null, hashtag: null };

const pill = 'h-11 px-6 text-[0.95rem]';

/** Thanh lọc của trang Kể khổ: Hot nhất · Mới nhất · Ảnh · Bình chọn · Chủ đề (cùng một bảng tin, chỉ đổi cách lọc). */
export function StoryFilters({ value, onChange }: { value: StoryFilterState; onChange: (next: StoryFilterState) => void }) {
  const t = useTranslations('post.story');
  const { data: tags } = useGetHotHashtagsQuery();
  const isSort = (sort: StorySort) => value.sort === sort && value.has === null && value.hashtag === null;
  const tab = (active: boolean, label: React.ReactNode, onClick: () => void) => (
    <Chip active={active} onClick={onClick} className={cn(pill, active && 'shadow-card')}>{label}</Chip>
  );
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label={t('tabs.hot')}>
      {tab(isSort('hot'), <span className="inline-flex items-center gap-1.5">{t('tabs.hot')}<Flame className="size-4 text-wish" aria-hidden /></span>, () => onChange({ sort: 'hot', has: null, hashtag: null }))}
      {tab(isSort('new'), t('tabs.new'), () => onChange({ sort: 'new', has: null, hashtag: null }))}
      {tab(value.has === 'photo', t('tabs.photo'), () => onChange({ ...value, has: value.has === 'photo' ? null : 'photo' }))}
      {tab(value.has === 'poll', t('tabs.poll'), () => onChange({ ...value, has: value.has === 'poll' ? null : 'poll' }))}
      <label className={cn(pill, 'relative flex items-center gap-2 pr-3', value.hashtag ? 'border-primary text-primary-strong' : 'border-border bg-surface text-ink')}>
        <span className="sr-only">{t('tabs.topic')}</span>
        <span aria-hidden>{value.hashtag ? `#${value.hashtag}` : t('tabs.topic')}</span>
        <ChevronDown className="size-4" aria-hidden />
        <select
          className="absolute inset-0 cursor-pointer opacity-0" value={value.hashtag ?? ''}
          onChange={(e) => onChange({ ...value, hashtag: e.target.value === '' ? null : e.target.value })}
        >
          <option value="">{t('allTopics')}</option>
          {tags?.map((h) => <option key={h.tag} value={h.tag}>#{h.tag}</option>)}
        </select>
      </label>
    </div>
  );
}
