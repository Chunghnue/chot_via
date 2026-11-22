import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, type MutableRefObject } from 'react';
import { AdditiveBlending, DoubleSide, type Group, type Sprite as SpriteObject } from 'three';
import { CITY_IMAGES } from './city-assets';
import { glowTexture, useFaceCamera, useSprite } from './city-kit';
import type { SceneColors } from './colors';

/**
 * Thần Tài đi bộ trong nghi lễ Thỉnh Thần Tài: 8 khung hình của chủ dự án (chân nhấc lên, đặt xuống, vạt áo bay, tay nâng thỏi vàng) xếp trong
 * một ảnh 4×2 (`than-tai-di.webp`, tách nền từ tệp hoạt ảnh). Khung hình chọn theo quãng đường đã đi nên chân khớp tốc độ, không trượt.
 * Luôn quay mặt về phía người xem; đi sang phải thì lật ảnh.
 */
export interface DeityPose {
  /** Mức di chuyển 0..1 và pha bước (rad, tăng đều theo quãng đường đã đi). */
  mv: number;
  ph: number;
  /** Đang đi về phía +x (lật ảnh). */
  flip: boolean;
  /** Các động tác tại chỗ 0..1: gõ cửa, chúc, vung tay tung vàng. */
  knock: number;
  greet: number;
  throwing: number;
  /** Tăng thêm 1 mỗi lần vung tay (cho clip tung vàng của model GLB). */
  throwId: number;
}

export function newPose(): DeityPose {
  return { mv: 0, ph: 0, flip: false, knock: 0, greet: 0, throwing: 0, throwId: 0 };
}

/** Chiều cao nhân vật trong cảnh (m, từ đế giày đến chóp thỏi vàng). */
export const DEITY_HEIGHT = 4.4;
const COLS = 4;
const ROWS = 2;
const FRAMES = COLS * ROWS;
/** Tỉ lệ khung hình (rộng / cao) của một ô trong ảnh. */
const ASPECT = 400 / 399;
/** Khung hình đứng yên (hai chân chụm) và hai khung chân nhấc cao dùng khi tung vàng. */
const STAND = 0;
const HOP: readonly number[] = [2, 3];

export function DeityWalker({ pose, colors }: { pose: MutableRefObject<DeityPose>; colors: SceneColors }) {
  const tex = useSprite(CITY_IMAGES.deityWalk);
  const bill = useRef<Group>(null);
  const flip = useRef<Group>(null);
  const glow = useRef<SpriteObject>(null);
  useFaceCamera(bill, 1);
  useEffect(() => {
    tex.repeat.set(1 / COLS, 1 / ROWS);
    return () => { tex.repeat.set(1, 1); tex.offset.set(0, 0); };
  }, [tex]);
  useFrame(({ clock }) => {
    const p = pose.current;
    const a = clock.elapsedTime;
    let frame = STAND;
    if (p.mv > 0.25) frame = Math.floor((((p.ph / (Math.PI * 2)) % 1) + 1) % 1 * FRAMES) % FRAMES;
    else if (p.throwing > 0.05) frame = HOP[p.throwing > 0.5 ? 0 : 1] ?? STAND;
    else if (p.greet > 0.1 || p.knock > 0.05) frame = Math.floor(a * 3) % 2 === 0 ? STAND : 1;
    tex.offset.set((frame % COLS) / COLS, 1 - (Math.floor(frame / COLS) + 1) / ROWS);
    if (flip.current) flip.current.scale.set(p.flip ? -1 : 1, 1, 1);
    if (glow.current) { glow.current.material.opacity = 0.16 + 0.45 * p.throwing + 0.18 * p.greet; const k = 1 + 0.5 * p.throwing; glow.current.scale.set(3 * k, 3 * k, 1); }
  });
  const w = DEITY_HEIGHT * ASPECT;
  return (
    <group ref={bill}>
      <group ref={flip}>
        <mesh position={[0, DEITY_HEIGHT / 2, 0]}>
          <planeGeometry args={[w, DEITY_HEIGHT]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.35} side={DoubleSide} toneMapped={false} />
        </mesh>
        <sprite ref={glow} position={[-w * 0.3, DEITY_HEIGHT * 0.78, 0.15]} scale={[3, 3, 1]}>
          <spriteMaterial map={glowTexture()} color={colors.deityGold} transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      </group>
    </group>
  );
}
