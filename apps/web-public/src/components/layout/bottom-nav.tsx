'use client';

import { cn } from '@chot-via/ui';
import { CalendarDays, Home, Plus, Store, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { useAppDispatch } from '@/store/hooks';
import { isActivePath } from './header';

/**
 * Thanh điều hướng dưới (điện thoại, theo ảnh thiết kế mới): Trang chủ · Phố 3D · (+) Đăng bài · Sự kiện · Cá nhân.
 * Nút Xin vía vẫn nổi bật nhất ở hero và thẻ "Xin vía Thần Tài" (quyết định ngày 20/11 thay cho quyết định #1 ngày 19/11).
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  // Mỗi tab là một "viên ngọc" 3D: đang chọn thì nhô lên, xanh bóng (cùng xanh trang chủ) có vệt sáng và bóng đổ; chưa chọn là nút lõm nhẹ màu xanh nhạt. Chạm thì lún xuống rồi nảy lại.
  const item = (href: string, label: string, icon: React.ReactNode) => {
    const active = isActivePath(pathname, href);
    return (
      <Link href={href} aria-current={active ? 'page' : undefined} className="group flex min-w-0 flex-col items-center gap-1 pb-1.5 pt-2 text-[0.68rem] font-extrabold transition active:scale-95">
        <span className={cn(
          'grid size-11 place-items-center rounded-2xl transition-all duration-300 ease-out group-active:translate-y-0.5',
          active
            ? '-translate-y-2 btn-glossy text-on-primary shadow-[0_8px_14px_rgb(20_90_40/0.38),inset_0_2px_0_rgb(255_255_255/0.55)] scale-110'
            : 'bg-linear-to-b from-surface to-primary-soft text-primary-strong shadow-[inset_0_-2px_0_rgb(20_90_40/0.12),inset_0_2px_0_rgb(255_255_255),0_2px_4px_rgb(20_90_40/0.12)]',
        )}>{icon}</span>
        <span className={cn('max-w-full truncate leading-none transition-colors', active ? 'text-primary-strong' : 'text-ink-muted')}>{label}</span>
      </Link>
    );
  };
  return (
    <nav aria-label={t('mainMenu')} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-[repeat(5,minmax(0,1fr))] items-end rounded-[2rem] border-2 border-surface bg-linear-to-b from-surface via-surface to-primary-soft px-1.5 shadow-[0_-4px_24px_rgb(20_90_40/0.16),0_10px_28px_rgb(20_90_40/0.28),inset_0_2px_0_rgb(255_255_255)] backdrop-blur">
        {item('/', t('home'), <Home className="size-6" strokeWidth={2.4} aria-hidden />)}
        {item('/pho-3d', t('street'), <Store className="size-6" strokeWidth={2.4} aria-hidden />)}
        <div className="flex min-w-0 justify-center">
          <button type="button" onClick={() => dispatch(composerOpened(undefined))} aria-label={t('post')}
            className="group -mt-8 flex flex-col items-center gap-1 pb-1.5 text-[0.68rem] font-extrabold text-wish-strong transition active:scale-95">
            <span className="relative flex size-16 items-center justify-center rounded-full border-4 border-surface bg-linear-to-b from-gold-bright via-gold to-wish text-on-wish shadow-[0_0_0_3px_var(--color-cta-glow),0_10px_20px_rgb(217_45_11/0.5),inset_0_3px_0_rgb(255_255_255/0.55)] transition group-active:translate-y-0.5 animate-glow">
              <Plus className="size-9 drop-shadow" strokeWidth={3.4} aria-hidden />
            </span>
            <span className="max-w-full truncate leading-none">{t('post')}</span>
          </button>
        </div>
        {item('/su-kien', t('eventsShort'), <CalendarDays className="size-6" strokeWidth={2.4} aria-hidden />)}
        {item('/ca-nhan', t('profile'), <UserRound className="size-6" strokeWidth={2.4} aria-hidden />)}
      </div>
    </nav>
  );
}
