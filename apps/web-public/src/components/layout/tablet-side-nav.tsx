'use client';

import { Card, buttonClass, cn } from '@chot-via/ui';
import { ArrowRight, BarChart3, Flame, Home, MessageCircle, PlusSquare, Handshake, Sparkles, Gift, Target, Store, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { composerOpened } from '@/features/composer/composerSlice';
import { wishRequested } from '@/features/ui/uiSlice';
import { useAppDispatch } from '@/store/hooks';

const icon = 'size-5 shrink-0';
const item = 'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[0.9rem] font-semibold text-ink transition hover:bg-surface-muted';

/** Menu trái của iPad ngang (ảnh thiết kế b): 12 mục + thẻ "Tạo cửa hàng 3D". Chỉ hiện ở trang chủ từ 1024px đến dưới 1280px. */
export function TabletSideNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const link = (href: string, label: string, ic: React.ReactNode) => {
    const active = href === '/' && pathname === '/';
    return (
      <Link key={label} href={href} aria-current={active ? 'page' : undefined} className={cn(item, active && 'bg-linear-to-b from-primary to-primary-strong text-on-primary shadow-card hover:bg-primary-strong')}>{ic}{label}</Link>
    );
  };
  return (
    <div className="flex flex-col gap-3">
      <Card className="p-2">
        <nav aria-label={t('tabletMenu')} className="flex flex-col gap-0.5">
          {link('/', t('home'), <Home className={icon} aria-hidden />)}
          {link('/pho-3d', t('tabletStreet'), <Store className={icon} aria-hidden />)}
          {link('/bang-tin', t('tabletFeed'), <MessageCircle className={icon} aria-hidden />)}
          <button type="button" className={item} onClick={() => dispatch(composerOpened(undefined))}><PlusSquare className={icon} aria-hidden />{t('post')}</button>
          {link('/bang-tin?type=story', t('story'), <Flame className={icon} aria-hidden />)}
          {link('/bang-tin?type=brag', t('brag'), <Handshake className={icon} aria-hidden />)}
          <button type="button" className={item} onClick={() => dispatch(wishRequested())}><Sparkles className={icon} aria-hidden />{t('tabletWish')}</button>
          {link('/pho-3d', t('tabletSendReceive'), <Gift className={icon} aria-hidden />)}
          {link('/su-kien', t('challenge'), <Target className={icon} aria-hidden />)}
          {link('/bang-xep-hang', t('leaderboard'), <BarChart3 className={icon} aria-hidden />)}
          {link('/tao-diem', t('tabletCreateStore'), <Store className={icon} aria-hidden />)}
          {link('/ca-nhan', t('profile'), <UserRound className={icon} aria-hidden />)}
        </nav>
      </Card>
      <Card className="overflow-hidden">
        <div className="bg-linear-to-b from-primary-soft to-surface px-2 pb-1 pt-2 text-center">
          <img src="/images/cua-hang-mau.webp" alt="" aria-hidden className="mx-auto w-full max-w-[6.5rem] object-contain" draggable={false} />
          <h2 className="mt-1 font-display text-base font-extrabold leading-tight text-primary-strong">{t('createStoreTitleLine1')}<br />{t('createStoreTitleLine2')}</h2>
        </div>
        <div className="p-2">
          <Link href="/tao-diem" className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'w-full bg-linear-to-b from-primary to-primary-strong font-bold')}>{t('createStoreCta')}<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </Card>
    </div>
  );
}
