'use client';

import { useFollowPlaceMutation, useGetPlaceQuery, useGetPostsQuery, useGetProfileQuery, useLikePlaceMutation, useVisitPlaceMutation } from '@chot-via/api-client';
import { ShareButtons } from '@/components/common/share-buttons';
import { Avatar, Badge, Button, Card, EmptyState, IconButton, Skeleton, Tabs, cn, compactCount, toast } from '@chot-via/ui';
import { ArrowLeft, Crown, Heart, Settings, Share2, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { FeedList } from '@/components/post/feed';
import { placeSheetOpened } from '@/features/ui/uiSlice';
import { track } from '@/lib/analytics';
import { useApiToast } from '@/lib/use-api-toast';
import { useRequireMember } from '@/lib/use-member';
import { useAppDispatch } from '@/store/hooks';
import { SHOP_IMAGES } from '@chot-via/ui';

type Tab = 'feed' | 'about' | 'photos' | 'achievements';
const TABS: readonly Tab[] = ['feed', 'about', 'photos', 'achievements'];

function PhotoGrid({ ownerId }: { ownerId: string }) {
  const t = useTranslations('place');
  const { data, isLoading } = useGetPostsQuery({ authorId: ownerId, has: 'photo', pageSize: 12 });
  if (isLoading) return <Skeleton className="h-40" />;
  const photos = data?.items.flatMap((p) => p.media.map((m) => ({ id: m.id, url: m.url, postId: p.id }))) ?? [];
  if (photos.length === 0) return <EmptyState icon="🖼️" title={t('noPhotos')} />;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((m) => (
        <Link key={m.id} href={`/bai/${m.postId}`} className="block overflow-hidden rounded-2xl bg-surface-muted">
          <img src={m.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        </Link>
      ))}
    </div>
  );
}

