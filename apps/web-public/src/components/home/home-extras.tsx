'use client';

import { useGetEventsQuery, useGetHomeQuery, useGetLeaderboardQuery, useGetMissionsQuery } from '@chot-via/api-client';
import { Avatar, Card, Skeleton, buttonClass, cn, compactCount, useFormatters } from '@chot-via/ui';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { wishRequested } from '@/features/ui/uiSlice';
import { useMounted } from '@/lib/use-mounted';
import { useAppDispatch } from '@/store/hooks';

/** Thẻ "Xin vía Thần Tài" (điện thoại: banner ngang; máy tính: thẻ cột trái). Bấm mở hộp Xin vía. */
export function DeityBanner({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('home.extras');
  const dispatch = useAppDispatch();
  if (compact) {
    // Máy tính (ảnh thiết kế): Thần Tài to thò lên khỏi mép thẻ, tiêu đề đỏ một dòng, nút xanh "Xin vía ngay →".
    return (
      <div className="relative mt-5 flex min-h-[8rem] items-center rounded-3xl bg-linear-to-br from-gold-soft via-surface to-gold-soft pl-[8rem] pr-3 shadow-card ring-1 ring-gold/40">
        <img src="/images/than-tai.webp" alt="" aria-hidden className="pointer-events-none absolute -left-2 -top-4 w-[8.75rem] select-none object-contain drop-shadow-md" draggable={false} />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1 py-3">
          <span className="whitespace-nowrap font-display text-[1.15rem] font-extrabold italic leading-tight text-wish-strong">{t('deityTitle')}</span>
          <span className="text-xs font-semibold leading-snug text-ink">{t('deityTodayHint')}</span>
          <button type="button" onClick={() => dispatch(wishRequested())} aria-label={t('deityTitle')}
            className="mt-1 inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full bg-linear-to-b from-primary to-primary-strong px-4 text-sm font-bold text-on-primary shadow-card ring-2 ring-surface transition hover:brightness-105 active:scale-95">{t('wishNow')}<ArrowRight className="size-4" aria-hidden /></button>
        </div>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => dispatch(wishRequested())} aria-label={t('deityTitle')}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-linear-to-r from-gold-soft via-wish-soft to-gold-soft px-4 py-3 text-left shadow-card ring-1 ring-gold/40 transition active:scale-[0.98]">
      <img src="/images/than-tai.webp" alt="" aria-hidden className="h-16 w-auto shrink-0 object-contain" draggable={false} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-xl font-extrabold italic text-wish-strong">{t('deityTitle')}</span>
        <span className="text-xs font-medium leading-snug text-ink">{t('deityText')}</span>
      </span>
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-wish shadow-card"><ChevronRight className="size-5" /></span>
    </button>
  );
}

/** "Thử thách tuần" (máy tính): danh sách nhiệm vụ có dấu ✓ khi đã xong. Chỉ theo dõi tiến độ, không hiện điểm thưởng (quyết định #18). */
export function ChallengeTasks() {
  const t = useTranslations('home.extras');
  const { data, isLoading } = useGetMissionsQuery();
  const mounted = useMounted();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink"><img src="/images/ic-fire.webp" alt="" aria-hidden className="size-10 object-contain" draggable={false} />{t('challengeTitle')}</h2>
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-medium leading-snug text-ink">{t('challengeSub')}</p>
        <img src="/images/ic-crown.webp" alt="" aria-hidden className="size-16 shrink-0 object-contain drop-shadow" draggable={false} />
      </div>
      {isLoading || !mounted ? <Skeleton className="h-24" /> : (
        <ul className="flex flex-col gap-2.5">
          {(data ?? []).slice(0, 3).map((m) => {
            const done = m.progress !== null && m.progress >= m.target;
            return (
              <li key={m.id} className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-ink">
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', done ? 'bg-primary text-on-primary' : 'bg-primary-soft text-primary-strong ring-1 ring-primary/40')}><Check className="size-4" strokeWidth={3} aria-hidden /></span>
                <span className="min-w-0 flex-1">{m.name}</span>
                {m.progress !== null ? <span className="text-xs font-bold text-ink-muted">{Math.min(m.progress, m.target)}/{m.target}</span> : null}
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/su-kien" className={cn(buttonClass({ variant: 'primary', size: 'lg' }), 'mt-1 w-full bg-linear-to-b from-primary to-primary-strong text-lg font-bold shadow-card ring-2 ring-surface')}>{t('joinNow')}<ArrowRight className="size-5" aria-hidden /></Link>
    </Card>
  );
}

/** Thẻ "Tạo cửa hàng 3D" (cột trái máy tính). */
export function CreateStoreCard() {
  const t = useTranslations('home.extras');
  const tn = useTranslations('nav');
  return (
    <Card className="flex flex-col items-center gap-2 overflow-hidden bg-linear-to-br from-primary-soft via-surface to-primary-soft p-5 text-center ring-1 ring-primary/20">
      <img src="/images/cua-hang-mau.webp" alt="" aria-hidden className="h-32 w-auto object-contain drop-shadow-lg" draggable={false} />
      <h2 className="font-display text-2xl font-extrabold text-primary-strong">{tn('createStoreTitleLine1')}</h2>
      <p className="text-sm font-medium leading-snug text-ink">{t('storeText')}</p>
      <Link href="/tao-diem" className={cn(buttonClass({ variant: 'primary', size: 'lg' }), 'mt-1 w-full bg-linear-to-b from-primary to-primary-strong text-lg font-bold shadow-card ring-2 ring-surface')}>{tn('createStoreCta')}<ArrowRight className="size-5" aria-hidden /></Link>
    </Card>
  );
}

/** "Sự kiện nổi bật" (cột phải máy tính): sự kiện đang diễn ra, có nút trái/phải khi có nhiều hơn một. */
export function FeaturedEventCard() {
  const t = useTranslations('home.extras');
  const f = useFormatters();
  const { data, isLoading } = useGetEventsQuery();
  const [index, setIndex] = useState(0);
  const mounted = useMounted();
  if (isLoading || !mounted) return <Skeleton className="h-44" />;
  if (!data || data.length === 0) return null;
  const event = data[index % data.length];
  if (!event) return null;
  const step = (d: number): void => setIndex((i) => (i + d + data.length) % data.length);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink"><img src="/images/ic-gift.webp" alt="" aria-hidden className="size-8 object-contain" draggable={false} />{t('eventsTitle')}</h2>
      <div className="relative flex flex-col items-center gap-1 rounded-2xl bg-linear-to-b from-gold-soft to-wish-soft px-8 py-3 text-center">
        {data.length > 1 ? <>
          <button type="button" onClick={() => step(-1)} aria-label={t('prev')} className="absolute left-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-card"><ChevronLeft className="size-4" aria-hidden /></button>
          <button type="button" onClick={() => step(1)} aria-label={t('next')} className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-card"><ChevronRight className="size-4" aria-hidden /></button>
        </> : null}
        <p className="font-display text-lg font-extrabold leading-tight text-wish-strong">{event.title}</p>
        {event.description ? <p className="line-clamp-3 text-xs font-medium text-ink">{event.description}</p> : null}
        <p className="text-[0.7rem] text-ink-subtle">{t('until', { date: f.date(event.endsAt) })}</p>
        <Link href="/su-kien" className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'mt-1 bg-linear-to-b from-primary to-primary-strong font-bold')}>{t('joinNow')}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      {data.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-hidden>{data.map((e, i) => <span key={e.id} className={cn('size-1.5 rounded-full', i === index % data.length ? 'bg-primary' : 'bg-border')} />)}</div>
      ) : null}
    </Card>
  );
}

/** "Cộng đồng Chốt Vía" (cột phải máy tính): số thành viên và ảnh vài thành viên nổi bật. */
export function CommunityCard() {
  const t = useTranslations('home.extras');
  const { data: home } = useGetHomeQuery();
  const { data: board } = useGetLeaderboardQuery(5);
  const members = home?.stats.members ?? 0;
  return (
    <Card className="flex flex-col items-center gap-2 p-4 text-center">
      <h2 className="flex items-center gap-2 whitespace-nowrap font-display text-xl font-extrabold text-ink"><img src="/images/ic-star.webp" alt="" aria-hidden className="size-8 object-contain" draggable={false} />{t('communityTitle')}</h2>
      {members > 0 ? <p className="text-sm font-bold text-wish-strong">{t('members', { count: members.toLocaleString('vi-VN') })}</p> : null}
      <div className="flex -space-x-2">
        {(board?.items ?? []).slice(0, 5).map((m) => <Avatar key={m.user.id} src={m.user.avatarUrl} name={m.user.displayName} size={40} />)}
        {members > 5 ? <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-strong ring-2 ring-surface">+{compactCount(members - 5).toUpperCase()}</span> : null}
      </div>
      <p className="text-xs font-medium leading-snug text-ink">{t('communityText')}</p>
    </Card>
  );
}

/** 3 thẻ cuối trang chủ điện thoại: Thử thách tuần · Bảng xếp hạng · Tạo cửa hàng 3D. */
export function MobileShortcutCards() {
  const t = useTranslations('home.extras');
  const items = [
    { href: '/su-kien', title: t('challengeTitle'), text: t('challengeMini'), img: '/images/ic-gift.webp', tone: 'from-primary-soft to-surface' },
    { href: '/bang-xep-hang', title: t('rankTitle'), text: t('rankMini'), img: '/images/ic-trophy.webp', tone: 'from-gold-soft to-surface' },
    { href: '/tao-diem', title: t('storeTitle'), text: t('storeMini'), img: '/images/cua-hang-mau.webp', tone: 'from-story-soft to-surface' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 md:hidden">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={cn('relative flex min-h-36 flex-col gap-1 overflow-hidden rounded-2xl bg-linear-to-b p-2.5 shadow-card ring-1 ring-border/60', i.tone)}>
          <span className="font-display text-sm font-extrabold leading-tight text-ink">{i.title}</span>
          <span className="text-[0.68rem] font-medium leading-tight text-ink">{i.text}</span>
          <img src={i.img} alt="" aria-hidden className="mt-auto size-14 self-end object-contain" draggable={false} />
        </Link>
      ))}
    </div>
  );
}

