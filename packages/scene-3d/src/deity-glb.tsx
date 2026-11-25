import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { AnimationMixer, LoopOnce, MathUtils, type AnimationAction, type AnimationClip, type Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { RitualGlb } from './city-assets';
import type { DeityPose } from './deity-pose';

/** Tìm clip theo tên (không phân biệt hoa thường, chứa tên cần tìm). */
function findClip(clips: readonly AnimationClip[], name: string | undefined): AnimationClip | null {
  if (!name) return null;
  const n = name.toLowerCase();
  return clips.find((c) => c.name.toLowerCase() === n) ?? clips.find((c) => c.name.toLowerCase().includes(n)) ?? null;
}

/**
 * Thần Tài bằng model GLB có xương (thay cho bản dựng khối khi `RITUAL_DEITY_GLB` có giá trị): đứng/đi pha trộn theo mức di chuyển,
 * tốc độ clip đi khớp vận tốc thật, clip vẫy chạy khi chúc và clip tung vàng chạy mỗi lần vung. Hướng quay và độ cao do cảnh nghi lễ điều khiển.
 */
export function DeityGlbFigure({ pose, glb }: { pose: MutableRefObject<DeityPose>; glb: RitualGlb }) {
  const gltf = useGLTF(glb.url);
  const model = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const root = useRef<Group>(null);
  const acts = useMemo(() => {
    const make = (name: string | undefined, once: boolean): AnimationAction | null => {
      const clip = findClip(gltf.animations, name);
      if (!clip) return null;
      const a = mixer.clipAction(clip);
      if (once) { a.setLoop(LoopOnce, 1); a.clampWhenFinished = false; } else { a.play(); }
      return a;
    };
    return { idle: make(glb.clips.idle, false), walk: make(glb.clips.walk, false), wave: make(glb.clips.wave, true), toss: make(glb.clips.throw, true) };
  }, [gltf.animations, mixer, glb.clips]);
  const seen = useRef({ throwId: 0, waving: false });
  useEffect(() => () => { mixer.stopAllAction(); }, [mixer]);
  useFrame((_, delta) => {
    const p = pose.current;
    const dt = Math.min(delta, 0.05);
    if (acts.walk) { acts.walk.setEffectiveWeight(p.mv); acts.walk.setEffectiveTimeScale(MathUtils.clamp(p.mv * 2.4 / glb.walkSpeed, 0.3, 2.5)); }
    if (acts.idle) acts.idle.setEffectiveWeight(1 - p.mv);
    if (p.throwId !== seen.current.throwId) { seen.current.throwId = p.throwId; acts.toss?.reset().play(); }
    if (p.greet > 0.5 && !seen.current.waving) { seen.current.waving = true; acts.wave?.reset().play(); }
    if (p.greet < 0.05) seen.current.waving = false;
    mixer.update(dt);
    if (root.current) root.current.rotation.y = p.flip ? Math.PI / 2 : -Math.PI / 2;
  });
  return <group ref={root} scale={glb.scale} position={[0, glb.y, 0]}><primitive object={model} /></group>;
}
