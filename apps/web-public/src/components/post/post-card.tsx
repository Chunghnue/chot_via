'use client';

import {
  useBlockUserMutation, useDeletePostMutation, usePostWishMutation, useSetReactionMutation, useSetSavedMutation,
  useSharePostMutation, useVotePollMutation,
} from '@chot-via/api-client';
import { REACTION_TYPES, type PollDto, type PostDto, type ReactionType, type WishCountDto } from '@chot-via/shared';
import { AppIcon, Avatar, Badge, Card, Menu, Popover, PopoverClose, cn, toast, useConfirm, useFormatters, useRoleLabel, type MenuItem } from '@chot-via/ui';
import { CornerUpRight, Crown, Flag, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'use-intl';
import { track } from '@/lib/analytics';
import { useApiToast } from '@/lib/use-api-toast';
import { useRequireMember } from '@/lib/use-member';
import { Burst } from '@/components/dialogs/wish-burst';
import { reportRequested } from '@/features/ui/uiSlice';
import { useAppDispatch } from '@/store/hooks';
import { PostContent, kindTone, useKindLabel } from './post-content';
import { ShareButtons } from '@/components/common/share-buttons';
import { postSnippet } from '@/lib/post-share';

/** Khối bên trái nút Chia sẻ: các biểu tượng vía đã có lượt (tối đa 6, nhiều lượt nhất trước) chồng nhau kèm tổng lượt gửi vía của bài. */
function WishSummary({ breakdown, total, label }: { breakdown: readonly WishCountDto[]; total: number; label: string }) {
  const shown = breakdown.filter((w) => w.count > 0).sort((x, y) => y.count - x.count || x.sortOrder - y.sortOrder).slice(0, 6);
  return (
    <span className="flex h-10 items-center gap-1.5 px-3 font-bold text-ink" aria-label={label} data-testid="wish-summary">
      {shown.length > 0 ? (
        <span className="flex -space-x-1.5" aria-hidden>
          {shown.map((w) => <span key={w.wishTypeId} title={`${w.name}: ${w.count}`} className="flex size-7 items-center justify-center rounded-full bg-surface text-base shadow-card ring-2 ring-surface"><AppIcon iconKey={w.iconKey} /></span>)}
        </span>
      ) : <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-surface-muted text-base opacity-60"><AppIcon iconKey="clover" /></span>}
      {total}
    </span>
  );
}

const REACTION_EMOJI: Record<ReactionType, string> = { like: '👍', love: '❤️', haha: '😆' };

export type PostCardVariant = 'default' | 'compact' | 'wide';

export function PostCard({ post, variant = 'default' }: { post: PostDto; variant?: PostCardVariant }) {
  const compact = variant === 'compact';
  const wide = variant === 'wide';
  const t = useTranslations('post');
  const roleName = useRoleLabel();
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const f = useFormatters();
  const kindLabel = useKindLabel();
  const toastApi = useApiToast();
  const { require } = useRequireMember();
  const [save] = useSetSavedMutation();
  const [share] = useSharePostMutation();
  const [wish] = usePostWishMutation();
  const [react] = useSetReactionMutation();
  const [vote] = useVotePollMutation();
  const [block] = useBlockUserMutation();
  const [remove] = useDeletePostMutation();
  const confirm = useConfirm();

  const [saved, setSaved] = useState(post.viewer?.saved ?? false);
  /** Tiền vàng tung toé từ chỗ vừa bấm khi gửi vía (lớp phủ toàn màn hình, vẽ ngoài thẻ bài bằng portal). */
  const [coins, setCoins] = useState({ id: 0, x: 0, y: 0, on: false });
  /** Cảm xúc của người xem (chọn một loại tại một thời điểm; bấm lại loại đang chọn thì bỏ) và số lượt từng loại. */
  const [mineReaction, setMineReaction] = useState<ReactionType | null>(post.viewer?.reaction ?? null);
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts);
  const [breakdown, setBreakdown] = useState<WishCountDto[]>(post.wishBreakdown ?? []);
  const wishTotal = breakdown.reduce((sum, w) => sum + w.count, 0);
  const wishedAny = breakdown.some((w) => w.mine);
  const [shares, setShares] = useState(post.counts.shares);
  const [poll, setPoll] = useState<PollDto | null>(post.poll);
  const [hidden, setHidden] = useState(false);
  const tcard = useTranslations('wish.card');
  const tpost = useTranslations('wish.postShare');

  if (hidden) return null;
  const isOwn = post.viewer?.isOwn ?? false;
  const roleLabel = post.author.memberRole ? roleName(post.author.memberRole) : null;
  const heading = post.author.jobTitle ?? roleLabel;

  const postUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/bai/${post.id}`;
  // Câu chia sẻ mẫu theo loại bài (kể khổ / khoe / xin vía) kèm trích ngắn nội dung; link là link riêng của bài.
  const shareText = tpost(post.type, { name: post.author.displayName, snippet: postSnippet(post.body), brand: tcard('brand') });
  const shareKind = post.type === 'story' ? 'story' : post.type === 'achievement' ? 'brag' : 'receive';
  const countShare = (): void => {
    void share(post.id).unwrap().then((r) => { setShares(r.shares); track('feed_engagement', { post_type: post.type, action: 'share' }); }).catch(() => undefined);
  };

  const pickReaction = (type: ReactionType): void => {
    if (!require('react')) return;
    const next = mineReaction === type ? null : type;
    void react({ postId: post.id, type: next }).unwrap().then((r) => {
      setMineReaction(r.mine); setReactionCounts(r.reactionCounts);
      track('feed_engagement', { post_type: post.type, action: 'reaction' });
    }).catch(toastApi.error);
  };

  const sendWish = async (wishTypeId: string, at?: { x: number; y: number }): Promise<void> => {
    if (at) {
      const id = coins.id + 1;
      setCoins({ id, ...at, on: true });
      window.setTimeout(() => setCoins((c) => (c.id === id ? { ...c, on: false } : c)), 3400);
    }
    try {
      const r = await wish({ postId: post.id, wishTypeId }).unwrap();
      setBreakdown(r.wishBreakdown);
      toast.success(t('actions.wishSent'));
      track('feed_engagement', { post_type: post.type, action: 'wish' });
    } catch (e) { toastApi.error(e); }
  };

  const items: MenuItem[] = [
    { key: 'save', label: saved ? t('actions.unsave') : t('actions.save'), onSelect: () => {
      if (!require('save')) return;
      void save({ postId: post.id, on: !saved }).unwrap().then((r) => { setSaved(r.saved); toast.success(r.saved ? t('actions.saved') : t('actions.unsaved')); }).catch(toastApi.error);
    } },
    { key: 'report', label: t('actions.report'), icon: <Flag className="size-4" aria-hidden />, onSelect: () => dispatch(reportRequested({ targetType: 'post', targetId: post.id })) },
    ...(isOwn ? [{ key: 'delete', label: t('actions.delete'), danger: true, onSelect: () => { void (async () => {
      if (!(await confirm({ title: t('actions.deleteConfirm'), confirmLabel: t('actions.delete') }))) return;
      void remove(post.id).unwrap().then(() => { setHidden(true); toast.success(t('actions.deleted')); }).catch(toastApi.error);
    })(); } }] : [{ key: 'block', label: t('actions.blockAuthor'), danger: true, onSelect: () => {
      if (!require('block')) return;
      void block({ id: post.author.id, on: true }).unwrap().then(() => { setHidden(true); toast.success(t('actions.blocked')); }).catch(toastApi.error);
    } }]),
  ];

  return (
    <Card className={wide ? 'flex flex-col gap-2.5 p-4' : compact ? 'flex flex-col gap-2 p-3.5' : 'p-4 sm:p-5'}>
      {wide ? (
        <>
          <header className="flex items-center gap-3">
            <Link href={`/u/${post.author.id}`} aria-label={post.author.displayName}><Avatar src={post.author.avatarUrl} name={post.author.displayName} size={46} /></Link>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link href={`/u/${post.author.id}`} className="truncate text-base font-bold text-ink hover:underline">{post.author.displayName}</Link>
              {roleLabel ? <Badge tone={post.author.memberRole === 'sale' ? 'sale' : 'owner'}>{post.author.memberRole === 'owner' ? <Crown className="size-3" aria-hidden /> : null}{roleLabel}</Badge> : null}
              <span className="text-xs text-ink-subtle">· {f.relative(post.createdAt)}</span>
            </div>
            <Menu label={t('actions.more')} items={items} trigger={<button type="button" className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"><MoreHorizontal className="size-5" aria-hidden /></button>} />
          </header>
          <Link href={`/bai/${post.id}`} className="whitespace-pre-wrap break-words text-[0.95rem] leading-snug text-ink">{post.sticker ? <span className="mr-1">{post.sticker}</span> : null}{post.body}</Link>
          {post.media[0] ? (
            <Link href={`/bai/${post.id}`} className="block overflow-hidden rounded-xl bg-surface-muted">
              <img src={post.media[0].url} alt="" loading="lazy" decoding="async" className="aspect-[2/1] w-full object-cover" />
            </Link>
          ) : null}
        </>
      ) : compact ? (
        <>
          <header className="flex items-start gap-3">
            <Link href={`/u/${post.author.id}`} aria-label={post.author.displayName}><Avatar src={post.author.avatarUrl} name={post.author.displayName} size={48} className="ring-2 ring-surface shadow-card" /></Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.02rem] font-bold text-ink"><Link href={`/u/${post.author.id}`} className="hover:underline">{post.author.displayName}</Link>{heading ? <span className="font-semibold text-ink-muted"> - {heading}</span> : null}</p>
              <p className="text-[0.8rem] text-ink-subtle">• {f.relative(post.createdAt)}{post.location ? ` • ${post.location}` : ''}</p>
            </div>
            <Badge tone={kindTone(post.type, post.role)} className="hidden sm:inline-flex">{kindLabel(post.type, post.role)}</Badge>
            <Menu label={t('actions.more')} items={items} trigger={<button type="button" className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"><MoreHorizontal className="size-5" aria-hidden /></button>} />
          </header>
          <Badge tone={kindTone(post.type, post.role)} className="-mt-1 w-fit sm:hidden">{kindLabel(post.type, post.role)}</Badge>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Link href={`/bai/${post.id}`} className="line-clamp-5 whitespace-pre-wrap break-words text-[0.98rem] leading-snug text-ink">{post.sticker ? <span className="mr-1">{post.sticker}</span> : null}{post.body}</Link>
              {post.hashtags.length > 0 ? <p className="mt-1 line-clamp-1 text-xs text-info">{post.hashtags.map((h) => `#${h}`).join(' ')}</p> : null}
            </div>
            {post.media[0] ? <img src={post.media[0].url} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-[36%] max-w-44 shrink-0 rounded-2xl bg-surface-muted object-cover" /> : null}
          </div>
        </>
      ) : (
        <>
      <header className="mb-3 flex items-start gap-3">
        <Link href={`/u/${post.author.id}`} aria-label={post.author.displayName}><Avatar src={post.author.avatarUrl} name={post.author.displayName} size={44} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link href={`/u/${post.author.id}`} className="truncate font-bold text-ink hover:underline">{post.author.displayName}</Link>
            {roleLabel ? <Badge tone={post.author.memberRole === 'sale' ? 'sale' : 'owner'}>{roleLabel}</Badge> : null}
            {post.author.level ? <Badge tone="gold">{tc('level', { name: post.author.level.name })}</Badge> : null}
          </div>
          <p className="text-xs text-ink-subtle">{f.relative(post.createdAt)}</p>
        </div>
        <Badge tone={kindTone(post.type, post.role)}>{kindLabel(post.type, post.role)}</Badge>
        <Menu label={t('actions.more')} items={items} trigger={<button type="button" className="flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"><MoreHorizontal className="size-5" aria-hidden /></button>} />
      </header>

      <PostContent post={{ ...post, poll }} onVote={(optionId) => {
        if (!require('poll')) return;
        void vote({ postId: post.id, optionId }).unwrap().then(setPoll).catch(toastApi.error);
      }} />
        </>
      )}

      <footer className={cn('flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-muted', compact || wide ? 'mt-1' : 'mt-4 border-t border-border pt-3')}>
        <div className="flex items-center" role="group" aria-label={t('actions.react')}>
          {REACTION_TYPES.map((r) => (
            <button key={r} type="button" aria-pressed={mineReaction === r} aria-label={t(`actions.${r}`)} title={t(`actions.${r}`)} data-testid={`react-${r}`} onClick={() => pickReaction(r)}
              className={cn('flex h-10 items-center gap-1 rounded-full px-2.5 transition hover:bg-surface-muted active:scale-95', mineReaction === r && 'bg-primary-soft text-primary-strong')}>
              <span aria-hidden className="text-xl leading-none">{REACTION_EMOJI[r]}</span>{reactionCounts[r]}
            </button>
          ))}
        </div>
        <WishSummary breakdown={breakdown} total={wishTotal} label={t('actions.wishTotal', { count: wishTotal })} />
        <Link href={`/bai/${post.id}`} className={cn('flex h-10 items-center gap-1.5 rounded-full px-3 hover:bg-surface-muted', (compact || wide) && 'font-bold text-ink')}><MessageCircle className="size-5" aria-hidden />{post.counts.comments}<span className="sr-only">{t('actions.commentShort')}</span></Link>
        <Popover trigger={<button type="button" className={cn('flex h-10 items-center gap-1.5 rounded-full px-3 hover:bg-surface-muted', (compact || wide) && 'font-bold text-ink')}>{compact || wide ? <CornerUpRight className="size-5" aria-hidden /> : <Share2 className="size-5" aria-hidden />}{compact || wide ? null : shares}<span className={compact || wide ? '' : 'sr-only'}>{t('actions.share')}</span></button>}>
          <ShareButtons text={shareText} link={postUrl} card={{ kind: shareKind, link: postUrl, body: post.body }} onShared={countShare} className="w-64" />
        </Popover>
        <div className="ml-auto">
          <Popover align="end" trigger={
            <button type="button" className={cn('flex h-10 items-center gap-1.5 rounded-full border border-primary px-4 text-primary-strong hover:bg-primary-soft', wishedAny && 'bg-primary-soft')}>
              <img src="/images/logo-co.webp" alt="" aria-hidden className="size-5 object-contain" draggable={false} />{wishedAny ? t('actions.wished') : t('actions.wish')}
            </button>
          }>
            <div className="grid grid-cols-3 gap-1.5">
              {breakdown.map((w) => (
                <PopoverClose key={w.wishTypeId} asChild>
                  <button type="button" onClick={(e) => void sendWish(w.wishTypeId, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })} className={cn('relative flex w-20 flex-col items-center gap-1 rounded-xl p-2 text-center text-[0.7rem] font-bold hover:bg-surface-muted', w.mine && 'bg-primary-soft ring-1 ring-primary')}><AppIcon iconKey={w.iconKey} className="text-2xl" />{w.name}{w.count > 0 ? <span className="absolute right-1 top-1 min-w-5 rounded-full bg-wish px-1 text-[0.65rem] leading-5 text-on-wish">{w.count}</span> : null}</button>
                </PopoverClose>
              ))}
            </div>
          </Popover>
        </div>
      </footer>
      {coins.on ? createPortal(<Burst key={coins.id} origin={{ x: coins.x, y: coins.y }} />, document.body) : null}
    </Card>
  );
}
