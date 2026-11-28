import { Skeleton } from '@xin-via/ui';
import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { useSceneCapability } from './capability';
import { Street2D } from './street-2d';
import type { StreetSceneProps } from './types';

const Street3D = lazy(() => import('./street-3d'));

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  override componentDidCatch(_error: Error, _info: ErrorInfo): void { /* Lỗi WebGL: chuyển sang bản 2D. */ }
  override render(): ReactNode { return this.state.failed ? this.props.fallback : this.props.children; }
}

export type SceneMode = '2d' | '3d';

/**
 * Chọn 3D hay 2D: 3D chỉ tải khi thiết bị hỗ trợ WebGL và không phải máy yếu; người dùng có thể ép 2D.
 * Không để 3D chặn Xin vía hay bảng tin (lazy-load + fallback).
 */
export function SceneView({ mode, ...props }: StreetSceneProps & { mode: SceneMode }) {
  const capability = useSceneCapability();
  const fallback = <Street2D {...props} className={props.className} />;
  if (!capability.ready) return <Skeleton className={props.className} />;
  if (mode === '2d' || !capability.supports3D) return fallback;
  return (
    <SceneBoundary fallback={fallback}>
      <Suspense fallback={<Skeleton className={props.className} />}>
        <Street3D {...props} reducedMotion={capability.reducedMotion} />
      </Suspense>
    </SceneBoundary>
  );
}
