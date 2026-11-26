'use client';

import { cn } from '@chot-via/ui';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { HomeFooter } from '@/components/home/home-footer';
import { RightRail, type RailVariant } from '@/components/rail/right-rail';
import { BottomNav } from './bottom-nav';
import { Header } from './header';
import { SideNav } from './side-nav';
import { TabletSideNav } from './tablet-side-nav';

/** Cột phải đổi theo trang đang xem (cần Suspense vì đọc query). */
function RailSwitch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const variant: RailVariant =
    pathname === '/'
      ? 'home'
      : pathname.startsWith('/bang-xep-hang')
        ? 'ranking'
        : pathname.startsWith('/su-kien')
          ? 'events'
          : pathname === '/bang-tin' && params.get('type') === 'story' && !params.get('hashtag')
            ? 'story'
            : 'default';
  return <RightRail variant={variant} />;
}

/**
 * Khung responsive: điện thoại 1 cột + thanh dưới · iPad dọc top-nav · iPad ngang/desktop nhỏ 2 cột (nội dung + cột phải)
 * · desktop 3 cột (menu trái · nội dung · cột phải) · màn 2K/4K mở rộng khung nhưng giữ bề rộng đọc của feed.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('common');
  const wide = pathname.startsWith('/pho-3d');
  const home = pathname === '/';
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">{t('skipToContent')}</a>
      <Header />
      <div className={cn(
        'mx-auto grid w-full max-w-[1800px] gap-5 px-3 pb-28 pt-4 sm:px-4 md:pb-10 lg:gap-5 lg:px-4 3xl:max-w-[2200px]',
        home ? 'lg:grid-cols-[12.5rem_minmax(0,1fr)_16.5rem] xl:grid-cols-[minmax(0,1fr)] 3xl:grid-cols-[minmax(0,1fr)]'
          : wide ? 'xl:grid-cols-[minmax(0,1fr)]'
          : 'lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[15.25rem_minmax(0,1fr)_18rem] 3xl:grid-cols-[17rem_minmax(0,1fr)_22rem]',
      )}>
        <aside className={cn('hidden xl:block', (home || wide) && 'xl:hidden')}>
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto scrollbar-none"><Suspense><SideNav /></Suspense></div>
        </aside>
        {home ? <aside className="hidden lg:block xl:hidden"><div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto scrollbar-none"><TabletSideNav /></div></aside> : null}
        <main id="main" className="min-w-0">{children}</main>
        {wide ? null : (
          <aside className={cn('hidden lg:block', home && 'xl:hidden')}>
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto scrollbar-none"><Suspense><RailSwitch /></Suspense></div>
          </aside>
        )}
      </div>
      {pathname === '/' ? <HomeFooter /> : null}
      <BottomNav />
    </div>
  );
}
