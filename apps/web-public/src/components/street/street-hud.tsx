'use client';

import { selectIsMember, useFollowPlaceMutation, useGetMeStatsQuery, useGetMissionsQuery, useGetPostsQuery } from '@chot-via/api-client';
import type { PlaceSummary } from '@chot-via/shared';
import { Avatar, Button, Card, Skeleton, buttonClass, cn, compactCount, toast } from '@chot-via/ui';
import { ArrowRight, Check, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { ChallengeTasks, FeaturedEventCard } from '@/components/home/home-extras';
import { WeeklyBoard } from '@/components/rail/weekly-board';
import { composerOpened } from '@/features/composer/composerSlice';
import { useRitual } from '@/features/ritual/use-ritual';
import { loginRequested, wishRequested } from '@/features/ui/uiSlice';
import { useMounted } from '@/lib/use-mounted';
import { useCurrentUser, useRequireMember } from '@/lib/use-member';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const round = 'grid size-10 place-items-center rounded-full bg-surface/90 text-ink shadow-card backdrop-blur transition active:scale-95 disabled:opacity-50';

/** Badge "N lượt xin vía" (số thật từ thống kê) và bong bóng tên cửa hàng nổi bật, đặt trên cảnh phố. */
export function StreetBadges({ wishesTotal, place }: { wishesTotal: number | null; place: PlaceSummary | null }) {
  const t = useTranslations('street.hud');
  return (
    <>
      {wishesTotal !== null ? (
        <p className="pointer-events-none absolute right-3 top-3 z-10 hidden items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-sm font-bold text-ink shadow-card xl:flex">
          <span aria-hidden>🔥</span>
          {t('wishersBadge', { count: compactCount(wishesTotal) })}
        </p>
      ) : null}
      {place ? (
        <p className="pointer-events-none absolute left-4 top-16 z-10 hidden max-w-60 items-center gap-2 rounded-2xl bg-surface/95 px-3 py-2 text-sm font-bold text-ink shadow-card xl:flex">
          <span className="min-w-0 flex-1">
            <span className="block truncate">{place.title}</span>
            <span className="block text-xs font-semibold text-danger">
              <span aria-hidden>🔥 </span>
              {t('bubbleWish', { count: compactCount(place.wishCount) })}
            </span>
          </span>
        </p>
      ) : null}
    </>
  );
}

/** Nút toàn màn hình của cảnh phố (máy tính). Không còn nút xoay / phóng to / thu nhỏ: kéo để xoay, chụm hoặc Ctrl+cuộn để phóng to. */
export function StreetControls({ fullscreen, onFullscreen }: { fullscreen: boolean; onFullscreen: () => void }) {
  const t = useTranslations('street.hud');
  return (
    <div className="absolute right-3 top-1/3 z-10 hidden xl:block">
      <button type="button" aria-label={fullscreen ? t('exitFullscreen') : t('fullscreen')} onClick={onFullscreen} className={round}>
        {fullscreen ? <Minimize2 className="size-5" aria-hidden /> : <Maximize2 className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

/** Hàng ô lối tắt nằm đáy cảnh phố (máy tính): Kể khổ · Khoe doanh thu · Đốt vía · Thỉnh Thần Tài (luôn hiện; chưa đăng nhập thì mời đăng nhập) · Tạo cửa hàng 3D · BXH · Thử thách. */
export function StreetTiles() {
  const t = useTranslations('street.hud.tiles');
  const dispatch = useAppDispatch();
  const { request } = useRitual();
  // Kiểu ô theo ảnh thiết kế trang chủ: viên thuốc bo tròn, nền trắng ngả tím nhạt có viền sáng, biểu tượng lớn bên trái, chữ đậm.
  const tile =
    'flex h-16 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-br from-surface via-surface to-story-soft px-2.5 text-left font-display text-[0.98rem] font-extrabold leading-tight text-ink shadow-[0_6px_14px_rgb(60_40_120/0.18)] ring-2 ring-surface/90 transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgb(60_40_120/0.26)] active:scale-95';
  const img = (src: string) => <img src={src} alt="" aria-hidden className="size-9 shrink-0 object-contain drop-shadow" draggable={false} />;
  return (
    <div className="absolute inset-x-4 bottom-3 z-10 hidden gap-2 xl:flex">
      <button type="button" className={tile} onClick={() => dispatch(composerOpened({ kind: 'story' }))}>
        {img('/images/ic-laugh.webp')}
        <span className="min-w-0 leading-tight">{t('story')}</span>
      </button>
      <button type="button" className={tile} onClick={() => dispatch(composerOpened({ kind: 'brag' }))}>
        {img('/images/ic-trophy.webp')}
        <span className="min-w-0 leading-tight">{t('brag')}</span>
      </button>
      <button type="button" className={tile} onClick={() => void request('burn')}>
        {img('/images/ic-fire.webp')}
        <span className="min-w-0 leading-tight">{t('send')}</span>
      </button>
      <button type="button" className={tile} onClick={() => void request('invoke')}>
        {img('/images/ic-pray.webp')}
        <span className="min-w-0 leading-tight">{t('receive')}</span>
      </button>
      <Link href="/tao-diem" className={tile}>
        {img('/images/ic-home.webp')}
        <span className="min-w-0 leading-tight">{t('create')}</span>
      </Link>
      <Link href="/bang-xep-hang" className={tile}>
        {img('/images/ic-crown.webp')}
        <span className="min-w-0 leading-tight">{t('rank')}</span>
      </Link>
      <Link href="/su-kien" className={tile}>
        {img('/images/ic-medal-1.webp')}
        <span className="min-w-0 leading-tight">{t('challenge')}</span>
      </Link>
    </div>
  );
}

/** Thẻ chi tiết cửa hàng (cột phải): cửa hàng đang chọn hoặc cửa hàng nhiều vía nhất. */
export function ShopPanel({ place, onOpen }: { place: PlaceSummary | null; onOpen: (id: string) => void }) {
  const t = useTranslations('street.hud.shop');
  const { require } = useRequireMember();
  const [follow, { isLoading }] = useFollowPlaceMutation();
  if (!place) return null;
  const doFollow = (): void => {
    if (!require('follow')) return;
    void follow({ id: place.id, on: true }).unwrap().then(() => toast.success(t('followed'))).catch(() => undefined);
  };
  return (
    <Card className="overflow-hidden">
      <img src={place.coverUrl ?? '/images/bia-quan-cafe.webp'} alt="" aria-hidden className="h-36 w-full object-cover" draggable={false} />
      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-extrabold text-ink">{place.title}</h2>
          <p className="text-xs font-semibold text-ink-muted">{place.isDemo ? t('demo') : place.categoryName}</p>
        </div>
        <p className="flex items-center gap-4 text-sm font-bold text-ink">
          <span>
            <span aria-hidden>🔥 </span>
            {t('wishes', { count: compactCount(place.wishCount) })}
          </span>
          <span>{t('visits', { count: compactCount(place.visitCount) })}</span>
        </p>
        <Button variant="primary" size="md" onClick={() => onOpen(place.id)}>
          <span aria-hidden>🙏</span>
          {t('send')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled={isLoading} onClick={doFollow}>
            {t('follow')}
          </Button>
          <Link href={`/diem/${place.slug}`} className={cn(buttonClass({ variant: 'outline', size: 'sm' }), 'flex-1')}>
            {t('more')}
          </Link>
        </div>
      </div>
    </Card>
  );
}

/** Khối "Thần Tài trao vía!" (cột phải). */
export function DeityPanel() {
  const t = useTranslations('street.hud.deityCard');
  const dispatch = useAppDispatch();
  return (
    <Card className="flex items-center gap-2 overflow-hidden bg-linear-to-br from-gold-soft via-wish-soft to-gold-soft p-3 ring-1 ring-gold/40">
      <img src="/images/than-tai-nhan-via.webp" alt="" aria-hidden className="size-28 shrink-0 object-contain" draggable={false} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-center">
        <h2 className="font-display text-lg font-extrabold text-wish-strong">{t('title')}</h2>
        <p className="whitespace-pre-line text-sm font-semibold leading-snug text-ink">{t('text')}</p>
        <Button variant="primary" size="sm" onClick={() => dispatch(wishRequested())}>{t('cta')}</Button>
      </div>
    </Card>
  );
}

/** Bản đồ phố thu nhỏ vẽ từ vị trí các ô cửa hàng thật trong cấu hình (nhìn từ trên xuống). */
function MiniMap({ points }: { points: { x: number; z: number }[] }) {
  const t = useTranslations('street.hud.daily');
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x); const zs = points.map((p) => p.z);
  const minX = Math.min(...xs, 0) - 4; const maxX = Math.max(...xs, 0) + 4; const minZ = Math.min(...zs, 0) - 4; const maxZ = Math.max(...zs, 0) + 4;
  return (
    <svg role="img" aria-label={t('map')} viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`} className="h-24 w-full rounded-xl bg-primary-soft">
      <circle cx={0} cy={0} r={2.2} className="fill-gold" />
      {points.map((p, i) => <rect key={i} x={p.x - 1.8} y={p.z - 1.4} width={3.6} height={2.8} rx={0.6} className="fill-danger" />)}
    </svg>
  );
}

/** Khối "Ghé phố hôm nay": bản đồ thu nhỏ + tiến độ nhiệm vụ (dữ liệu nhiệm vụ thật). Chỉ theo dõi tiến độ, không cộng điểm (quyết định #18). */
export function DailyPanel({ points }: { points: { x: number; z: number }[] }) {
  const t = useTranslations('street.hud.daily');
  const { data, isLoading } = useGetMissionsQuery();
  const mounted = useMounted();
  return (
    <Card className="flex flex-col gap-2 p-3">
      <h2 className="font-display text-lg font-extrabold text-ink">{t('title')}</h2>
      <MiniMap points={points} />
      {isLoading || !mounted ? <Skeleton className="h-16" /> : (
        <ul className="flex flex-col gap-1.5">
          {(data ?? []).slice(0, 3).map((m) => {
            const done = m.progress !== null && m.progress >= m.target;
            return (
              <li key={m.id} className="flex items-center gap-2 text-sm text-ink">
                <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', done ? 'bg-primary text-on-primary' : 'bg-surface-muted text-ink-subtle')}>
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                {m.progress !== null ? (
                  <span className="text-xs font-bold text-ink-muted">
                    {Math.min(m.progress, m.target)}/{m.target}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/su-kien" className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'w-full btn-glossy font-bold')}>{t('claim')}<ArrowRight className="size-4" aria-hidden /></Link>
    </Card>
  );
}

/** Thẻ "Bảng tin cộng đồng" (hàng 5 thẻ dưới): bộ lọc liên kết + bài mới nhất. */
function FeedMini() {
  const t = useTranslations('street.hud.cards');
  const { data } = useGetPostsQuery({ page: 1, pageSize: 1 });
  const post = data?.items[0] ?? null;
  const chip = 'rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-ink hover:bg-primary-soft';
  return (
    <Card className="flex flex-col gap-2 p-3">
      <h2 className="font-display text-lg font-extrabold text-ink">{t('feed')}</h2>
      <div className="flex flex-wrap gap-1.5">
        <Link href="/bang-tin" className={cn(chip, 'btn-glossy text-on-primary hover:brightness-105')}>
          {t('all')}
        </Link>
        <Link href="/bang-tin?type=story" className={chip}>
          {t('story')}
        </Link>
        <Link href="/bang-tin?type=brag" className={chip}>
          {t('brag')}
        </Link>
      </div>
      {post ? (
        <Link href={`/bai/${post.id}`} className="flex flex-col gap-1.5 rounded-2xl bg-surface-muted/60 p-2.5">
          <span className="flex items-center gap-2">
            <Avatar src={post.author.avatarUrl} name={post.author.displayName} size={32} />
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{post.author.displayName}</span>
          </span>
          <span className="line-clamp-3 text-sm text-ink">{post.body}</span>
          <span className="flex gap-3 text-xs font-bold text-ink-muted">
            <span>👍 {post.counts.reactions}</span>
            <span>💬 {post.counts.comments}</span>
          </span>
        </Link>
      ) : (
        <p className="text-sm text-ink-muted">{t('empty')}</p>
      )}
    </Card>
  );
}

/** Thẻ "Cá nhân": số liệu thật của tài khoản; khách thì mời đăng nhập. */
function ProfileMini() {
  const t = useTranslations('street.hud.cards');
  const dispatch = useAppDispatch();
  const isMember = useAppSelector(selectIsMember);
  const me = useCurrentUser();
  const { data: stats } = useGetMeStatsQuery(undefined, { skip: !isMember });
  return (
    <Card className="flex flex-col gap-2 p-3">
      <h2 className="font-display text-lg font-extrabold text-ink">{t('profile')}</h2>
      {me ? (
        <>
          <Link href="/ca-nhan" className="flex items-center gap-2">
            <Avatar src={me.avatarUrl} name={me.displayName} size={44} />
            <span className="min-w-0 flex-1 truncate font-bold text-ink">{me.displayName}</span>
          </Link>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="rounded-xl bg-surface-muted p-1.5">
              <p className="font-bold text-ink">{compactCount(stats?.points ?? me.points)}</p>
              <p className="text-[0.65rem] font-semibold text-ink-muted">{t('points')}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-1.5">
              <p className="font-bold text-ink">{stats?.counts.posts ?? 0}</p>
              <p className="text-[0.65rem] font-semibold text-ink-muted">{t('posts')}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-1.5">
              <p className="font-bold text-ink">{stats?.counts.followers ?? 0}</p>
              <p className="text-[0.65rem] font-semibold text-ink-muted">{t('followers')}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-ink">{t('guest')}</p>
          <Button variant="primary" size="md" onClick={() => dispatch(loginRequested('follow'))}>
            {t('login')}
          </Button>
        </>
      )}
    </Card>
  );
}

/** Hàng 5 thẻ dưới cảnh phố (máy tính): Bảng tin · Thử thách tuần · BXH · Sự kiện nổi bật · Cá nhân. */
export function StreetBottomCards() {
  return (
    <div className="hidden grid-cols-5 items-start gap-3 xl:grid">
      <FeedMini />
      <ChallengeTasks />
      <WeeklyBoard variant="rail" />
      <FeaturedEventCard />
      <ProfileMini />
    </div>
  );
}
