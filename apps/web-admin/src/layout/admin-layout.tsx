import { selectCurrentUser, useLogoutMutation } from '@xin-via/api-client';
import { Avatar, Button, cn } from '@xin-via/ui';
import {
  Award, BarChart3, CalendarDays, Flag, LayoutDashboard, ListChecks, LogOut, Menu, MessageSquare, MessagesSquare, ScrollText, Settings, Shapes,
  Shield, Sparkles, Store, Tags, Trophy, Users, X, FileText, Layers, KeyRound, Target, Flame,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslations } from 'use-intl';
import { selectSidebarOpen, sidebarToggled, useAppDispatch, useAppSelector } from '../store';

interface Item { to: string; label: string; icon: ReactNode; adminOnly?: boolean; end?: boolean }

export function AdminLayout({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations('admin');
  const user = useAppSelector(selectCurrentUser);
  const open = useAppSelector(selectSidebarOpen);
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const i = 'size-5';

  const groups: { title: string; items: Item[] }[] = [
    { title: t('nav.groupModeration'), items: [
      { to: '/', label: t('nav.dashboard'), icon: <LayoutDashboard className={i} />, end: true },
      { to: '/reports', label: t('nav.reports'), icon: <Flag className={i} /> },
      { to: '/posts', label: t('nav.posts'), icon: <FileText className={i} /> },
      { to: '/comments', label: t('nav.comments'), icon: <MessageSquare className={i} /> },
      { to: '/users', label: t('nav.users'), icon: <Users className={i} /> },
      { to: '/catalog/keywords', label: t('nav.keywords'), icon: <KeyRound className={i} /> },
      { to: '/catalog/hot-topics', label: t('nav.hotTopics'), icon: <Flame className={i} />, adminOnly: true },
    ] },
    { title: t('nav.groupHome'), items: [
      { to: '/home-config', label: t('nav.homeConfig'), icon: <Store className={i} />, adminOnly: true },
      { to: '/catalog/street-slots', label: t('nav.streetSlots'), icon: <Layers className={i} />, adminOnly: true },
      { to: '/catalog/home-actions', label: t('nav.homeActions'), icon: <ListChecks className={i} />, adminOnly: true },
      { to: '/catalog/footer-links', label: t('nav.footerLinks'), icon: <Tags className={i} />, adminOnly: true },
    ] },
    { title: t('nav.groupContent'), items: [
      { to: '/places', label: t('nav.places'), icon: <Store className={i} />, adminOnly: true },
      { to: '/demo/users', label: t('nav.demoUsers'), icon: <Users className={i} />, adminOnly: true },
      { to: '/demo/posts', label: t('nav.demoPosts'), icon: <FileText className={i} />, adminOnly: true },
      { to: '/catalog/place-categories', label: t('nav.placeCategories'), icon: <Tags className={i} />, adminOnly: true },
      { to: '/catalog/scene-templates', label: t('nav.sceneTemplates'), icon: <Layers className={i} />, adminOnly: true },
      { to: '/catalog/wish-types', label: t('nav.wishTypes'), icon: <Sparkles className={i} />, adminOnly: true },
      { to: '/catalog/wish-stickers', label: t('nav.wishStickers'), icon: <Shapes className={i} />, adminOnly: true },
      { to: '/catalog/wish-templates', label: t('nav.wishTemplates'), icon: <MessagesSquare className={i} />, adminOnly: true },
      { to: '/shop', label: t('nav.shop'), icon: <Tags className={i} />, adminOnly: true },
    ] },
    { title: t('nav.groupGamification'), items: [
      { to: '/catalog/levels', label: t('nav.levels'), icon: <BarChart3 className={i} />, adminOnly: true },
      { to: '/catalog/badges', label: t('nav.badges'), icon: <Award className={i} />, adminOnly: true },
      { to: '/catalog/missions', label: t('nav.missions'), icon: <ListChecks className={i} />, adminOnly: true },
      { to: '/catalog/challenges', label: t('nav.challenges'), icon: <Target className={i} />, adminOnly: true },
      { to: '/catalog/events', label: t('nav.events'), icon: <CalendarDays className={i} />, adminOnly: true },
    ] },
    { title: t('nav.groupSystem'), items: [
      { to: '/settings', label: t('nav.settings'), icon: <Settings className={i} />, adminOnly: true },
      { to: '/audit', label: t('nav.audit'), icon: <ScrollText className={i} />, adminOnly: true },
    ] },
  ];

  const nav = (
    <nav className="flex flex-col gap-5 overflow-y-auto p-3" aria-label={t('appName')}>
      {groups.map((g) => {
        const items = g.items.filter((x) => isAdmin || !x.adminOnly);
        if (items.length === 0) return null;
        return (
          <div key={g.title}>
            <p className="mb-1 px-3 text-[0.7rem] font-bold uppercase tracking-wide text-ink-subtle">{g.title}</p>
            {items.map((x) => (
              <NavLink
                key={x.to}
                to={x.to}
                end={x.end}
                onClick={() => dispatch(sidebarToggled(false))}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-surface-muted',
                  )
                }
              >
                {x.icon}
                {x.label}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <img src="/logo-than-tai.webp" alt="" aria-hidden className="size-9 object-contain" draggable={false} />
          <span className="font-display text-lg font-extrabold text-primary-strong">{t('appName')}</span>
        </div>
        {nav}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label={t('nav.closeMenu')} className="absolute inset-0 animate-fade-in bg-overlay" onClick={() => dispatch(sidebarToggled(false))} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-sheet-up flex-col bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-display text-lg font-extrabold text-primary-strong">{t('appName')}</span>
              <button type="button" aria-label={t('nav.closeMenu')} onClick={() => dispatch(sidebarToggled(false))}>
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
          <button
            type="button"
            aria-label={t('nav.menu')}
            className="flex size-10 items-center justify-center rounded-full hover:bg-surface-muted lg:hidden"
            onClick={() => dispatch(sidebarToggled(true))}
          >
            <Menu className="size-5" />
          </button>
          <Shield className="hidden size-5 text-primary sm:block" aria-hidden />
          <span className="font-display text-lg font-bold lg:hidden">{t('appName')}</span>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <span className="hidden items-center gap-2 text-sm font-semibold sm:flex">
                <Avatar src={user.avatarUrl} name={user.displayName} size={32} />
                {user.displayName}
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="size-4" aria-hidden />
              {t('login.logout')}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { Trophy };
