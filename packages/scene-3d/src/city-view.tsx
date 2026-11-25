import { cn } from '@chot-via/ui';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSceneCapability } from './capability';
import type { CityStreetProps } from './city-street';
import { Boundary, playChime, useQuality } from './glb-street-view';

const CityStreet = lazy(() => import('./city-street'));

export type CityViewProps = Omit<CityStreetProps, 'quality' | 'maxFps' | 'active' | 'reducedMotion' | 'resetTick' | 'autoRotate'> & {
  /** Hiện khi thiết bị không hỗ trợ WebGL hoặc tải lỗi (ảnh phố tĩnh). */
  fallback: ReactNode;
  /** Tăng giá trị để đặt lại góc nhìn. */
  resetTick?: number;
  /** Âm "ting" khi chạm cửa hàng hoặc Thần Tài. */
  sound?: boolean;
};

/** Thành phố Phố Chốt Vía 3D: cảnh WebGL dựng từ hình tách nền đặt vào không gian ba chiều, kéo xoay / phóng to / đi lại ngay trên trang chủ. */
export function CityView({ fallback, className, onSelectPlace, onSelectDeity, config, resetTick = 0, sound = false, ...rest }: CityViewProps) {
  const capability = useSceneCapability();
  const q = useQuality();
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // Hiện ảnh phố tĩnh ngay; chỉ dựng cảnh 3D (tải three.js, dựng WebGL) sau khi trang đã vẽ xong và trình duyệt rảnh, để lần đầu vào web không bị đứng.
  const [armed, setArmed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [posterGone, setPosterGone] = useState(false);
  useEffect(() => {
    if (!sceneReady) return undefined;
    const id = window.setTimeout(() => setPosterGone(true), 600);
    return () => window.clearTimeout(id);
  }, [sceneReady]);
  useEffect(() => {
    // Đợi trang và ảnh phố tĩnh tải xong (sự kiện load) rồi mới tải three.js và dựng cảnh, để hai việc không tranh băng thông trên mạng chậm.
    let cancelled = false;
    let idle = 0;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const start = (): void => { if (!cancelled) setArmed(true); };
    const afterLoad = (): void => {
      if (typeof w.requestIdleCallback === 'function') idle = w.requestIdleCallback(start, { timeout: 1500 });
      else idle = window.setTimeout(start, 300);
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
    return () => { cancelled = true; window.removeEventListener('load', afterLoad); if (idle) { if (w.cancelIdleCallback) w.cancelIdleCallback(idle); else window.clearTimeout(idle); } };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pickPlace = useCallback((id: string) => { if (sound) playChime(); onSelectPlace(id); }, [sound, onSelectPlace]);
  const pickDeity = useCallback(() => { if (sound) playChime(); onSelectDeity(); }, [sound, onSelectDeity]);

  const show3D = capability.ready && armed && capability.supports3D;
  return (
    <div ref={box} className={cn('relative', className)}>
      {/* Ảnh phố tĩnh luôn nằm dưới: hiện ngay lúc vào trang, mờ dần khi cảnh 3D đã vẽ xong (không bao giờ để khung trống). */}
      {!show3D || !posterGone ? <div className={cn('absolute inset-0', show3D && 'pointer-events-none')}>{fallback}</div> : null}
      {show3D ? (
        <Boundary fallback={fallback}>
          <Suspense fallback={null}>
            <CityStreet
              {...rest} config={config} quality={q.quality} maxFps={q.maxFps} active={visible} reducedMotion={capability.reducedMotion}
              resetTick={resetTick} autoRotate={false} onSelectPlace={pickPlace} onSelectDeity={pickDeity} onReady={() => setSceneReady(true)} className={cn('absolute inset-0 transition-opacity duration-500', sceneReady ? 'opacity-100' : 'opacity-0')}
            />
          </Suspense>
        </Boundary>
      ) : null}
    </div>
  );
}
