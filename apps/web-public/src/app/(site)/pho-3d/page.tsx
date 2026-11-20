'use client';

import { selectIsMember, useGetCatalogQuery, useGetHomeQuery, useGetPlacesQuery, useLazyGetRandomPlaceQuery } from '@chot-via/api-client';
import { Button, Chip, EmptyState, Skeleton, Tabs, cn } from '@chot-via/ui';
import { Dices, List, Search } from 'lucide-react';
import { DEFAULT_HOME_CONFIG } from '@chot-via/shared';
import { GlbStreetView } from '@chot-via/scene-3d';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';
import { ShopLabelStrip, StreetStage } from '@/components/home/street-stage';
import { PlaceGrid } from '@/components/place/place-list';
import { useGlbLabels, useStreetLabels } from '@/components/place/use-street-labels';
import { categoryChanged, placeFocused, searchChanged, selectStreet, tabChanged, type StreetTab } from '@/features/street/streetSlice';
import { placeSheetOpened, wishDialogToggled, loginRequested } from '@/features/ui/uiSlice';
import { useWishTitle } from '@/features/wish/use-deity-wish';
import { useApiToast } from '@/lib/use-api-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const TABS: StreetTab[] = ['walk', 'friends', 'top'];

/** Phố 3D: đi dạo, ghé điểm, gửi vía. Tìm kiếm/lọc cửa hàng & văn phòng sale nằm ngay tại đây (không có trang Khám phá). */
export default function StreetPage() {
  const t = useTranslations('street');
  const th = useTranslations('home');
  const tw = useTranslations('wish');
  const { titleCode } = useWishTitle();
  const dispatch = useAppDispatch();
  const street = useAppSelector(selectStreet);
  const isMember = useAppSelector(selectIsMember);
  const labels = useStreetLabels();
  const glbLabels = useGlbLabels();
  const { data: home } = useGetHomeQuery();
  const [mode, setMode] = useState<'3d' | 'image'>('3d');
  const toast = useApiToast();
  const { data: catalog } = useGetCatalogQuery();
  const [text, setText] = useState(street.search);
  const [showList, setShowList] = useState(false);
  const [fetchRandom] = useLazyGetRandomPlaceQuery();

  useEffect(() => {
    const id = window.setTimeout(() => dispatch(searchChanged(text.trim())), 300);
    return () => window.clearTimeout(id);
  }, [text, dispatch]);

  const skip = street.tab === 'friends' && !isMember;
  const { data, isFetching } = useGetPlacesQuery({
    pageSize: 50, sort: street.tab === 'top' ? 'top' : 'street', scope: street.tab === 'friends' ? 'following' : 'all',
    ...(street.search ? { search: street.search } : {}), ...(street.categoryId ? { categoryId: street.categoryId } : {}),
  }, { skip });
  const places = useMemo(() => data?.items ?? [], [data]);
  const filtering = street.search !== '' || street.categoryId !== null || street.tab !== 'walk';

  const visibleIds = useMemo(() => (filtering ? new Set(places.map((p) => p.id)) : null), [filtering, places]);
  const select = (id: string): void => { dispatch(placeFocused(id)); dispatch(placeSheetOpened({ placeId: id })); };
  const random = async (): Promise<void> => {
    try { const place = await fetchRandom().unwrap(); select(place.id); } catch (e) { toast.error(e); }
  };

  const imageStage = (
    <StreetStage
      places={places} labels={labels} dimMissing={filtering} selectedId={street.selectedId}
      onSelectPlace={select} onSelectDeity={() => dispatch(wishDialogToggled(true))}
    >
      <p className="pointer-events-none absolute left-1/2 top-[5%] -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-[1.6cqw] py-[0.5cqw] text-[clamp(0.7rem,1.6cqw,1.3rem)] font-bold text-primary-strong shadow-card">{th('heroSubtitle')}</p>
    </StreetStage>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-card bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto font-display text-2xl font-extrabold text-primary-strong">{t('title')}</h1>
          <Button variant="wish" size="sm" onClick={() => dispatch(wishDialogToggled(true))}><span aria-hidden>🙏</span>{t('deity')}</Button>
          <Button variant="soft" size="sm" onClick={() => void random()}><Dices className="size-4" aria-hidden />{t('random')}</Button>
        </div>
        <label className="relative block">
          <span className="sr-only">{t('searchPlaceholder')}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('searchPlaceholder')} className="h-11 w-full rounded-full border border-transparent bg-search-bg pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary focus:bg-surface" />
        </label>
        <Tabs variant="chips" value={street.tab} items={TABS.map((tab) => ({ key: tab, label: t(`tabs.${tab}`) }))} onChange={(tab) => {
          if (tab === 'friends' && !isMember) { dispatch(loginRequested('follow')); return; }
          dispatch(tabChanged(tab));
        }} />
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <Chip active={street.categoryId === null} onClick={() => dispatch(categoryChanged(null))}>{t('all')}</Chip>
          {catalog?.categories.map((c) => <Chip key={c.id} active={street.categoryId === c.id} onClick={() => dispatch(categoryChanged(street.categoryId === c.id ? null : c.id))}>{c.name}</Chip>)}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] 3xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="relative min-w-0">
          {skip ? <EmptyState icon="👥" title={t('friendsLogin')} /> : isFetching && !data ? <Skeleton className="h-[60dvh]" /> : places.length === 0 ? <EmptyState icon="🔎" title={street.tab === 'friends' ? t('friendsEmpty') : t('empty')} /> : (
            <div className="min-w-0 overflow-hidden rounded-sheet bg-surface-muted shadow-card">
              <ShopLabelStrip places={places} labels={labels} onSelectPlace={select} className="border-b border-border/60" />
            <div className="relative aspect-[10/9] w-full overflow-hidden bg-surface-muted sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[2.2/1] xl:aspect-[2.5/1]">
              {mode === '3d' && home ? (
                <GlbStreetView
                  className="absolute inset-0" config={home.layout.config ?? DEFAULT_HOME_CONFIG} slots={home.layout.street} labels={glbLabels}
                  selectedPlaceId={street.selectedId} visiblePlaceIds={visibleIds} onSelectPlace={select} onSelectDeity={() => dispatch(wishDialogToggled(true))}
                  fallback={imageStage}
                />
              ) : imageStage}
              {mode === '3d' ? (
                <div className="absolute bottom-0 left-0 z-20">
                  {places.map((p, i) => (
                    <button key={p.id} type="button" onClick={() => select(p.id)} className="absolute bottom-0 size-1 opacity-0 focus:size-auto focus:opacity-100" style={{ left: `${i * 4}px` }}>{labels.open(p.title)}</button>
                  ))}
                </div>
              ) : null}
              <Button type="button" variant="soft" size="sm" aria-pressed={mode === '3d'} onClick={() => setMode((m) => (m === '3d' ? 'image' : '3d'))} className="absolute left-3 top-3 z-10 shadow-card">
                {mode === '3d' ? th('backToImage') : t('scene.view3d')}
              </Button>
              <div className="pointer-events-none absolute inset-x-0 bottom-[7%] flex justify-center px-3 md:bottom-[10%]">
                <Button variant="wish" size="lg" className="pointer-events-auto animate-glow h-12 px-8 text-xl shadow-cta md:h-14 md:px-12 md:text-2xl" onClick={() => dispatch(wishDialogToggled(true))}>
                  <span aria-hidden>🙏</span>{tw(`title.${titleCode}`)}
                </Button>
              </div>
            </div>
            </div>
          )}
          <p className="mx-auto mt-2 w-fit max-w-full rounded-full bg-surface px-4 py-1 text-center text-xs font-semibold text-ink-muted shadow-card">{t('hint')}</p>
        </div>
        <div className="flex flex-col gap-2 lg:max-h-[calc(100dvh-21rem)] lg:overflow-y-auto">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowList((v) => !v)}><List className="size-4" aria-hidden />{t('list')} ({places.length})</Button>
          <div className={cn(showList ? 'block' : 'hidden', 'lg:block')}><PlaceGrid places={places} onSelect={select} /></div>
        </div>
      </div>
    </div>
  );
}
