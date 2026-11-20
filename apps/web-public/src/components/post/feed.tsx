'use client';

import { selectIsMember, useGetPostsQuery } from '@chot-via/api-client';
import { FEED_SORTS, FEED_TYPES, MEMBER_ROLES, type MemberRole, type PostListQuery } from '@chot-via/shared';
import { Avatar, Button, Card, Chip, EmptyState, IconButton, Select, Skeleton, cn, useRoleLabel } from '@chot-via/ui';
import { ArrowDownUp, ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { feedRoleChanged, feedSortChanged, feedTypeChanged, selectFeedFilters } from '@/features/feed/feedSlice';
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
        {FEED_TYPES.filter((type) => type !== 'wish').map((type) => <Chip key={type} tone={tone[type]} active={filters.type === type} onClick={() => dispatch(feedTypeChanged(type))}>{t(`filters.${type}`)}</Chip>)}
      </div>
      <div className="flex gap-2">
        <Select aria-label={t('sort.new')} className="h-10 flex-1 text-sm" value={filters.sort} onChange={(e) => {
          const next = FEED_SORTS.find((s) => s === e.target.value);
          if (!next) return;
          if (next === 'following' && !isMember && !require('follow')) return;
          dispatch(feedSortChanged(next));
        }}>
          {FEED_SORTS.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
        </Select>
        {showRole ? (
          <Select aria-label={t('allRoles')} className="h-10 flex-1 text-sm" value={filters.role ?? ''} onChange={(e) => dispatch(feedRoleChanged(MEMBER_ROLES.find((r): r is MemberRole => r === e.target.value) ?? null))}>
            <option value="">{t('allRoles')}</option>
            {MEMBER_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </Select>
        ) : null}
      </div>
    </div>
  );
}

/** Bộ lọc của trang chủ theo thiết kế: Tất cả · Kể khổ · Khoe doanh thu · Khoe deal. Ô sắp xếp ở góc phải (desktop) hoặc nút icon ở hàng tiêu đề (dưới 1280 px). */
const HOME_FILTERS = [['all', ''], ['story', '😂'], ['revenue', '💰'], ['deal', '🧡']] as const;

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
    return <Select aria-label={t('sort.new')} className="ml-auto hidden h-10 w-auto min-w-[8.5rem] rounded-full text-sm font-semibold xl:block" value={filters.sort} onChange={(e) => onChange(e.target.value)}>{options}</Select>;
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
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none min-[420px]:gap-1.5 sm:gap-2" role="group" aria-label={t('feedHeading')}>
      {HOME_FILTERS.map(([type, emoji]) => {
        const active = filters.type === type;
        return (
          <Chip
            key={type} active={active} onClick={() => dispatch(feedTypeChanged(type))}
            className={cn('h-10 min-w-0 flex-auto justify-center px-2 text-[0.74rem] shadow-card min-[420px]:px-3 min-[420px]:text-[0.82rem] sm:h-11 sm:px-4 sm:text-[0.95rem] xl:flex-none', active ? 'border-transparent bg-linear-to-b from-primary-bright to-primary' : 'border-border/60')}
          >{t(`filters.${type}`)}{emoji ? ` ${emoji}` : ''}</Chip>
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
  return (
    <Card className="flex items-center gap-3 p-3">
      <Avatar src={user?.avatarUrl ?? null} name={user?.displayName ?? '?'} size={44} />
      <button type="button" onClick={() => dispatch(composerOpened(undefined))} className="h-11 min-w-0 flex-1 truncate rounded-full bg-surface-muted px-4 text-left text-sm text-ink-muted hover:bg-border">{t('prompt')}</button>
      <IconButton label={t('composer.photos')} onClick={() => dispatch(composerOpened(undefined))} className="hidden text-primary-strong hover:bg-primary-soft sm:flex"><ImagePlus className="size-5" aria-hidden /></IconButton>
      <Button size="sm" onClick={() => dispatch(composerOpened(undefined))}>{t('promptPost')}</Button>
    </Card>
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
    <div className={variant !== 'default' ? 'grid w-full grid-cols-1 items-start gap-3 min-[900px]:grid-cols-2 xl:grid-cols-1 3xl:grid-cols-2' : 'flex w-full flex-col gap-3 3xl:mx-auto 3xl:max-w-3xl'}>
      {data.items.map((post) => <PostCard key={post.id} post={post} variant={variant} />)}
      {infinite ? <div ref={sentinel} aria-hidden /> : null}
      {hasMore && infinite ? <Button variant="outline" loading={isFetching} onClick={loadMore}>{t('loadMore')}</Button> : null}
      {!hasMore && infinite && data.items.length > pageSize ? <p className="py-2 text-center text-xs text-ink-subtle">{t('end')}</p> : null}
    </div>
  );
}
