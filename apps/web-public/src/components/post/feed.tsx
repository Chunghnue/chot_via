'use client';

import { selectIsMember, useGetPostsQuery } from '@chot-via/api-client';
import { FEED_SORTS, FEED_TYPES, MEMBER_ROLES, type MemberRole, type PostListQuery } from '@chot-via/shared';
import { Avatar, Button, Chip, EmptyState, Select, Skeleton, cn, useRoleLabel } from '@chot-via/ui';
import { ArrowDownUp, ChevronDown, ImagePlus, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { feedRoleChanged, feedSortChanged, feedTypeChanged, selectFeedFilters } from '@/features/feed/feedSlice';
import { useHomeConfig } from '@/lib/use-home-config';
import { useRequireMember } from '@/lib/use-member';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PostCard, type PostCardVariant } from './post-card';

/** Lọc/sắp xếp trong CÙNG một bảng tin: Kể khổ và Khoe không bao giờ thành feed riêng. */
export function FeedFilters({ showRole = true }: { showRole?: boolean }) {
  const t = useTranslations('post');
  const roleLabel = useRoleLabel();
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFeedFilters);
  const isMember = useAppSelector(selectIsMember);
  const { require } = useRequireMember();
  const tone = { all: 'primary', story: 'story', brag: 'brag', revenue: 'brag', deal: 'deal', wish: 'wish' } as const;
  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t('feedHeading')}>
        {FEED_TYPES.filter((type) => type !== 'wish').map((type) => (
          <Chip key={type} tone={tone[type]} active={filters.type === type} onClick={() => dispatch(feedTypeChanged(type))}>
            {t(`filters.${type}`)}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <Select
          aria-label={t('sort.new')}
          className="h-10 flex-1 text-sm"
          value={filters.sort}
          onChange={(e) => {
            const next = FEED_SORTS.find((s) => s === e.target.value);
            if (!next) return;
            if (next === 'following' && !isMember && !require('follow')) return;
            dispatch(feedSortChanged(next));
          }}
        >
          {FEED_SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`sort.${s}`)}
            </option>
          ))}
        </Select>
        {showRole ? (
          <Select
            aria-label={t('allRoles')}
            className="h-10 flex-1 text-sm"
            value={filters.role ?? ''}
            onChange={(e) => dispatch(feedRoleChanged(MEMBER_ROLES.find((r): r is MemberRole => r === e.target.value) ?? null))}
          >
            <option value="">{t('allRoles')}</option>
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
    </div>
  );
}

/** Sắp xếp bảng tin: dạng ô chọn (desktop) hoặc nút icon bấm mở danh sách chọn có sẵn của thiết bị (điện thoại, iPad). */
export function HomeSortControl({ variant }: { variant: 'select' | 'icon' }) {
  const t = useTranslations('post');
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFeedFilters);
  const isMember = useAppSelector(selectIsMember);
  const { require } = useRequireMember();
  const options = FEED_SORTS.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>);
  const onChange = (value: string): void => {
    const next = FEED_SORTS.find((s) => s === value);
    if (!next) return;
    if (next === 'following' && !isMember && !require('follow')) return;
    dispatch(feedSortChanged(next));
  };
  if (variant === 'select') {
    // Viên thuốc trắng "Mới nhất ⌄" (ảnh thiết kế): chữ đậm, mũi tên ngay sau chữ; ô chọn thật nằm đè lên, trong suốt.
    return (
      <label className="relative ml-auto hidden h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-surface px-5 text-[0.95rem] font-bold text-ink shadow-card transition hover:shadow-md xl:inline-flex">
        <span>{t(`sort.${filters.sort}`)}</span>
        <ChevronDown className="size-5" strokeWidth={3} aria-hidden />
        <select aria-label={t('sort.new')} value={filters.sort} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0">
          {options}
        </select>
      </label>
    );
  }
  return (
    <label className="relative ml-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary-strong shadow-card xl:hidden">
      <ArrowDownUp className="size-5" aria-hidden />
      <select aria-label={t('sort.new')} value={filters.sort} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0">{options}</select>
    </label>
  );
}

