'use client';

import { useGetEventsQuery, useGetHomeQuery, useGetLeaderboardQuery, useGetMissionsQuery } from '@chot-via/api-client';
import { Avatar, Card, Skeleton, buttonClass, cn, compactCount } from '@chot-via/ui';
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
    // Máy tính (ảnh thiết kế): thẻ kem vàng, Thần Tài nằm gọn bên trái, tiêu đề đỏ + "Nhận lộc hôm nay" + nút xanh "Xin vía ngay →" bên phải.
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-linear-to-br from-gold-soft via-surface to-gold-soft p-3 shadow-card ring-1 ring-gold/40">
        <img src="/images/than-tai-bay.webp" alt="" aria-hidden className="h-[6.5rem] w-auto shrink-0 select-none object-contain drop-shadow" draggable={false} />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
          <span className="font-display text-[1.05rem] font-extrabold italic leading-tight text-wish-strong">{t('deityTitle')}</span>
          <span className="text-xs font-semibold leading-snug text-ink">{t('deityTodayHint')}</span>
          <button type="button" onClick={() => dispatch(wishRequested())} aria-label={t('deityTitle')}
            className="mt-1 inline-flex h-10 w-full items-center justify-center gap-1 whitespace-nowrap rounded-full btn-glossy px-3 text-sm font-bold text-on-primary shadow-card ring-2 ring-surface transition hover:brightness-105 active:scale-95">{t('wishNow')}<ArrowRight className="size-5 shrink-0" strokeWidth={2.2} aria-hidden /></button>
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
    <Card className="flex flex-col gap-3 bg-linear-to-b from-surface to-primary-soft/40 p-4 ring-1 ring-surface">
      <div className="flex items-center gap-3">
        <img src="/images/ic-fire.webp" alt="" aria-hidden className="size-12 shrink-0 object-contain drop-shadow" draggable={false} />
        <h2 className="whitespace-nowrap font-display text-xl font-extrabold text-primary-strong">{t('challengeTitle')}</h2>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-[0.88rem] font-semibold leading-snug text-ink">{t('challengeSub')}</p>
        <span className="relative shrink-0">
          <img src="/images/ic-crown.webp" alt="" aria-hidden className="size-16 object-contain drop-shadow-md" draggable={false} />
          <img src="/images/ic-sparkles.webp" alt="" aria-hidden className="absolute -left-3 top-0 size-6 object-contain" draggable={false} />
          <img src="/images/ic-coin.webp" alt="" aria-hidden className="absolute -right-2 bottom-0 size-6 object-contain" draggable={false} />
        </span>
      </div>
      {isLoading || !mounted ? <Skeleton className="h-24" /> : (
        <ul className="flex flex-col gap-2">
          {(data ?? []).slice(0, 3).map((m) => {
            const done = m.progress !== null && m.progress >= m.target;
            return (
              <li key={m.id} className="flex items-center gap-2 rounded-2xl bg-surface px-2 py-2 shadow-card ring-1 ring-border/40">
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-full ring-2 ring-surface', done ? 'bg-linear-to-b from-sign-check to-sign-check-dark text-on-primary' : 'bg-linear-to-b from-sign-check to-sign-check-dark text-on-primary')}><Check className="size-4" strokeWidth={3.5} aria-hidden /></span>
                <span className="min-w-0 flex-1 text-[0.78rem] font-semibold leading-tight text-ink">{m.name}</span>
                <span className="shrink-0 whitespace-nowrap text-[0.78rem] font-extrabold text-primary">{m.rewardPoints > 0 ? t('rewardPoints', { points: m.rewardPoints }) : `${Math.min(m.progress ?? 0, m.target)}/${m.target}`}</span>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/su-kien" className={cn(buttonClass({ variant: 'primary', size: 'lg' }), 'mt-1 w-full btn-glossy text-lg font-bold')}>{t('joinNow')}<ArrowRight className="size-5 shrink-0" strokeWidth={2.2} aria-hidden /></Link>
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
      <Link href="/tao-diem" className={cn(buttonClass({ variant: 'primary', size: 'lg' }), 'mt-1 w-full btn-glossy text-lg font-bold')}>{tn('createStoreCta')}<ArrowRight className="size-5 shrink-0" strokeWidth={2.2} aria-hidden /></Link>
    </Card>
  );
}

/** Làm nổi số tiền (ví dụ "1.000.000đ") trong mô tả sự kiện bằng chữ đỏ đậm như ảnh thiết kế. */
function highlightMoney(text: string): React.ReactNode[] {
  return text.split(/(\d[\d.,]*\s?đ)/).map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-extrabold text-wish-strong">{part}</strong> : part));
}

/** Tách tiêu đề sự kiện thành hai dòng: phần đầu ("Thử thách") và phần trong ngoặc kép ("Chốt Deal Tháng Vàng"). */
function splitEventTitle(title: string): [string, string] {
  const i = title.indexOf('“');
  return i > 0 ? [title.slice(0, i).trim(), title.slice(i)] : [title, ''];
}

/** "Sự kiện nổi bật" (cột phải máy tính): sự kiện đang diễn ra, nút trái/phải tròn trắng ở hai mép và chấm chỉ vị trí khi có nhiều hơn một. */
export function FeaturedEventCard() {
  const t = useTranslations('home.extras');
  const { data, isLoading } = useGetEventsQuery();
  const [index, setIndex] = useState(0);
  const mounted = useMounted();
  if (isLoading || !mounted) return <Skeleton className="h-44" />;
  if (!data || data.length === 0) return null;
  const at = index % data.length;
  const event = data[at];
  if (!event) return null;
  const step = (d: number): void => setIndex((i) => (i + d + data.length) % data.length);
  const [lead, quoted] = splitEventTitle(event.title);
  const arrow = 'absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-card ring-1 ring-border/60 transition hover:bg-surface-muted active:scale-90';
  return (
    <Card className="flex flex-col gap-2.5 p-4">
      <h2 className="flex items-center gap-2 text-[1.1rem] font-extrabold text-ink"><img src="/images/ic-gift.webp" alt="" aria-hidden className="size-8 object-contain" draggable={false} />{t('eventsTitle')}</h2>
      <div className="relative">
        {data.length > 1 ? <>
          <button type="button" onClick={() => step(-1)} aria-label={t('prev')} className={cn(arrow, '-left-3')}><ChevronLeft className="size-4" strokeWidth={3} aria-hidden /></button>
          <button type="button" onClick={() => step(1)} aria-label={t('next')} className={cn(arrow, '-right-3')}><ChevronRight className="size-4" strokeWidth={3} aria-hidden /></button>
        </> : null}
        <div className="relative flex min-h-40 flex-col items-center justify-center gap-1 rounded-2xl bg-linear-to-r from-event-from to-event-to px-3 pb-3 pt-4 text-center shadow-[inset_0_0_0_1px_rgb(255_255_255/0.6)]">
          <img src="/images/ic-gift.webp" alt="" aria-hidden className="pointer-events-none absolute right-[2%] top-[6%] w-[31%] rotate-6 object-contain drop-shadow-md" draggable={false} />
          <div className="flex w-[70%] flex-col items-center gap-0.5 self-start">
            <p className="text-[0.95rem] font-extrabold leading-tight text-wish-strong">{lead}{quoted ? <><br /><span className="whitespace-nowrap text-[0.82rem]">{quoted}</span></> : null}</p>
            {event.description ? <p className="mt-0.5 text-[0.74rem] font-semibold leading-snug text-ink">{highlightMoney(event.description)}</p> : null}
          </div>
          <Link href="/su-kien" className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'mt-2 w-[72%] btn-glossy text-[0.88rem] font-bold')}>{t('joinNow')}<ArrowRight className="size-5 shrink-0" strokeWidth={2.2} aria-hidden /></Link>
        </div>
      </div>
      {data.length > 1 ? (
        <div className="flex justify-center gap-2" aria-hidden>{data.map((e, i) => <span key={e.id} className={cn('size-2 rounded-full', i === at ? 'bg-primary' : 'bg-border')} />)}</div>
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
    <Card className="flex flex-col gap-2.5 p-4">
      <h2 className="flex items-center gap-2 whitespace-nowrap text-[1.1rem] font-extrabold text-ink">
        <svg viewBox="0 0 64 40" className="h-7 w-11 shrink-0" aria-hidden>
          <g className="fill-primary-bright">
            <circle cx="32" cy="10" r="8" /><path d="M16 38c0-9 7-15 16-15s16 6 16 15z" />
            <circle cx="11" cy="15" r="6" className="fill-primary" /><path d="M0 38c0-7 5-12 11-12 3 0 5 1 7 2-3 3-5 6-5 10z" className="fill-primary" />
            <circle cx="53" cy="15" r="6" className="fill-primary" /><path d="M64 38c0-7-5-12-11-12-3 0-5 1-7 2 3 3 5 6 5 10z" className="fill-primary" />
          </g>
        </svg>
        <span>{t('communityPrefix')} <span className="text-primary-strong">{t('communityBrand')}</span></span>
      </h2>
      {members > 0 ? <p className="flex items-center gap-1.5 pl-1 text-sm font-bold text-ink"><img src="/images/ic-laugh.webp" alt="" aria-hidden className="size-5 object-contain" draggable={false} />{t('members', { count: members.toLocaleString('vi-VN') })}</p> : null}
      <div className="flex items-center justify-between gap-1.5 py-1">
        {(board?.items ?? []).slice(0, 5).map((m) => <Avatar key={m.user.id} src={m.user.avatarUrl} name={m.user.displayName} size={34} />)}
        {members > 5 ? <span className="grid size-[2.125rem] shrink-0 place-items-center rounded-full bg-info-soft text-xs font-bold text-ink">+{compactCount(members - 5).toUpperCase()}</span> : null}
      </div>
      <p className="text-center text-sm font-medium leading-snug text-ink">{t('communityText')}</p>
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

