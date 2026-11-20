'use client';

import { useGetFeaturedPollQuery, useGetHotTopicsQuery, useGetTopStoryAuthorsQuery, useVotePollMutation } from '@chot-via/api-client';
import type { PollDto } from '@chot-via/shared';
import { Card, RankRow, SectionTitle, Skeleton, cn, compactCount } from '@chot-via/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { useApiToast } from '@/lib/use-api-toast';
import { useRequireMember } from '@/lib/use-member';
import { useMounted } from '@/lib/use-mounted';

const TOPIC_TONES = ['bg-gold text-on-gold', 'bg-info text-on-primary', 'bg-primary text-on-primary', 'bg-info-soft text-info', 'bg-story-soft text-story'] as const;

function PanelHeader({ icon, title, link }: { icon: string; title: string; link: { href: string; label: string } }) {
  return (
    <SectionTitle
      icon={icon} title={title}
      action={<Link href={link.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink hover:text-primary-strong">{link.label}<ArrowRight className="size-3.5" aria-hidden /></Link>}
    />
  );
}

/** "Chủ đề hot": danh sách do quản trị viên cấu hình (web admin → Chủ đề hot). */
export function HotTopicsPanel() {
  const t = useTranslations('post.story');
  const { data, isLoading } = useGetHotTopicsQuery();
  const mounted = useMounted();
  if (isLoading || !mounted) return <Skeleton className="h-64" />;
  if (!data || data.length === 0) return null;
  return (
    <Card className="p-4">
      <PanelHeader icon="/images/ic-fire.webp" title={t('hotTopics')} link={{ href: '/tim-kiem', label: t('seeMore') }} />
      <ol className="flex flex-col gap-2.5">
        {data.map((topic, i) => (
          <li key={topic.id}>
            <Link href={topic.hashtag ? `/bang-tin?hashtag=${encodeURIComponent(topic.hashtag)}` : `/tim-kiem?q=${encodeURIComponent(topic.title)}`} className="flex items-center gap-3 text-[0.92rem] text-ink hover:text-primary-strong">
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', TOPIC_TONES[i % TOPIC_TONES.length])}>{i + 1}</span>
              <span className="min-w-0 flex-1">{topic.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** "Bình chọn vui": bình chọn Kể khổ mới nhất; thanh phần trăm theo lượt chọn thật. */
export function FunPollPanel() {
  const t = useTranslations('post.story');
  const { data, isLoading } = useGetFeaturedPollQuery();
  const mounted = useMounted();
  const [vote] = useVotePollMutation();
  const toast = useApiToast();
  const { require } = useRequireMember();
  const [poll, setPoll] = useState<PollDto | null>(null);
  useEffect(() => { setPoll(data?.poll ?? null); }, [data]);
  if (isLoading || !mounted) return <Skeleton className="h-64" />;
  if (!data || !poll) return null;
  return (
    <Card className="p-4">
      <PanelHeader icon="/images/ic-chart.webp" title={t('poll')} link={{ href: `/bai/${data.id}`, label: t('seeResults') }} />
      <div className="mb-3 flex items-start gap-2">
        <p className="min-w-0 flex-1 font-display text-lg font-extrabold leading-snug text-ink">{data.body}</p>
        <img src="/images/ic-gift.webp" alt="" aria-hidden className="size-14 shrink-0 object-contain" draggable={false} />
      </div>
      <ul className="flex flex-col gap-3">
        {poll.options.map((o) => {
          const percent = poll.totalVotes ? Math.round((o.votes / poll.totalVotes) * 100) : 0;
          return (
            <li key={o.id}>
              <button
                type="button" className="block w-full text-left"
                onClick={() => {
                  if (!require('poll')) return;
                  void vote({ postId: data.id, optionId: o.id }).unwrap().then(setPoll).catch(toast.error);
                }}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink"><span>{o.text}</span><span className={cn('text-xs font-bold', poll.myVoteId === o.id ? 'text-primary-strong' : 'text-ink-muted')}>{percent}%</span></span>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-surface-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** "Top Kể Khổ tuần": tác giả Kể khổ nhận nhiều cảm xúc nhất trong 7 ngày. */
export function TopStoryAuthorsPanel() {
  const t = useTranslations('post.story');
  const { data, isLoading } = useGetTopStoryAuthorsQuery();
  const mounted = useMounted();
  if (isLoading || !mounted) return <Skeleton className="h-52" />;
  if (!data || data.length === 0) return null;
  return (
    <Card className="relative overflow-hidden bg-linear-to-b from-story-soft to-surface p-4">
      <img src="/images/ic-laugh.webp" alt="" aria-hidden className="absolute -right-1 -top-2 size-16 object-contain" draggable={false} />
      <SectionTitle icon="/images/ic-crown.webp" title={t('topAuthors')} className="mb-1" />
      <Link href="/bang-xep-hang" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-story hover:underline">{t('seeLeaderboard')}<ArrowRight className="size-3.5" aria-hidden /></Link>
      <ol className="flex flex-col gap-2">
        {data.map((row) => (
          <li key={row.user.id}>
            <RankRow
              rank={row.rank} avatar={{ src: row.user.avatarUrl, name: row.user.displayName }} title={row.user.displayName}
              value={<>{compactCount(row.hearts)} <span aria-hidden>❤️</span></>} valueClassName="font-sans text-sm font-semibold text-ink"
              render={(className, children) => <Link href={`/u/${row.user.id}`} className={className}>{children}</Link>}
            />
          </li>
        ))}
      </ol>
    </Card>
  );
}
