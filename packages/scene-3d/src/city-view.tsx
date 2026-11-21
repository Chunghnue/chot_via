import { Skeleton, cn } from '@chot-via/ui';
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

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pickPlace = useCallback((id: string) => { if (sound) playChime(); onSelectPlace(id); }, [sound, onSelectPlace]);
  const pickDeity = useCallback(() => { if (sound) playChime(); onSelectDeity(); }, [sound, onSelectDeity]);

  return (
    <div ref={box} className={cn('relative', className)}>
      {!capability.ready ? <Skeleton className="absolute inset-0" /> : !capability.supports3D ? <>{fallback}</> : (
        <Boundary fallback={fallback}>
          <Suspense fallback={<Skeleton className="absolute inset-0" />}>
            <CityStreet
              {...rest} config={config} quality={q.quality} maxFps={q.maxFps} active={visible} reducedMotion={capability.reducedMotion}
              resetTick={resetTick} autoRotate={false} onSelectPlace={pickPlace} onSelectDeity={pickDeity} className="absolute inset-0"
            />
          </Suspense>
        </Boundary>
      )}
    </div>
  );
}
