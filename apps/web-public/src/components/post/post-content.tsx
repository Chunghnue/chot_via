'use client';

import { useGetCatalogQuery } from '@xin-via/api-client';
import { MONEY_METRICS, type AchievementDto, type MemberRole, type PollDto, type PostType, type WishTypeDto } from '@xin-via/shared';
import { AppIcon, Badge, cn, useFormatters } from '@xin-via/ui';
import Link from 'next/link';
import { useTranslations } from 'use-intl';

export interface PostContentData {
  type: PostType;
  role: MemberRole | null;
  body: string;
  sticker: string | null;
  location: string | null;
  hashtags: string[];
  media: { id: string; url: string }[];
  achievement: AchievementDto | null;
  wishType: WishTypeDto | null;
  poll: PollDto | null;
}

export function kindTone(type: PostType, role: MemberRole | null): 'story' | 'brag' | 'deal' | 'gold' {
  if (type === 'story') return 'story';
  if (type === 'wish_share') return 'gold';
  return role === 'sale' ? 'deal' : 'brag';
}

export function useKindLabel() {
  const t = useTranslations('post');
  return (type: PostType, role: MemberRole | null): string => {
    if (type === 'story') return t('filters.story');
    if (type === 'wish_share') return t('filters.wish');
    return role === 'sale' ? t('filters.deal') : t('filters.revenue');
  };
}

export function useRangeLabel() {
  const { data } = useGetCatalogQuery();
  const f = useFormatters();
  return (role: MemberRole | null, code: string | null): string | null => {
    if (!data || !code || !role) return null;
    const list = role === 'owner' ? data.settings.achievementRanges.ownerRevenue : data.settings.achievementRanges.saleDeal;
    const found = list.find((r) => r.code === code);
    return found ? f.range(found) : null;
  };
}

/** Khối thành tích: số liệu tự khai, mặc định ẩn số tiền; không bao giờ gắn dấu "đã xác minh". */
export function AchievementBlock({ achievement, role }: { achievement: AchievementDto; role: MemberRole | null }) {
  const t = useTranslations('post');
  const f = useFormatters();
  const rangeLabel = useRangeLabel();
  const isMoney = MONEY_METRICS.includes(achievement.metricType);
  let value = t('achievement.hiddenTitle');
  if (achievement.displayMode === 'range') {
    const label = rangeLabel(role, achievement.rangeCode);
    if (label) value = t('achievement.rangeTitle', { range: label });
  }
  if (achievement.displayMode === 'exact' && achievement.amount !== null) value = isMoney ? f.money(achievement.amount) : f.number(achievement.amount);
  return (
    <div className={cn('rounded-2xl px-4 py-3 text-on-primary shadow-card', role === 'sale' ? 'bg-linear-to-r from-deal to-brag' : 'bg-linear-to-r from-brag to-gold-strong')}>
      <p className="text-xs font-semibold opacity-90">{t(`metrics.${achievement.metricType}`)}</p>
      <p className="font-display text-2xl font-extrabold leading-tight">{value}</p>
      <p className="mt-0.5 text-[0.65rem] font-medium opacity-80">{t('achievement.selfDeclared')}</p>
    </div>
  );
}

export function MediaGrid({ media }: { media: { id: string; url: string }[] }) {
  if (media.length === 0) return null;
  return (
    <div className={cn('grid gap-1.5 overflow-hidden rounded-2xl', media.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {media.map((m) => (
        <img key={m.id} src={m.url} alt="" loading="lazy" decoding="async" className={cn('w-full bg-surface-muted object-cover', media.length === 1 ? 'max-h-[28rem]' : 'aspect-square')} />
      ))}
    </div>
  );
}

export function PollView({ poll, onVote }: { poll: PollDto; onVote?: (optionId: string) => void }) {
  const t = useTranslations('post.poll');
  return (
    <ul className="flex flex-col gap-1.5" aria-label="poll">
      {poll.options.map((o) => {
        const percent = poll.totalVotes ? Math.round((o.votes / poll.totalVotes) * 100) : 0;
        const mine = poll.myVoteId === o.id;
        return (
          <li key={o.id}>
            <button type="button" disabled={!onVote} onClick={() => onVote?.(o.id)}
              className={cn('relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-sm font-medium', mine ? 'border-primary' : 'border-border')}>
              <span className="absolute inset-y-0 left-0 bg-primary-soft" style={{ width: `${percent}%` }} aria-hidden />
              <span className="relative flex items-center justify-between gap-2"><span>{o.text}</span><span className="text-xs text-ink-muted">{percent}%{mine ? ` · ${t('voted')}` : ''}</span></span>
            </button>
          </li>
        );
      })}
      <li className="text-xs text-ink-subtle">{t('votes', { count: poll.totalVotes })}</li>
    </ul>
  );
}

export function PostContent({ post, onVote }: { post: PostContentData; onVote?: (optionId: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {post.achievement ? <AchievementBlock achievement={post.achievement} role={post.role} /> : null}
      {post.wishType ? <Badge tone="gold" className="w-fit"><AppIcon iconKey={post.wishType.iconKey} />{post.wishType.name}</Badge> : null}
      <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-ink">{post.sticker ? <span className="mr-1.5 text-xl">{post.sticker}</span> : null}{post.body}</p>
      <MediaGrid media={post.media} />
      {post.poll ? <PollView poll={post.poll} {...(onVote ? { onVote } : {})} /> : null}
      {post.hashtags.length > 0 || post.location ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {post.hashtags.map((tag) => <Link key={tag} href={`/bang-tin?hashtag=${encodeURIComponent(tag)}`} className="font-medium text-primary-strong hover:underline">#{tag}</Link>)}
          {post.location ? <span className="text-ink-subtle">📍 {post.location}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
