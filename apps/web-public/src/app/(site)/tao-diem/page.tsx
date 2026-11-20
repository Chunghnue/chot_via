'use client';

import { selectIsMember, useGetMyPlacesQuery } from '@chot-via/api-client';
import { Badge, Button, Card, PlaceIllustration, Skeleton } from '@chot-via/ui';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { PlaceForm } from '@/components/place/place-form';
import { loginRequested } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

function MyPlaces() {
  const t = useTranslations('place');
  const { data, isLoading } = useGetMyPlacesQuery();
  if (isLoading) return <Skeleton className="h-24" />;
  if (!data || data.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-extrabold">{t('form.myPlacesTitle')}</h2>
      {data.map((p) => (
        <Link key={p.id} href={`/diem/${p.slug}/cai-dat`}>
          <Card className="flex items-center gap-3 p-3 hover:bg-surface-muted">
            <span className="w-20 shrink-0 rounded-xl bg-linear-to-b from-scene-sky to-scene-ground p-1"><PlaceIllustration modelKey={p.modelKey} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate font-display text-lg font-bold">{p.title}</span><span className="text-xs text-ink-muted">{p.categoryName} · {t(`kind.${p.kind}`)}</span></span>
            <Badge tone="success">{p.wishCount} 🙏</Badge>
          </Card>
        </Link>
      ))}
    </section>
  );
}

/** Tạo cửa hàng/văn phòng 3D: màn giới thiệu ai cũng xem được; chỉ yêu cầu đăng nhập khi bấm tạo (FR-10, FR-11). */
export default function CreatePlacePage() {
  const t = useTranslations('place.form');
  const dispatch = useAppDispatch();
  const isMember = useAppSelector(selectIsMember);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const perks = [t('perk1'), t('perk2'), t('perk3'), t('perk4')];

  const start = (): void => {
    if (!isMember) { dispatch(loginRequested('place')); return; }
    setShowForm(true);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Card className="overflow-hidden">
        <div className="bg-linear-to-b from-primary-soft to-surface px-5 pb-2 pt-6 text-center">
          <h1 className="font-display text-3xl font-extrabold text-primary-strong">{t('heroTitle')}</h1>
          <img src="/images/cua-hang-mau.webp" alt="" aria-hidden className="mx-auto mt-2 w-full max-w-xs object-contain drop-shadow-lg" draggable={false} />
        </div>
        <div className="flex flex-col gap-3 p-5">
          <ul className="flex flex-col gap-2">
            {perks.map((text) => (
              <li key={text} className="flex items-center gap-2.5 text-base font-semibold text-ink"><Check className="size-5 shrink-0 rounded-full bg-primary p-0.5 text-on-primary" aria-hidden />{text}</li>
            ))}
          </ul>
          <Button size="lg" className="w-full bg-linear-to-b from-primary to-primary-strong font-bold" onClick={start}>{t('heroCta')}</Button>
          {isMember ? null : <p className="text-center text-xs text-ink-muted">{t('loginHint')}</p>}
        </div>
      </Card>
      {isMember ? <MyPlaces /> : null}
      {isMember && showForm ? <div ref={formRef}><Card className="p-5"><h2 className="mb-3 font-display text-xl font-extrabold">{t('createTitle')}</h2><PlaceForm /></Card></div> : null}
    </div>
  );
}
