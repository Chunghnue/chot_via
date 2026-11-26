'use client';

import {
  useBlockUserMutation, useDeletePostMutation, useGetCatalogQuery, usePostWishMutation, useSetReactionMutation, useSetSavedMutation,
  useSharePostMutation, useVotePollMutation,
} from '@chot-via/api-client';
import { REACTION_TYPES, type PollDto, type PostDto, type ReactionType } from '@chot-via/shared';
import { AppIcon, Avatar, Badge, Card, Menu, Popover, PopoverClose, cn, toast, useConfirm, useFormatters, useRoleLabel, type MenuItem } from '@chot-via/ui';
import { CornerUpRight, Crown, Flag, Heart, MessageCircle, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react';
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
import { shareCardImage, wrapLines } from '@/lib/share-card';

const REACTION_EMOJI: Record<ReactionType, string> = { like: '👍', love: '❤️', haha: '😆' };

/** Hai biểu tượng cảm xúc chồng nhau (thích + yêu thích) ở hàng thao tác của thẻ gọn/rộng, theo thiết kế. */
function ReactionStack() {
  return (
    <span className="flex -space-x-1.5" aria-hidden>
      <span className="flex size-7 items-center justify-center rounded-full bg-info text-on-primary ring-2 ring-surface"><ThumbsUp className="size-4 fill-current" /></span>
      <span className="flex size-7 items-center justify-center rounded-full bg-danger text-on-primary ring-2 ring-surface"><Heart className="size-4 fill-current" /></span>
    </span>
  );
}

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
  const { data: catalog } = useGetCatalogQuery();
  const [react] = useSetReactionMutation();
  const [save] = useSetSavedMutation();
  const [share] = useSharePostMutation();
  const [wish] = usePostWishMutation();
  const [vote] = useVotePollMutation();
  const [block] = useBlockUserMutation();
  const [remove] = useDeletePostMutation();
  const confirm = useConfirm();

  const [reaction, setReaction] = useState<{ mine: ReactionType | null; count: number }>({ mine: post.viewer?.reaction ?? null, count: post.counts.reactions });
  const [saved, setSaved] = useState(post.viewer?.saved ?? false);
  /** Tiền vàng tung toé từ chỗ vừa bấm khi gửi vía (lớp phủ toàn màn hình, vẽ ngoài thẻ bài bằng portal). */
  const [coins, setCoins] = useState({ id: 0, x: 0, y: 0, on: false });
  const [wishes, setWishes] = useState({ count: post.counts.wishes, done: post.viewer?.wished ?? false });
  const [shares, setShares] = useState(post.counts.shares);
  const [poll, setPoll] = useState<PollDto | null>(post.poll);
  const [hidden, setHidden] = useState(false);
  const tcard = useTranslations('wish.card');

  if (hidden) return null;
  const isOwn = post.viewer?.isOwn ?? false;
  const roleLabel = post.author.memberRole ? roleName(post.author.memberRole) : null;
  const heading = post.author.jobTitle ?? roleLabel;

  const pickReaction = async (type: ReactionType): Promise<void> => {
    if (!require('react')) return;
    const next = reaction.mine === type ? null : type;
    try {
      const result = await react({ postId: post.id, type: next }).unwrap();
      setReaction({ mine: result.mine, count: result.reactions });
      track('feed_engagement', { post_type: post.type, action: 'reaction' });
    } catch (e) { toastApi.error(e); }
  };

  const doShare = async (): Promise<void> => {
    const url = `${window.location.origin}/bai/${post.id}`;
    try {
      // Bài Kể khổ / Khoe: chia sẻ thẻ ảnh theo mẫu (kèm QR về đúng bài) nếu thiết bị chia sẻ được ảnh; không thì chia sẻ link như cũ.
      const kind = post.type === 'story' ? 'story' : post.type === 'achievement' ? 'brag' : null;
      const probe = new File([''], 'x.png', { type: 'image/png' });
      if (kind && typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })) {
        await shareCardImage({ brand: tcard('brand'), tagline: tcard('tagline'), scan: tcard('scan'), title: tcard(`${kind}.title`), lines: wrapLines(post.body || tcard(`${kind}.l1`)) }, url, post.body.slice(0, 120));
      } else if (typeof navigator.share === 'function') await navigator.share({ url });
      else { await navigator.clipboard.writeText(url); toast.success(t('actions.linkCopied')); }
      const r = await share(post.id).unwrap();
      setShares(r.shares);
      track('feed_engagement', { post_type: post.type, action: 'share' });
    } catch { /* người dùng hủy chia sẻ */ }
  };

  const sendWish = async (wishTypeId: string, at?: { x: number; y: number }): Promise<void> => {
    if (at) {
      const id = coins.id + 1;
      setCoins({ id, ...at, on: true });
      window.setTimeout(() => setCoins((c) => (c.id === id ? { ...c, on: false } : c)), 3400);
    }
    try {
      const r = await wish({ postId: post.id, wishTypeId }).unwrap();
      setWishes({ count: r.wishes, done: true });
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
        <Popover trigger={
          <button type="button" aria-label={t('actions.react')} className={cn('flex h-10 items-center gap-1.5 rounded-full px-3 hover:bg-surface-muted', (compact || wide) && 'font-bold text-ink', reaction.mine && 'text-primary-strong')}>
            {wide || compact ? (
              <ReactionStack />
            ) : <span className="text-lg leading-none">{reaction.mine ? REACTION_EMOJI[reaction.mine] : '👍'}</span>}{reaction.count}
          </button>
        }>
          <div className="flex gap-1">
            {REACTION_TYPES.map((r) => (
              <PopoverClose key={r} asChild>
                <button type="button" aria-label={t(`actions.${r}`)} onClick={() => void pickReaction(r)} className={cn('flex size-11 items-center justify-center rounded-full text-2xl transition hover:scale-125', reaction.mine === r && 'bg-primary-soft')}>{REACTION_EMOJI[r]}</button>
              </PopoverClose>
            ))}
          </div>
        </Popover>
        <Link href={`/bai/${post.id}`} className={cn('flex h-10 items-center gap-1.5 rounded-full px-3 hover:bg-surface-muted', (compact || wide) && 'font-bold text-ink')}><MessageCircle className="size-5" aria-hidden />{post.counts.comments}<span className="sr-only">{t('actions.commentShort')}</span></Link>
        <button type="button" onClick={() => void doShare()} className={cn('flex h-10 items-center gap-1.5 rounded-full px-3 hover:bg-surface-muted', (compact || wide) && 'font-bold text-ink')}>{compact || wide ? <CornerUpRight className="size-5" aria-hidden /> : <Share2 className="size-5" aria-hidden />}{compact || wide ? null : shares}<span className={compact || wide ? '' : 'sr-only'}>{t('actions.share')}</span></button>
        <div className="ml-auto">
          <Popover align="end" trigger={
            <button type="button" className={cn('flex h-10 items-center gap-1.5 rounded-full border border-primary px-4 text-primary-strong hover:bg-primary-soft', wishes.done && 'bg-primary-soft')}>
              <img src="/images/logo-co.webp" alt="" aria-hidden className="size-5 object-contain" draggable={false} />{wishes.done ? t('actions.wished') : t('actions.wish')}{wishes.count > 0 && !wide ? ` (${wishes.count})` : ''}
            </button>
          }>
            <div className="grid grid-cols-3 gap-1.5">
              {catalog?.wishTypes.map((w) => (
                <PopoverClose key={w.id} asChild>
                  <button type="button" onClick={(e) => void sendWish(w.id, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })} className="flex w-20 flex-col items-center gap-1 rounded-xl p-2 text-center text-[0.7rem] font-bold hover:bg-surface-muted"><AppIcon iconKey={w.iconKey} className="text-2xl" />{w.name}</button>
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
