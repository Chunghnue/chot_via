'use client';

import { useGetNotificationsQuery, useLogoutMutation } from '@chot-via/api-client';
import { Avatar, Button, Logo, Menu, buttonClass, cn, toast, type MenuItem } from '@chot-via/ui';
import { Bell, CircleUserRound, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'use-intl';
import { loginRequested } from '@/features/ui/uiSlice';
import { useAuthStatus, useRequireMember } from '@/lib/use-member';
import { useAppDispatch } from '@/store/hooks';
import { TOP_NAV } from './nav-items';

export const isActivePath = (pathname: string, href: string): boolean => {
  const path = href.split('?')[0] ?? href;
  return path === '/' ? pathname === '/' : pathname.startsWith(path);
};

export function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const ta = useTranslations('auth');
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAuthStatus();
  const { isMember, user } = useRequireMember();
  const [logout] = useLogoutMutation();
  const [query, setQuery] = useState('');
  const { data } = useGetNotificationsQuery(1, { skip: !isMember, pollingInterval: 60_000 });

  const submitSearch = (e: FormEvent): void => {
    e.preventDefault();
    if (query.trim()) router.push(`/tim-kiem?q=${encodeURIComponent(query.trim())}`);
  };

  const items: MenuItem[] = [
    { key: 'profile', label: t('profile'), onSelect: () => router.push('/ca-nhan') },
    { key: 'places', label: t('myPlaces'), onSelect: () => router.push('/tao-diem') },
    { key: 'saved', label: t('saved'), onSelect: () => router.push('/da-luu') },
    { key: 'notifications', label: t('notifications'), onSelect: () => router.push('/thong-bao') },
    { key: 'reports', label: t('myReports'), onSelect: () => router.push('/bao-cao-cua-toi') },
    { key: 'settings', label: t('settings'), onSelect: () => router.push('/cai-dat') },
    { key: 'logout', label: t('logout'), danger: true, onSelect: () => { void logout().then(() => toast.success(ta('loggedOut'))); } },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface pt-safe">
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-3 px-4 lg:h-[4.5rem] lg:gap-5 lg:px-8 xl:h-[5.125rem] 3xl:max-w-[2200px]">
        <Link href="/" aria-label={tc('appName')} className="shrink-0">
          <span className="xl:hidden"><Logo compact markSrc="/images/logo-than-tai.webp" name={tc('appName')} tagline={tc('tagline')} /></span>
          <span className="hidden xl:block"><Logo markSrc="/images/logo-than-tai.webp" name={tc('appName')} tagline={tc('tagline')} /></span>
        </Link>

        <form onSubmit={submitSearch} role="search" className={cn('order-3 hidden w-[20%] min-w-[6rem] max-w-[35rem] shrink lg:block xl:w-[22%] min-[1440px]:w-[24%]', pathname === '/' && 'lg:max-xl:order-2 lg:max-xl:w-auto lg:max-xl:max-w-none lg:max-xl:flex-1 lg:max-xl:shrink')}>
          <label className="relative block">
            <span className="sr-only">{tc('search')}</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-[1.15rem] -translate-y-1/2 text-ink" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search')} className="h-10 w-full rounded-full border border-transparent bg-search-bg py-0 pl-4 pr-11 text-sm xl:h-11 xl:text-[0.95rem] text-ellipsis text-ink outline-none placeholder:text-ink-muted focus:border-primary focus:bg-surface" />
          </label>
        </form>

        <nav aria-label={t('mainMenu')} className={cn('order-2 hidden flex-1 items-stretch justify-center gap-1 self-stretch md:flex xl:gap-1 2xl:gap-3', pathname === '/' && 'lg:max-xl:hidden')}>
          {TOP_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.key} href={item.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex min-w-[4.2rem] flex-col items-center justify-center gap-1 whitespace-nowrap px-1 text-[0.78rem] font-bold leading-tight text-ink transition hover:text-primary-strong xl:px-2 xl:text-[0.9rem] min-[1440px]:text-[0.95rem] [&>svg]:size-6 xl:[&>svg]:size-7',
                  active && 'text-primary-strong', active && item.key === 'home' && '[&>svg]:fill-current [&>svg]:stroke-surface')}
              >
                {item.icon}
                {item.fullLabelKey ? (
                  <>
                    <span className="line-clamp-1 min-[1440px]:hidden">{t(item.labelKey)}</span>
                    <span className="line-clamp-1 hidden min-[1440px]:inline">{t(item.fullLabelKey)}</span>
                  </>
                ) : <span className="line-clamp-1">{t(item.labelKey)}</span>}
                {active ? <span className="absolute inset-x-1 bottom-0 h-1 rounded-t-full bg-primary xl:h-[5px]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="order-4 ml-auto flex items-center gap-2 md:ml-0 lg:gap-3">
          <Link href="/tim-kiem" aria-label={tc('search')} className={cn(buttonClass({ variant: 'ghost', size: 'icon' }), 'lg:hidden')}>
            <Search className="size-5" aria-hidden />
          </Link>
          <Link href={isMember ? '/thong-bao' : '#'} aria-label={t('notifications')} onClick={isMember ? undefined : (e) => { e.preventDefault(); dispatch(loginRequested('generic')); }} className={cn(buttonClass({ variant: 'ghost', size: 'icon' }), 'relative size-11 xl:size-12')}>
            <Bell className="size-6 xl:size-7" aria-hidden />
            {isMember && data && data.unread > 0 ? (
              <span className="absolute right-0 top-0 flex h-[1.3rem] min-w-[1.3rem] items-center justify-center rounded-full bg-danger px-1 text-[0.7rem] font-bold leading-none text-on-primary ring-2 ring-surface">{data.unread > 99 ? '99+' : data.unread}</span>
            ) : null}
          </Link>
          {isMember && user ? (
            <Menu label={t('profile')} items={items} trigger={<button type="button" className="rounded-full"><Avatar src={user.avatarUrl} name={user.displayName} size={44} /></button>} />
          ) : status === 'unknown' ? null : (
            <Button className="h-10 btn-glossy px-4 text-sm font-bold shadow-[0_6px_14px_-5px_var(--color-primary)] xl:h-[2.9rem] xl:px-6 xl:text-base" onClick={() => dispatch(loginRequested('generic'))}>
              <CircleUserRound className="size-5 xl:size-[1.4rem]" aria-hidden />
              <span className="hidden min-[1100px]:inline">{t('login')}</span><span className="hidden lg:max-[1099px]:inline">{ta('loginCta')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