export function HomeFeedFilters() {
  const t = useTranslations('post');
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFeedFilters);
  // Danh sách chip do admin cấu hình (màn "Trang chủ").
  const chips = useHomeConfig().feedFilters;
  return (
    <div className="-mb-2 flex items-center gap-1 overflow-x-auto px-1 pb-3 pt-1 scrollbar-none min-[420px]:gap-1.5 sm:gap-2" role="group" aria-label={t('feedHeading')}>
      {chips.map(({ type, emoji }) => {
        const active = filters.type === type;
        return (
          <Chip
            key={type}
            active={active}
            onClick={() => dispatch(feedTypeChanged(type))}
            className={cn(
              'h-10 min-w-0 flex-auto justify-center px-2 text-[0.74rem] shadow-card min-[420px]:px-3 min-[420px]:text-[0.82rem] sm:h-11 sm:px-4 sm:text-[0.95rem] xl:flex-none',
              active ? 'btn-glossy border-transparent' : 'border-transparent',
            )}
          >
            {t(`filters.${type}`)}
            {emoji ? ` ${emoji}` : ''}
          </Chip>
        );
      })}
      <HomeSortControl variant="select" />
    </div>
  );
}

/** Ô tạo bài nhanh: mở popup soạn bài (không bắt đăng nhập tới khi bấm Đăng). */
export function ComposeBar() {
  const t = useTranslations('post');
  const dispatch = useAppDispatch();
  const { user } = useRequireMember();
  const cfg = useHomeConfig();
  const open = (): void => { dispatch(composerOpened(undefined)); };
  const tool = 'grid size-9 place-items-center text-ink transition hover:text-primary-strong active:scale-90';
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-surface p-3 shadow-card ring-1 ring-border/40">
      <div className="flex items-center gap-3">
        <Avatar src={user?.avatarUrl ?? (cfg.composeAvatarUrl || null)} name={user?.displayName ?? '?'} size={56} />
        <button
          type="button"
          onClick={open}
          className="h-12 min-w-0 flex-1 truncate rounded-2xl border-2 border-info/20 bg-info-soft/60 px-4 text-left text-[0.95rem] text-ink-muted shadow-[inset_0_1px_3px_rgb(35_83_164/0.08)] transition hover:border-info/40"
        >
          {cfg.composePlaceholder || t('prompt')}
        </button>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" aria-label={t('composer.photos')} onClick={open} className={cn(tool, 'border-r border-border/70 pr-3')}>
          <ImagePlus className="size-6" strokeWidth={2.2} aria-hidden />
        </button>
        <button type="button" aria-label={t('composer.emoji')} onClick={open} className={cn(tool, 'border-r border-border/70 pr-3')}>
          <Smile className="size-6" strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={open}
          className="btn-glossy inline-flex h-11 min-w-32 items-center justify-center rounded-full px-6 text-[0.95rem] font-bold text-on-primary transition active:scale-95"
        >
          {t('promptPost')}
        </button>
      </div>
    </div>
  );
}

type FeedQuery = Omit<PostListQuery, 'page' | 'pageSize'>;

export function FeedList({ query, infinite = true, pageSize = 10, variant = 'default' }: { query: Partial<FeedQuery>; infinite?: boolean; pageSize?: number; variant?: PostCardVariant }) {
  const t = useTranslations('post');
  const key = JSON.stringify(query);
  const [state, setState] = useState({ key, page: 1 });
  const page = state.key === key ? state.page : 1;
  const { data, isFetching, isError, refetch } = useGetPostsQuery({ ...query, page, pageSize });
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = data?.meta.hasMore ?? false;
  const loadMore = (): void => setState({ key, page: page + 1 });

  useEffect(() => {
    const el = sentinel.current;
    if (!infinite || !el || !hasMore || isFetching) return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) loadMore(); }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite, hasMore, isFetching, page, key]);

  if (!data && isFetching) return <div className="flex flex-col gap-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44" />)}</div>;
  if (isError && !data) return <EmptyState icon="⚠️" title={t('notFound')} action={<Button variant="outline" onClick={() => void refetch()}>{t('loadMore')}</Button>} />;
  if (!data || data.items.length === 0) return <EmptyState icon="📝" title={query.sort === 'following' ? t('emptyFollowing') : t('empty')} />;

  return (
    <div
      className={
        variant !== 'default'
          ? 'grid w-full grid-cols-1 items-start gap-3 min-[900px]:grid-cols-2 xl:grid-cols-1 3xl:grid-cols-2'
          : 'flex w-full flex-col gap-3 3xl:mx-auto 3xl:max-w-3xl'
      }
    >
      {data.items.map((post) => (
        <PostCard key={post.id} post={post} variant={variant} />
      ))}
      {infinite ? <div ref={sentinel} aria-hidden /> : null}
      {hasMore && infinite ? (
        <Button variant="outline" loading={isFetching} onClick={loadMore}>
          {t('loadMore')}
        </Button>
      ) : null}
      {!hasMore && infinite && data.items.length > pageSize ? <p className="py-2 text-center text-xs text-ink-subtle">{t('end')}</p> : null}
    </div>
  );
}
