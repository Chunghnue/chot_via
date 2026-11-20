'use client';

import { cn } from '@chot-via/ui';
import { BarChart3, CalendarDays, Home, Plus, Store, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { useAppDispatch } from '@/store/hooks';
import { isActivePath } from './header';

/**
 * Thanh điều hướng dưới (điện thoại, theo ảnh thiết kế mới): Trang chủ · Phố 3D · (+) Đăng bài · Sự kiện · BXH · Cá nhân.
 * Nút Xin vía vẫn nổi bật nhất ở hero và thẻ "Xin vía Thần Tài" (quyết định ngày 20/11 thay cho quyết định #1 ngày 19/11).
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const item = (href: string, label: string, icon: React.ReactNode) => (
    <Link href={href} aria-current={isActivePath(pathname, href) ? 'page' : undefined}
      className={cn('flex min-w-0 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold text-ink-muted', isActivePath(pathname, href) && 'text-primary-strong')}>
      {icon}<span className="max-w-full truncate">{label}</span>
    </Link>
  );
  return (
    <nav aria-label={t('mainMenu')} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-[repeat(6,minmax(0,1fr))] items-end">
        {item('/', t('home'), <Home className="size-6" aria-hidden />)}
        {item('/pho-3d', t('street'), <Store className="size-6" aria-hidden />)}
        <div className="flex min-w-0 justify-center">
          <button type="button" onClick={() => dispatch(composerOpened(undefined))} aria-label={t('post')}
            className="-mt-6 flex flex-col items-center gap-0.5 text-[0.7rem] font-semibold text-ink-muted active:scale-95">
            <span className="flex size-14 items-center justify-center rounded-full border-4 border-surface bg-linear-to-b from-gold to-wish text-on-wish shadow-cta"><Plus className="size-8" strokeWidth={3} aria-hidden /></span>
            <span className="max-w-full truncate">{t('post')}</span>
          </button>
        </div>
        {item('/su-kien', t('eventsShort'), <CalendarDays className="size-6" aria-hidden />)}
        {item('/bang-xep-hang', t('leaderboardAbbr'), <BarChart3 className="size-6" aria-hidden />)}
        {item('/ca-nhan', t('profile'), <UserRound className="size-6" aria-hidden />)}
      </div>
    </nav>
  );
}
