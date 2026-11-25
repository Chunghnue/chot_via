import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject } from 'react';
import { AdditiveBlending, DoubleSide, MathUtils, Vector3, type Group, type Sprite as SpriteObject } from 'three';
import { CITY_IMAGES } from './city-assets';
import { glowTexture, useSprite, aspectOf } from './city-kit';
import type { SceneColors } from './colors';
import type { DeityPose } from './deity-pose';

/** Chiều cao Thần Tài bay trong cảnh (m). */
const FLY_HEIGHT = 4.4;
const world = new Vector3();

/**
 * Thần Tài bay trong nghi lễ Thỉnh Thần Tài: ảnh toàn thân đứng (không bệ), luôn quay mặt về người xem.
 * Nghiêng về hướng bay, lắc nhẹ theo nhịp; gõ cửa thì gật tới, tung vàng thì nở to và sáng lên.
 */
export function DeityFlyer({ pose, colors }: { pose: MutableRefObject<DeityPose>; colors: SceneColors }) {
  const tex = useSprite(CITY_IMAGES.deityFly);
  const bill = useRef<Group>(null);
  const body = useRef<Group>(null);
  const glow = useRef<SpriteObject>(null);
  const lean = useRef(0);
  useFrame(({ clock, camera }, delta) => {
    // Quay mặt về camera theo vị trí thật trong cảnh (nhân vật bay xa gốc, camera lại đang ở sâu trong phố).
    if (bill.current) { bill.current.getWorldPosition(world); bill.current.rotation.y = Math.atan2(camera.position.x - world.x, camera.position.z - world.z); }
    const p = pose.current;
    const t = clock.elapsedTime;
    lean.current = MathUtils.damp(lean.current, p.mv * 0.16 * (p.flip ? -1 : 1), 6, Math.min(delta, 0.05));
    const g = body.current;
    if (g) {
      g.rotation.z = lean.current + Math.sin(t * 2.4) * 0.025 * (0.4 + p.mv) + p.knock * 0.05 * (p.flip ? -1 : 1);
      const k = 1 + p.throwing * 0.12 + p.greet * 0.04 - p.knock * 0.03;
      g.scale.set(k, k * (1 - p.knock * 0.02), 1);
    }
    if (glow.current) { glow.current.material.opacity = 0.2 + 0.4 * p.throwing + 0.18 * p.greet + 0.15 * p.mv; const s = 7 * (1 + 0.4 * p.throwing); glow.current.scale.set(s, s, 1); }
  });
  const w = FLY_HEIGHT * aspectOf(tex);
  return (
    <group ref={bill}>
      <group ref={body} position={[0, 0, 0]}>
        <sprite ref={glow} position={[0, FLY_HEIGHT * 0.5, -0.1]} scale={[7, 7, 1]}>
          <spriteMaterial map={glowTexture()} color={colors.deityGold} transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
        <mesh position={[0, FLY_HEIGHT / 2, 0]}>
          <planeGeometry args={[w, FLY_HEIGHT]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.35} side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
