'use client';

import { Card, buttonClass, cn } from '@chot-via/ui';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { wishRequested } from '@/features/ui/uiSlice';
import { useAppDispatch } from '@/store/hooks';
import { isActivePath } from './header';
import { SIDE_NAV } from './nav-items';

export function SideNav() {
  const t = useTranslations('nav');
  const ts = useTranslations('post.story');
  const pathname = usePathname();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const type = params.get('type');
  const onStory = pathname === '/bang-tin' && type === 'story' && !params.get('hashtag');

  const active = (href: string): boolean => {
    const [path, query] = href.split('?');
    if (query) return pathname === path && type === new URLSearchParams(query).get('type');
    if (path === '/bang-tin') return pathname === path && !type;
    return isActivePath(pathname, href);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-2">
        <nav aria-label={t('mainMenu')} className="flex flex-col gap-0.5">
          {SIDE_NAV.slice(0, 4).map((item) => (
            <Link key={item.key} href={item.href} aria-current={active(item.href) ? 'page' : undefined}
              className={cn('flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[0.95rem] whitespace-nowrap font-semibold text-ink transition hover:bg-surface-muted [&>svg]:size-6', active(item.href) && 'btn-glossy text-on-primary shadow-card hover:brightness-105')}>
              {item.icon}{t(item.labelKey)}
            </Link>
          ))}
          <button type="button" onClick={() => dispatch(wishRequested())}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] font-semibold text-ink transition hover:bg-surface-muted">
            <span aria-hidden className="text-lg leading-none">🙏</span>{t('wish')}
          </button>
          {SIDE_NAV.slice(4).map((item) => (
            <Link key={item.key} href={item.href} aria-current={active(item.href) ? 'page' : undefined}
              className={cn('flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[0.95rem] whitespace-nowrap font-semibold text-ink transition hover:bg-surface-muted [&>svg]:size-6', active(item.href) && 'btn-glossy text-on-primary shadow-card hover:brightness-105')}>
              {item.icon}{t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </Card>

      {onStory ? (
        <Card className="relative overflow-hidden bg-linear-to-b from-btn-glossy-top to-btn-glossy-bottom">
          <div className="px-3 pb-2 pt-4 text-center">
            <h2 className="font-display text-xl font-extrabold leading-tight text-on-primary [text-shadow:0_2px_0_var(--color-primary-strong)]">{ts('posterTitleLine1')}<br />{ts('posterTitleLine2')}</h2>
          </div>
          <img src="/images/kk-poster.webp" alt="" aria-hidden className="block w-full select-none" draggable={false} />
          <div className="absolute inset-x-3 bottom-3">
            <Link href="/tao-diem" className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'w-full btn-glossy font-bold shadow-card')}>{ts('posterCta')}<ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </Card>
      ) : (
      <Card className="overflow-hidden">
        <div className="bg-linear-to-b from-btn-glossy-top to-btn-glossy-bottom px-4 pb-3 pt-4 text-center text-on-primary">
          <h2 className="font-display text-xl font-extrabold leading-tight">{t('createStoreTitleLine1')}<br />{t('createStoreTitleLine2')}</h2>
          <img src="/images/cua-hang-mau.webp" alt="" aria-hidden className="mx-auto mt-2 w-full max-w-[12rem] object-contain drop-shadow-lg" draggable={false} />
        </div>
        <div className="p-4">
          <ul className="flex flex-col gap-1.5 text-[0.8rem] font-medium text-ink">
            {([t('createStoreItem1'), t('createStoreItem2'), t('createStoreItem3')]).map((text) => (
              <li key={text} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 rounded-full bg-primary p-0.5 text-on-primary" aria-hidden />{text}</li>
            ))}
          </ul>
          <Link href="/tao-diem" className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'mt-3 w-full btn-glossy font-bold')}>{t('createStoreCta')}<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </Card>
      )}
    </div>
  );
}
