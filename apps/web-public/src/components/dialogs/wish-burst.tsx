'use client';

import { Badge, DeityAvatar } from '@chot-via/ui';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { ShareButtons } from '@/components/common/share-buttons';
import { track } from '@/lib/analytics';
import { currentCleared, selectCurrentWish } from '@/features/wish/wishSlice';
import { useDeityWish } from '@/features/wish/use-deity-wish';
import { selectWishRequest } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCurrentUser } from '@/lib/use-member';

/** Style có biến CSS tùy chỉnh (`--bx`, `--by`, `--coin-x`) mà không cần ép kiểu. */
type CssVars = React.CSSProperties & Record<`--${string}`, string>;

/** Thời gian hiện hiệu ứng nổ (ms) và thời gian thẻ lời chúc tự tắt (ms). */
const BURST_MS = 3400;
const CARD_MS = 6500;

/** Hạt nổ bắn ra từ giữa màn hình: toạ độ cố định (không ngẫu nhiên) để lần nào cũng giống nhau và khớp khi hydrate. */
const PARTICLES = Array.from({ length: 60 }, (_, i) => {
  const angle = (i / 60) * Math.PI * 2 + (i % 3) * 0.15;
  const distance = 12 + ((i * 53) % 22);
  return {
    id: i, bx: Math.round(Math.cos(angle) * distance * 1.4), by: Math.round(Math.sin(angle) * distance * 1.1),
    size: (26 + ((i * 7) % 20)) * 2, src: i % 3 === 0 ? '/images/ic-sparkles.webp' : '/images/ic-coin.webp', delay: Math.floor(i / 20) * 0.35 + (i % 5) * 0.03,
  };
});
const RAIN = Array.from({ length: 48 }, (_, i) => ({ id: i, left: 3 + ((i * 37) % 94), delay: (i % 12) * 0.12, x: ((i * 29) % 80) - 40, fall: 44 + ((i * 13) % 24) }));

function particleStyle(size: number, delay: number, bx: number, by: number): CssVars {
  return { width: size, animationDelay: `${delay}s`, '--bx': `${bx}vw`, '--by': `${by}vh` };
}
function rainStyle(left: number, delay: number, x: number, fall: number): CssVars {
  // Mưa vàng rơi tới 44–68% chiều cao màn hình: cả cơn vàng phủ khoảng 2/3 màn hình.
  return { left: `${left}%`, animationDelay: `${delay}s`, '--coin-x': `${x}px`, '--coin-y': `${fall}vh` };
}

/** Vía nổ: đồng xu và tia sáng bắn ra ba đợt (từ giữa màn hình, hoặc từ chỗ vừa bấm nếu có `origin`) cùng cơn mưa đồng xu; tắt hoàn toàn khi người dùng bật giảm chuyển động. */
export function Burst({ origin }: { origin?: { x: number; y: number } }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-60 overflow-hidden motion-reduce:hidden" aria-hidden data-testid="wish-burst">
      <div className={origin ? 'absolute' : 'absolute left-1/2 top-[42%]'} style={origin ? { left: origin.x, top: origin.y } : undefined}>
        {PARTICLES.map((p) => (
          <img
            key={p.id} src={p.src} alt="" draggable={false} className="absolute -ml-8 -mt-8 animate-burst object-contain drop-shadow-md opacity-0"
            style={particleStyle(p.size, p.delay, p.bx, p.by)}
          />
        ))}
      </div>
      {RAIN.map((c) => (
        <img key={c.id} src="/images/ic-coin.webp" alt="" draggable={false} className="absolute top-0 size-16 animate-coin object-contain opacity-0" style={rainStyle(c.left, c.delay, c.x, c.fall)} />
      ))}
    </div>
  );
}

/**
 * Xin vía Thần Tài một chạm: bấm nút Xin vía là vía nổ ngay (hiệu ứng + lời chúc nổi), không hộp thoại, không bước xác nhận.
 * Lượt xin vía được ghi nhận ngay lúc bấm (điểm +1 cho thành viên tính ở máy chủ, đúng như trước).
 */
export function WishBurst() {
  const t = useTranslations('wish');
  const tc = useTranslations('common');
  const dispatch = useAppDispatch();
  const request = useAppSelector(selectWishRequest);
  const current = useAppSelector(selectCurrentWish);
  const user = useCurrentUser();
  const { receive, isLoading, bucket, count } = useDeityWish();
  const handled = useRef(0);
  const [burstId, setBurstId] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (request === 0 || request === handled.current || isLoading) return;
    handled.current = request;
    dispatch(currentCleared());
    setBurstId(request);
    track('wish_open', { target: 'deity', time_bucket: bucket, entrypoint: 'burst' });
    void receive();
  }, [request, isLoading, dispatch, bucket, receive]);

  useEffect(() => {
    if (burstId === 0) return undefined;
    const id = window.setTimeout(() => setBurstId(0), BURST_MS);
    return () => window.clearTimeout(id);
  }, [burstId]);

  useEffect(() => {
    if (!current || paused) return undefined;
    const id = window.setTimeout(() => dispatch(currentCleared()), CARD_MS);
    return () => window.clearTimeout(id);
  }, [current, paused, dispatch]);

  return (
    <>
      {burstId !== 0 ? <Burst key={burstId} /> : null}
      {current ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-60 flex justify-center px-3">
          <div
            role="status" aria-live="polite" data-testid="wish-card"
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
            className="pointer-events-auto relative flex w-full max-w-md animate-pop-in items-center gap-3 rounded-3xl bg-linear-to-b from-gold-soft to-surface p-3 pr-9 shadow-card ring-2 ring-wish/40"
          >
            <div className="w-16 shrink-0 sm:w-20"><DeityAvatar glow src="/images/than-tai-nhan-via.webp" /></div>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-display text-xl font-extrabold leading-tight text-wish-strong">{t('received')}</h3>
              <p className="text-base font-medium leading-snug text-ink">{current.text}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {current.offline ? <Badge tone="warning">{t('offlineBadge')}</Badge> : null}
                {current.pointsAwarded && user ? <Badge tone="success"><Check className="size-3" aria-hidden />{t('pointEarned')}</Badge> : null}
                <span className="text-xs font-semibold text-ink-muted">{t('count', { count })}</span>
              </div>
              {current.offline ? <p className="text-xs text-warning">{t('offlineNote')}</p> : null}
              <ShareButtons text={current.text} />
              <Link href="/pho-3d" onClick={() => dispatch(currentCleared())} className="w-fit text-sm font-bold text-primary-strong hover:underline">{t('suggest')} →</Link>
              <p className="text-[0.68rem] leading-snug text-ink-subtle">{tc('disclaimer')}</p>
            </div>
            <button type="button" aria-label={t('dismiss')} onClick={() => dispatch(currentCleared())} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-ink-muted hover:bg-surface-muted">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
