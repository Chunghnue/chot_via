import { Skeleton, cn } from '@xin-via/ui';
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { useSceneCapability } from './capability';
import type { GlbQuality, GlbStreetLabels, GlbStreetProps } from './glb-street';

const GlbStreet = lazy(() => import('./glb-street'));

export class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  override componentDidCatch(_error: Error, _info: ErrorInfo): void { /* Lỗi tải GLB hoặc WebGL: quay về ảnh phố. */ }
  override render(): ReactNode { return this.state.failed ? this.props.fallback : this.props.children; }
}

export type GlbStreetViewProps = Omit<GlbStreetProps, 'quality' | 'maxFps' | 'active' | 'reducedMotion' | 'resetTick' | 'autoRotate' | 'deityLabel'> & {
  fallback: ReactNode;
  labels: GlbStreetLabels;
  /** Hiện hàng nút điều khiển (đặt lại góc nhìn, âm thanh, tự xoay). */
  controls?: boolean;
};

/** Mức chi tiết theo thiết bị: điện thoại dùng LOD thấp và 30 FPS, iPad LOD vừa, máy tính LOD cao. */
export function useQuality(): { quality: GlbQuality; maxFps: number } {
  const [state, setState] = useState<{ quality: GlbQuality; maxFps: number }>({ quality: 'mid', maxFps: 60 });
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const width = Math.min(window.innerWidth, window.innerHeight);
    if (coarse && width < 700) setState({ quality: 'low', maxFps: 30 });
    else if (coarse) setState({ quality: 'mid', maxFps: 60 });
    else setState({ quality: 'high', maxFps: 60 });
  }, []);
  return state;
}

let audio: AudioContext | null = null;
/** Tiếng "ting" ngắn khi chạm cửa hàng hoặc Thần Tài (chỉ khi người dùng bật âm thanh). */
export function playChime(): void {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* trình duyệt chặn âm thanh: bỏ qua */ }
}

/** Cảnh phố WebGL dựng từ file GLB của admin; thiết bị không hỗ trợ hoặc lỗi tải thì hiện `fallback` (ảnh phố). */
export function GlbStreetView({ fallback, labels, controls = true, className, onSelectPlace, onSelectDeity, config, ...rest }: GlbStreetViewProps) {
  const capability = useSceneCapability();
  const q = useQuality();
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [resetTick, setResetTick] = useState(0);
  const [spin, setSpin] = useState(config.camera.autoRotate);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pickPlace = useCallback((id: string) => { if (sound) playChime(); onSelectPlace(id); }, [sound, onSelectPlace]);
  const pickDeity = useCallback(() => { if (sound) playChime(); onSelectDeity(); }, [sound, onSelectDeity]);

  const btn = 'rounded-full bg-surface/90 px-3 py-2 text-xs font-bold text-ink shadow-card backdrop-blur transition active:scale-95';
  return (
    <div ref={box} className={cn('relative', className)}>
      {!capability.ready ? <Skeleton className="absolute inset-0" /> : !capability.supports3D ? <>{fallback}</> : (
        <Boundary fallback={fallback}>
          <Suspense fallback={<Skeleton className="absolute inset-0" />}>
            <GlbStreet
              {...rest} config={config} quality={q.quality} maxFps={q.maxFps} active={visible} reducedMotion={capability.reducedMotion}
              resetTick={resetTick} autoRotate={spin} deityLabel={labels.deity} onSelectPlace={pickPlace} onSelectDeity={pickDeity} className="absolute inset-0"
            />
            {controls ? (
              <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
                <button type="button" className={btn} onClick={() => setResetTick((n) => n + 1)}>⟳ {labels.reset}</button>
                <button type="button" className={btn} aria-pressed={spin} onClick={() => setSpin((v) => !v)}>↻ {labels.rotate}</button>
                <button type="button" className={btn} aria-pressed={sound} onClick={() => setSound((v) => !v)}>{sound ? '🔊' : '🔇'} {sound ? labels.soundOn : labels.soundOff}</button>
              </div>
            ) : null}
            <p className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-ink-muted shadow-card md:block">{labels.hint}</p>
          </Suspense>
        </Boundary>
      )}
    </div>
  );
}
