import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { CanvasTexture, DoubleSide, SRGBColorSpace, Vector3, type Group, type Texture } from 'three';

/** Các hàm dùng chung của cảnh phố 3D và cảnh nghi lễ (đổ bóng, vệt sáng, hình luôn quay mặt về camera). */

/* ---------- Texture dùng chung ---------- */

let glowCache: CanvasTexture | null = null;
/** Vệt sáng/đốm mềm hình tròn (chỉ là mặt nạ alpha, màu do vật liệu quyết định). */
export function glowTexture(): CanvasTexture {
  if (glowCache) return glowCache;
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const g = cv.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  glowCache = new CanvasTexture(cv);
  return glowCache;
}

export function useSprite(src: string): Texture {
  const tex = useTexture(src);
  useMemo(() => { tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8; }, [tex]);
  return tex;
}

export function aspectOf(tex: Texture): number {
  const img: unknown = tex.image;
  if (img instanceof HTMLImageElement && img.naturalHeight > 0) return img.naturalWidth / img.naturalHeight;
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap && img.height > 0) return img.width / img.height;
  return 1;
}

const forward = new Vector3();

/**
 * Hình đứng xoay quanh trục dọc để hướng về camera (một phần `face` ∈ 0..1).
 * `screen = true` thì song song với màn hình (không méo khi ở lệch tâm), dùng cho bảng chữ cần thẳng.
 */
export function useFaceCamera(ref: RefObject<Group | null>, face: number, screen = false): void {
  useFrame(({ camera }) => {
    const g = ref.current;
    if (!g || face === 0) return;
    if (screen) {
      camera.getWorldDirection(forward);
      g.rotation.y = Math.atan2(-forward.x, -forward.z) * face;
      return;
    }
    const wp = g.parent?.position;
    const px = wp ? wp.x : 0;
    const pz = wp ? wp.z : 0;
    g.rotation.y = Math.atan2(camera.position.x - px, camera.position.z - pz) * face;
  });
}

/* ---------- Thành phần cảnh ---------- */

export function Shadow({ size, opacity, color }: { size: number; opacity: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.2]} scale={[1, 0.5, 1]} renderOrder={1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={glowTexture()} color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export interface SpriteProps {
  src: string; width: number; x: number; z: number; y?: number; face?: number; flip?: boolean; shadow?: number; shadowColor: string;
  alphaCover: boolean; opacity?: number; children?: ReactNode;
  onClick?: (() => void) | undefined; onHover?: ((over: boolean) => void) | undefined;
}

/** Một món đồ (cây, ghế, cửa hàng…) là ảnh tách nền đặt đứng trên mặt đường. */
export function Sprite({ src, width, x, z, y = 0, face = 1, flip = false, shadow = 0, shadowColor, alphaCover, opacity = 1, children, onClick, onHover }: SpriteProps) {
  const tex = useSprite(src);
  const height = width / aspectOf(tex);
  const ref = useRef<Group>(null);
  useFaceCamera(ref, face);
  return (
    <group position={[x, y, z]}>
      {shadow > 0 ? <Shadow size={width * 1.1} opacity={shadow} color={shadowColor} /> : null}
      <group ref={ref}>
        <mesh
          position={[0, height / 2, 0]} scale={[flip ? -1 : 1, 1, 1]}
          onClick={onClick ? (e: ThreeEvent<MouseEvent>) => { if (e.delta > 8) return; e.stopPropagation(); onClick(); } : undefined}
          onPointerOver={onHover ? (e) => { e.stopPropagation(); onHover(true); } : undefined}
          onPointerOut={onHover ? () => { onHover(false); } : undefined}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={tex} transparent={opacity < 1} opacity={opacity} alphaTest={0.4} alphaToCoverage={alphaCover} side={DoubleSide} toneMapped={false} />
        </mesh>
        {children}
      </group>
    </group>
  );
}
