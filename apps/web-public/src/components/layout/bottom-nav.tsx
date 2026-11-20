'use client';

import { cn } from '@chot-via/ui';
import { MessageCircle, Store, UserRound, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { wishDialogToggled } from '@/features/ui/uiSlice';
import { useAppDispatch } from '@/store/hooks';
import { isActivePath } from './header';

/** Thanh điều hướng dưới (điện thoại): nút giữa luôn là Xin vía (quyết định #8). */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const item = (href: string, label: string, icon: React.ReactNode) => (
    <Link href={href} aria-current={isActivePath(pathname, href) ? 'page' : undefined}
      className={cn('flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold text-ink-muted', isActivePath(pathname, href) && 'text-primary-strong')}>
      {icon}<span>{label}</span>
    </Link>
  );
  return (
    <nav aria-label={t('mainMenu')} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        {item('/', t('home'), <Home className="size-6" aria-hidden />)}
        {item('/bang-tin', t('feed'), <MessageCircle className="size-6" aria-hidden />)}
        <div className="flex justify-center">
          <button type="button" onClick={() => dispatch(wishDialogToggled(true))} aria-label={t('wish')}
            className="-mt-7 flex size-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-full border-4 border-surface bg-linear-to-b from-wish to-wish-strong text-on-wish shadow-cta animate-glow active:scale-95">
            <span aria-hidden className="text-2xl leading-none">🙏</span>
            <span className="text-[0.7rem] font-extrabold">{t('wish')}</span>
          </button>
        </div>
        {item('/pho-3d', t('street'), <Store className="size-6" aria-hidden />)}
        {item('/ca-nhan', t('profile'), <UserRound className="size-6" aria-hidden />)}
      </div>
    </nav>
  );
}
