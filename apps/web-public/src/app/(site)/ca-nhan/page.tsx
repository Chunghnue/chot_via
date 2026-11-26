'use client';

import { useGetMeStatsQuery, useLogoutMutation } from '@chot-via/api-client';
import { AppIcon, Avatar, Badge, Button, Card, ProgressBar, Sheet, Skeleton } from '@chot-via/ui';
import { Bell, CalendarDays, ChevronRight, Flag, LogOut, Settings, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { ProfileForm } from '@/components/common/profile-form';
import { RequireMember } from '@/components/common/require-member';
import { FeedList } from '@/components/post/feed';
import { useCurrentUser } from '@/lib/use-member';

function Profile() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tp = useTranslations('post.roles');
  const me = useCurrentUser();
  const { data: stats, isLoading } = useGetMeStatsQuery(undefined, { pollingInterval: 30_000, refetchOnFocus: true });
  const [logout] = useLogoutMutation();
  const [editing, setEditing] = useState(false);
  if (!me) return null;

  const tiles = [
    { href: '/tao-diem', icon: '/images/ic-home.webp', label: t('tiles.myPlaces') },
    { href: '#bai-dang', icon: '/images/ic-money-bag.webp', label: t('tiles.posts') },
    { href: '#thanh-tich', icon: '/images/ic-trophy.webp', label: t('tiles.achievements') },
    { href: '/da-luu', icon: '/images/ic-star.webp', label: t('tiles.favorites') },
  ] as const;
  const menu = [
    { href: '/su-kien', icon: <CalendarDays className="size-5" aria-hidden />, label: t('menu.missions') },
    { href: '/bang-xep-hang', icon: <Trophy className="size-5" aria-hidden />, label: t('menu.leaderboard') },
    { href: '/thong-bao', icon: <Bell className="size-5" aria-hidden />, label: t('menu.notifications') },
    { href: '/bao-cao-cua-toi', icon: <Flag className="size-5" aria-hidden />, label: t('menu.reports') },
    { href: '/cai-dat', icon: <Settings className="size-5" aria-hidden />, label: t('menu.settings') },
  ] as const;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Card className="relative flex flex-col items-center gap-2 p-6 text-center">
        <Link href="/cai-dat" aria-label={t('menu.settings')} className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"><Settings className="size-5" aria-hidden /></Link>
        <button type="button" onClick={() => setEditing(true)} aria-label={t('edit')} className="rounded-full"><Avatar src={me.avatarUrl} name={me.displayName} size={88} className="ring-4 ring-primary-soft" /></button>
        <h1 className="font-display text-3xl font-extrabold">{me.displayName}</h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {me.memberRole ? <Badge tone={me.memberRole === 'sale' ? 'sale' : 'owner'}>{tp(me.memberRole)}</Badge> : null}
          {stats?.level ? <Badge tone="gold">{tc('level', { name: stats.level.name })}</Badge> : null}
        </div>
        {isLoading || !stats ? <Skeleton className="h-8 w-40" /> : (
          <p className="flex items-center gap-1.5 font-display text-xl font-extrabold text-primary-strong"><img src="/images/ic-star.webp" alt="" aria-hidden className="size-6 object-contain" draggable={false} />{t('pointsLine', { count: new Intl.NumberFormat('vi-VN').format(stats.points) })}</p>
        )}
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>{t('edit')}</Button>
      </Card>

      {stats ? (
        <Card className="p-4" data-testid="engagement-card">
          <h2 className="text-sm font-bold text-ink-muted">{t('engagement.title')}</h2>
          <p className="mt-1 flex items-baseline gap-2"><span className="font-display text-4xl font-extrabold text-primary-strong">{stats.engagement.today}</span><span className="font-semibold text-ink-muted">{t('engagement.unit', { cap: stats.engagement.cap })}</span></p>
          <ProgressBar className="mt-2" value={stats.engagement.today} max={stats.engagement.cap} />
          <p className="mt-2 text-sm text-ink">{stats.engagement.today >= stats.engagement.cap ? t('engagement.full') : t('engagement.remaining', { count: stats.engagement.cap - stats.engagement.today })}</p>
          <p className="mt-1 text-xs text-ink-subtle">{t('engagement.hint')}</p>
        </Card>
      ) : null}

      <nav aria-label={t('shortcuts')} className="grid grid-cols-4 gap-2">
        {tiles.map((x) => (
          <Link key={x.href} href={x.href} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface p-3 text-center text-[0.72rem] font-bold leading-tight text-ink shadow-card transition active:scale-95 sm:text-sm">
            <img src={x.icon} alt="" aria-hidden className="size-9 object-contain sm:size-11" draggable={false} />{x.label}
          </Link>
        ))}
      </nav>

      <Card className="divide-y divide-border">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold hover:bg-surface-muted">{m.icon}<span className="flex-1">{m.label}</span><ChevronRight className="size-4 text-ink-subtle" aria-hidden /></Link>
        ))}
        <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold hover:bg-surface-muted"><LogOut className="size-5" aria-hidden /><span className="flex-1 text-left">{t('menu.logout')}</span><ChevronRight className="size-4 text-ink-subtle" aria-hidden /></button>
      </Card>

      <Card id="thanh-tich" className="p-4">
        <h2 className="mb-2 font-display text-xl font-extrabold">{t('badges')}</h2>
        {stats && stats.badges.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">{stats.badges.map((b) => (
            <li key={b.id} className="flex flex-col items-center gap-1 rounded-2xl bg-gold-soft p-3 text-center"><AppIcon iconKey={b.iconKey} className="text-3xl" /><span className="text-xs font-bold text-gold-strong">{b.name}</span></li>
          ))}</ul>
        ) : <p className="text-sm text-ink-muted">{t('noBadges')}</p>}
      </Card>

      <section id="bai-dang" className="flex flex-col gap-3"><h2 className="font-display text-xl font-extrabold">{t('myPosts')}</h2><FeedList variant="wide" query={{ authorId: me.id }} /></section>

      <Sheet open={editing} onOpenChange={setEditing} title={t('edit')} closeLabel={tc('close')}><ProfileForm me={me} onSaved={() => setEditing(false)} /></Sheet>
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  return <RequireMember reason="profile" message={t('loginPrompt')}><Profile /></RequireMember>;
}
