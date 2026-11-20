'use client';

import { useBlockUserMutation, useFollowUserMutation, useGetProfileQuery } from '@chot-via/api-client';
import { AppIcon, Avatar, Badge, Button, Card, EmptyState, Skeleton } from '@chot-via/ui';
import { useParams } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { FeedList } from '@/components/post/feed';
import { useApiToast } from '@/lib/use-api-toast';
import { useRequireMember } from '@/lib/use-member';

export default function UserPage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tp = useTranslations('post.roles');
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetProfileQuery(id);
  const [follow] = useFollowUserMutation();
  const [block] = useBlockUserMutation();
  const { require, user } = useRequireMember();
  const toast = useApiToast();
  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !data) return <EmptyState icon="🙈" title={t('notFound')} />;
  const own = user?.id === data.id;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar src={data.avatarUrl} name={data.displayName} size={88} />
        <h1 className="font-display text-3xl font-extrabold">{data.displayName}</h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {data.memberRole ? <Badge tone={data.memberRole === 'sale' ? 'sale' : 'owner'}>{tp(data.memberRole)}</Badge> : null}
          {data.level ? <Badge tone="gold">{tc('level', { name: data.level.name })}</Badge> : null}
          <Badge tone="success">{tc('points', { count: data.points })}</Badge>
        </div>
        {data.bio ? <p className="max-w-md text-ink-muted">{data.bio}</p> : null}
        <dl className="grid w-full grid-cols-3 gap-2">
          {([['posts', data.counts.posts], ['followers', data.counts.followers], ['following', data.counts.following]] as const).map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-surface-muted py-2"><dt className="text-xs text-ink-muted">{t(`stats.${k}`)}</dt><dd className="font-display text-2xl font-extrabold">{v}</dd></div>
          ))}
        </dl>
        {!own ? (
          <div className="flex gap-2">
            <Button variant={data.viewer?.following ? 'soft' : 'primary'} onClick={() => { if (require('follow')) void follow({ id: data.id, on: !data.viewer?.following }).unwrap().catch(toast.error); }}>{data.viewer?.following ? t('unfollow') : t('follow')}</Button>
            <Button variant="outline" onClick={() => { if (require('block')) void block({ id: data.id, on: !data.viewer?.blocked }).unwrap().catch(toast.error); }}>{data.viewer?.blocked ? t('unblockUser') : t('blockUser')}</Button>
          </div>
        ) : null}
      </Card>
      {data.badges.length ? <Card className="p-4"><h2 className="mb-2 font-display text-lg font-bold">{t('badges')}</h2><ul className="flex flex-wrap gap-2">{data.badges.map((b) => <li key={b.id}><Badge tone="gold"><AppIcon iconKey={b.iconKey} />{b.name}</Badge></li>)}</ul></Card> : null}
      <FeedList query={{ authorId: data.id }} />
    </div>
  );
}
