'use client';

import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from '@chot-via/api-client';
import type { NotificationDto } from '@chot-via/shared';
import { Button, Card, EmptyState, Skeleton, cn, useFormatters } from '@chot-via/ui';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { PageTitle, RequireMember } from '@/components/common/require-member';

function NotificationText({ n }: { n: NotificationDto }) {
  const t = useTranslations('community.notifications');
  const tc = useTranslations('common');
  switch (n.type) {
    case 'place_wished':
      return (
        <Link href={`/diem/${n.params.placeSlug}`}>
          {t('place_wished', { sender: n.params.senderName ?? tc('guestName'), wishType: n.params.wishTypeName, place: n.params.placeTitle })}
        </Link>
      );
    case 'post_commented':
      return <Link href={`/bai/${n.params.postId}`}>{t('post_commented', { actor: n.params.actorName })}</Link>;
    case 'post_reacted':
      return <Link href={`/bai/${n.params.postId}`}>{t('post_reacted', { actor: n.params.actorName })}</Link>;
    case 'new_follower':
      return <Link href={`/u/${n.params.userId}`}>{t('new_follower', { actor: n.params.actorName })}</Link>;
    case 'post_removed':
      return <span>{t('post_removed')}</span>;
    case 'report_resolved':
      return <span>{t('report_resolved', { target: t(`targets.${n.params.targetType}`) })}</span>;
  }
}

function Content() {
  const t = useTranslations('community.notifications');
  const f = useFormatters();
  const { data, isLoading } = useGetNotificationsQuery(1);
  const [markRead] = useMarkNotificationsReadMutation();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <PageTitle>{t('title')}</PageTitle>
      {data && data.unread > 0 ? (
        <Button variant="soft" size="sm" className="self-end" onClick={() => void markRead()}>
          {t('markAll')}
        </Button>
      ) : null}
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : data?.items.length === 0 ? (
        <EmptyState icon="🔔" title={t('empty')} />
      ) : (
        <Card className="divide-y divide-border">
          {data?.items.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.readAt) void markRead({ ids: [n.id] });
              }}
              className={cn('flex cursor-pointer flex-col gap-0.5 px-4 py-3 text-sm text-ink', !n.readAt && 'bg-primary-soft font-semibold')}
            >
              <NotificationText n={n} />
              <span className="text-xs font-normal text-ink-subtle">{f.relative(n.createdAt)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('profile');
  return <RequireMember reason="profile" message={t('loginPrompt')}><Content /></RequireMember>;
}
