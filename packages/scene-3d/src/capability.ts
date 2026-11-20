import { useEffect, useState } from 'react';

export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function hasDeviceMemory(nav: Navigator): nav is Navigator & { deviceMemory: number } {
  return 'deviceMemory' in nav && typeof nav.deviceMemory === 'number';
}

/** Máy yếu (ít nhân CPU/RAM) → dùng bản 2D (SRS 8.4). */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const lowCores = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2;
  const lowMemory = hasDeviceMemory(navigator) && navigator.deviceMemory <= 2;
  return lowCores || lowMemory;
}

export interface SceneCapability { ready: boolean; supports3D: boolean; reducedMotion: boolean }

export function useSceneCapability(): SceneCapability {
  const [state, setState] = useState<SceneCapability>({ ready: false, supports3D: false, reducedMotion: false });
  useEffect(() => {
    setState({
      ready: true,
      supports3D: canUseWebGL() && !isLowPowerDevice(),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }, []);
  return state;
}