/** Trang cửa hàng/văn phòng sale (công khai): ảnh bìa lớn, nút nổi Thích · Gửi vía · Theo dõi, thẻ chủ cửa hàng, 4 tab. */
export default function PlacePage() {
  const t = useTranslations('place');
  const tp = useTranslations('post');
  const tc = useTranslations('common');
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toastApi = useApiToast();
  const { require } = useRequireMember();
  const { data: place, isLoading, isError } = useGetPlaceQuery(slug);
  const { data: owner } = useGetProfileQuery(place?.owner?.id ?? '', { skip: !place?.owner });
  const [visit] = useVisitPlaceMutation();
  const [like] = useLikePlaceMutation();
  const [follow] = useFollowPlaceMutation();
  const [tab, setTab] = useState<Tab>('feed');
  const visited = useRef(false);

  useEffect(() => {
    if (place && !visited.current) {
      visited.current = true;
      void visit(place.slug);
      track('place_visit', { place_id: place.id, mode: '2d' });
    }
  }, [place, visit]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !place) return <EmptyState icon="🏚️" title={t('notFound')} />;

  const toggle = (kind: 'like' | 'follow'): void => {
    if (!require(kind)) return;
    const on = kind === 'like' ? !place.viewer?.liked : !place.viewer?.following;
    void (kind === 'like' ? like({ id: place.id, on }) : follow({ id: place.id, on })).unwrap().catch(toastApi.error);
  };
  const share = async (): Promise<void> => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') await navigator.share({ url, title: place.title });
      else { await navigator.clipboard.writeText(url); toast.success(t('linkCopied')); }
    } catch { /* người dùng hủy chia sẻ */ }
  };
  const ownerRole = place.owner?.memberRole ? tp(`roles.${place.owner.memberRole}`) : null;
  const fab = 'flex size-14 flex-col items-center justify-center gap-0.5 rounded-full bg-surface/95 text-[0.62rem] font-bold leading-none text-ink shadow-card transition active:scale-95';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <IconButton label={t('back')} onClick={() => router.back()} className="text-ink">
          <ArrowLeft className="size-6" aria-hidden />
        </IconButton>
        <h1 className="min-w-0 truncate font-display text-xl font-extrabold text-ink sm:text-2xl">{place.title}</h1>
        {ownerRole ? (
          <Badge tone="owner" className="shrink-0 whitespace-nowrap">
            {place.owner?.memberRole === 'owner' ? <Crown className="size-3" aria-hidden /> : null}
            {ownerRole}
          </Badge>
        ) : null}
        <IconButton label={t('share')} onClick={() => void share()} className="ml-auto text-ink">
          <Share2 className="size-5" aria-hidden />
        </IconButton>
        {place.viewer?.isOwner ? (
          <Link href={`/diem/${place.slug}/cai-dat`} aria-label={t('settings')} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-muted">
            <Settings className="size-5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sheet bg-linear-to-b from-scene-sky to-scene-ground sm:aspect-[16/10] md:aspect-[16/9]">
          <img
            src={place.coverUrl ?? SHOP_IMAGES[place.modelKey]}
            alt={place.title}
            className={cn('size-full select-none', place.coverUrl ? 'object-cover' : 'object-contain p-6')}
            draggable={false}
            fetchPriority="high"
          />
          {place.isDemo ? (
            <Badge tone="gold" className="absolute left-3 top-3">
              {tc('demoLabel')}
            </Badge>
          ) : null}
        </div>
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
          <button type="button" className={fab} onClick={() => toggle('like')} aria-pressed={place.viewer?.liked === true}>
            <Heart className={cn('size-6', place.viewer?.liked ? 'fill-wish text-wish' : 'fill-wish/90 text-wish')} aria-hidden />
            {t('likeShort')} {compactCount(place.likeCount)}
          </button>
          <button type="button" className={fab} onClick={() => dispatch(placeSheetOpened({ placeId: place.id, step: 'wish' }))}>
            <img src="/images/logo-than-tai.webp" alt="" aria-hidden className="size-6 object-contain" draggable={false} />
            {t('wishShort')}
          </button>
          <button type="button" className={fab} onClick={() => toggle('follow')} aria-pressed={place.viewer?.following === true}>
            {place.viewer?.following ? <UserCheck className="size-6 text-primary-strong" aria-hidden /> : <UserPlus className="size-6" aria-hidden />}
            {place.viewer?.following ? t('followingShort') : t('followShort')}
          </button>
        </div>
      </div>

      <Card className="relative z-10 -mt-14 mx-2 p-4 sm:mx-6 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar src={place.owner?.avatarUrl ?? null} name={place.owner?.displayName ?? place.title} size={64} className="ring-4 ring-surface" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-extrabold text-ink sm:text-2xl">{place.title}</h2>
            <p className="truncate text-sm text-ink-muted">
              {place.categoryName}
              {place.province ? ` · ${place.province}` : ''}
            </p>
          </div>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => dispatch(placeSheetOpened({ placeId: place.id, step: 'wish' }))}>
            <span aria-hidden>🙏</span>
            {place.kind === 'sale_office' ? t('sendWishOffice') : t('sendWishPlace')}
          </Button>
        </div>
        <ShareButtons className="mt-3" text={place.title} card={{ kind: 'visit', link: typeof window === 'undefined' ? '' : window.location.href }} />
        <dl className="mt-4 grid grid-cols-3 divide-x divide-border text-center">
          {(
            [
              ['wishes', compactCount(place.wishCount).toUpperCase()],
              ['followers', compactCount(place.followCount).toUpperCase()],
              ['posts', String(owner?.counts.posts ?? 0)],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="px-2">
              <dd className="font-display text-2xl font-extrabold text-ink">{v}</dd>
              <dt className="text-xs text-ink-muted">{t(`pageStats.${k}`)}</dt>
            </div>
          ))}
        </dl>
      </Card>

      <Tabs variant="underline" value={tab} onChange={setTab} items={TABS.map((k) => ({ key: k, label: t(`tabs.${k}`) }))} />

      {tab === 'feed' ? place.owner ? <FeedList variant="wide" query={{ authorId: place.owner.id }} /> : <EmptyState icon="📝" title={t('noPosts')} /> : null}
      {tab === 'about' ? (
        <Card className="flex flex-col gap-2 p-5 text-ink-muted">
          {place.tagline ? <p className="font-semibold text-ink">{place.tagline}</p> : null}
          <p>{place.description ?? t('noDescription')}</p>
          {place.autoReplyEnabled ? (
            <Badge tone="info" className="w-fit">
              {t('reply.autoLabel')}
            </Badge>
          ) : null}
        </Card>
      ) : null}
      {tab === 'photos' ? place.owner ? <PhotoGrid ownerId={place.owner.id} /> : <EmptyState icon="🖼️" title={t('noPhotos')} /> : null}
      {tab === 'achievements' ? (
        place.owner ? (
          <FeedList variant="wide" query={{ authorId: place.owner.id, type: 'brag' }} />
        ) : (
          <EmptyState icon="🏆" title={t('noAchievements')} />
        )
      ) : null}
    </div>
  );
}
