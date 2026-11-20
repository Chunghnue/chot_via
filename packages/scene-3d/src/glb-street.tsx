import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { CanvasTexture, Color, InstancedMesh, MathUtils, Mesh, MeshStandardMaterial, Object3D, TOUCH, Vector3, type Group } from 'three';
import type { HomeConfig, StreetSlotDto } from '@chot-via/shared';
import { useSceneColors, type SceneColors } from './colors';

export type GlbQuality = 'high' | 'mid' | 'low';
type Lod = 'high' | 'mid' | 'low';
type ControlsRef = ComponentRef<typeof OrbitControls>;

export interface GlbStreetLabels { deity: string; reset: string; soundOn: string; soundOff: string; rotate: string; hint: string }

export interface GlbStreetProps {
  config: Pick<HomeConfig, 'camera' | 'deityGlbUrl' | 'deityScale' | 'streetGlbUrl' | 'props' | 'pedestrians' | 'sparkles'>;
  slots: readonly StreetSlotDto[];
  quality: GlbQuality;
  /** Số khung hình tối đa mỗi giây (điện thoại: 30). */
  maxFps: number;
  /** false khi khung cảnh ra ngoài màn hình hoặc tab ẩn: ngừng vẽ để tiết kiệm pin. */
  active: boolean;
  reducedMotion: boolean;
  /** Tăng giá trị để đặt lại góc nhìn. */
  resetTick: number;
  autoRotate: boolean;
  selectedPlaceId?: string | null | undefined;
  /** Khi lọc/tìm: chỉ các cửa hàng có id trong tập này sáng và bấm được. null = không lọc. */
  visiblePlaceIds?: ReadonlySet<string> | null | undefined;
  onSelectPlace: (placeId: string) => void;
  onSelectDeity: () => void;
  deityLabel: string;
  className?: string;
}

const RAD = Math.PI / 180;
/** Ngưỡng khoảng cách (mét) đổi mức chi tiết: [gần, xa] theo năng lực thiết bị. */
const LOD_DISTANCE: Record<GlbQuality, readonly [number, number]> = { high: [22, 36], mid: [18, 32], low: [14, 22] };
const MIN_RANK: Record<GlbQuality, number> = { high: 0, mid: 1, low: 1 };
const LOD_ORDER: readonly Lod[] = ['high', 'mid', 'low'];

/** Chọn file theo mức chi tiết; thiếu mức nào thì dùng mức gần nhất có sẵn. */
export function pickGlb(glb: StreetSlotDto['glb'], quality: GlbQuality): string | null {
  const order = quality === 'high' ? [glb.high, glb.lod1, glb.lod2] : quality === 'mid' ? [glb.lod1, glb.high, glb.lod2] : [glb.lod2, glb.lod1, glb.high];
  return order.find((u): u is string => typeof u === 'string' && u !== '') ?? null;
}

/**
 * Model của gói 3D là trục Z hướng lên (xuất từ trimesh) còn camera của cảnh dùng trục Y hướng lên: xoay -90° quanh X để dựng đứng,
 * khi đó mặt tiền (hướng -Y trong model) quay về +Z. Bỏ bước này thì cảnh bị nghiêng khi kéo xoay.
 */
const Z_UP_TO_Y_UP: [number, number, number] = [-Math.PI / 2, 0, 0];

interface ModelProps { url: string; scale?: number; shadows?: boolean; opacity?: number; onShown?: (url: string) => void }

function Model({ url, scale = 1, shadows = false, opacity = 1, onShown }: ModelProps) {
  const gltf = useGLTF(url);
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = shadows;
      o.receiveShadow = shadows;
      if (!Array.isArray(o.material)) {
        o.material = o.material.clone();
        if (o.material instanceof MeshStandardMaterial) { o.material.roughness = 0.72; o.material.metalness = 0.06; }
      }
    });
    return clone;
  }, [gltf.scene, shadows]);
  useEffect(() => {
    object.traverse((o) => {
      if (o instanceof Mesh && !Array.isArray(o.material)) { o.material.transparent = opacity < 1; o.material.opacity = opacity; o.material.needsUpdate = true; }
    });
  }, [object, opacity]);
  useEffect(() => { onShown?.(url); }, [url, onShown]);
  return <group rotation={Z_UP_TO_Y_UP} scale={scale}><primitive object={object} /></group>;
}

/** Hiện model theo URL đích; trong lúc tải mức mới vẫn giữ mức cũ để cửa hàng không bị nhấp nháy. */
function SwapModel({ url, ...rest }: Omit<ModelProps, 'onShown'>) {
  const previous = useRef<string | null>(null);
  const keep = useMemo(() => (value: string) => { previous.current = value; }, []);
  return (
    <Suspense fallback={previous.current && previous.current !== url ? <Model url={previous.current} {...rest} /> : null}>
      <Model url={url} onShown={keep} {...rest} />
    </Suspense>
  );
}

function useLod(position: Vector3, quality: GlbQuality): Lod {
  const [level, setLevel] = useState<Lod>(quality === 'high' ? 'mid' : 'low');
  const levelRef = useRef(level);
  useFrame(({ camera }) => {
    const [near, far] = LOD_DISTANCE[quality];
    const d = camera.position.distanceTo(position);
    const rank = LOD_ORDER.indexOf(levelRef.current);
    // Trễ 2 m quanh ngưỡng để không đổi qua lại liên tục.
    let want = d < near - (rank === 0 ? -2 : 2) ? 0 : d < far - (rank <= 1 ? -2 : 2) ? 1 : 2;
    want = Math.max(want, MIN_RANK[quality]);
    const next = LOD_ORDER[want] ?? 'low';
    if (next !== levelRef.current) { levelRef.current = next; setLevel(next); }
  });
  return level;
}

function Shop({ slot, quality, shadows, selected, enabled, onSelect }: { slot: StreetSlotDto; quality: GlbQuality; shadows: boolean; selected: boolean; enabled: boolean; onSelect: (placeId: string) => void }) {
  const colors = useSceneColors();
  const [hover, setHover] = useState(false);
  const position = useMemo(() => new Vector3(slot.position.x, 2, slot.position.z), [slot.position.x, slot.position.z]);
  const level = useLod(position, quality);
  const url = pickGlb(slot.glb, level);
  const clickable = slot.placeId !== null && enabled;
  const scale = slot.modelScale;
  if (!url) return null;
  return (
    <group
      position={[slot.position.x, 0, slot.position.z]} rotation={[0, slot.position.rotationDeg * RAD, 0]} scale={hover && clickable ? 1.04 : 1}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 8) return; // kéo xoay chứ không phải bấm
        e.stopPropagation();
        if (clickable && slot.placeId) onSelect(slot.placeId);
      }}
      onPointerOver={(e) => { e.stopPropagation(); if (clickable) { setHover(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
    >
      <SwapModel url={url} scale={scale} shadows={shadows} opacity={enabled ? 1 : 0.35} />
      {selected ? <mesh position={[0, 0.06, 3.6 * scale]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.2, 3.7, 40]} /><meshBasicMaterial color={colors.gold} /></mesh> : null}
      {enabled ? (
        <Label text={slot.label} position={[0, 3.9 * scale + 0.9, 1.5]} bg={colors.surface} fg={colors.ink} />
      ) : null}
    </group>
  );
}

/** Nhãn nổi dạng sprite vẽ từ canvas (không dùng Html của drei để tránh dựng/huỷ root React trong lúc render). */
function Label({ text, position, bg, fg, size = 1 }: { text: string; position: [number, number, number]; bg: string; fg: string; size?: number }) {
  const { map, aspect } = useMemo(() => {
    const px = 2;
    const font = `700 ${34 * px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return { map: null, aspect: 1 };
    probe.font = font;
    const padX = 26 * px;
    const w = Math.ceil(probe.measureText(text).width + padX * 2);
    const h = 58 * px;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    if (!g) return { map: null, aspect: 1 };
    g.fillStyle = bg;
    g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.fill();
    g.font = font; g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + px);
    const tex = new CanvasTexture(cv);
    tex.anisotropy = 4;
    return { map: tex, aspect: w / h };
  }, [text, bg, fg]);
  useEffect(() => () => { map?.dispose(); }, [map]);
  if (!map) return null;
  const h = 0.9 * size;
  return (
    <sprite position={position} scale={[h * aspect, h, 1]} renderOrder={10}>
      <spriteMaterial map={map} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}

function Deity({ url, scale, label, shadows, reducedMotion, ringColor, colors, onSelect }: { url: string; scale: number; label: string; shadows: boolean; reducedMotion: boolean; ringColor: string; colors: SceneColors; onSelect: () => void }) {
  const body = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (body.current) { body.current.position.y = Math.sin(t * 1.6) * 0.08; body.current.rotation.y = Math.sin(t * 0.45) * 0.06; }
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
  });
  return (
    <group
      position={[0, 0, 1]}
      onClick={(e: ThreeEvent<MouseEvent>) => { if (e.delta > 8) return; e.stopPropagation(); onSelect(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.1, 5.5, 64]} /><meshBasicMaterial color={ringColor} /></mesh>
      <group ref={body}><SwapModel url={url} scale={scale} shadows={shadows} /></group>
      <pointLight position={[0, 4.5, 3]} intensity={18} color={ringColor} distance={16} />
      <Label text={label} position={[0, 3.53 * scale + 0.9, 0]} bg={colors.wish} fg={colors.onWish} size={1.2} />
    </group>
  );
}

function Props({ items, shadows }: { items: GlbStreetProps['config']['props']; shadows: boolean }) {
  return (
    <>
      {items.map((p, i) => (
        <group key={`${p.glbUrl}-${i}`} position={[p.x, 0, p.z]} rotation={[0, p.rotationDeg * RAD, 0]}>
          <Suspense fallback={null}><Model url={p.glbUrl} scale={p.scale} shadows={shadows} /></Suspense>
        </group>
      ))}
    </>
  );
}

/** Tia sáng và đồng xu lơ lửng quanh Thần Tài. */
function Sparkles({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ a: i * 2.399, r: 2.2 + (i % 5) * 0.55, y: 1 + (i % 9) * 0.5, s: 0.6 + (i % 4) * 0.2 })), []);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = reducedMotion ? 0 : clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(Math.cos(s.a + t * 0.3) * s.r, s.y + Math.sin(t * 1.2 + i) * 0.25, 1 + Math.sin(s.a + t * 0.3) * s.r);
      dummy.scale.setScalar(s.s * (0.75 + 0.25 * Math.sin(t * 2 + i)));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, 28]}><sphereGeometry args={[0.11, 8, 8]} /><meshBasicMaterial color={color} /></instancedMesh>;
}

/** Người đi bộ trên vỉa hè (khối hình đơn giản, đi vòng lặp dọc phố). */
function Walker({ index, colors, reducedMotion }: { index: number; colors: SceneColors; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const legL = useRef<Mesh>(null);
  const legR = useRef<Mesh>(null);
  const shirt = [colors.personA, colors.personB, colors.personC, colors.personD][index % 4] ?? colors.personA;
  const dir = index % 2 === 0 ? -1 : 1;
  const x = (index % 2 === 0 ? -1 : 1) * (6.4 + (index % 3) * 0.5);
  const speed = 0.8 + (index % 5) * 0.18;
  const offset = index * 7.3;
  const start = 26;
  const length = 62;
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = reducedMotion ? 0 : clock.elapsedTime;
    const travelled = (offset + t * speed) % length;
    const z = dir < 0 ? start - travelled : start - length + travelled;
    g.position.set(x, 0, reducedMotion ? start - offset % length : z);
    g.rotation.y = dir < 0 ? Math.PI : 0;
    const swing = Math.sin(t * speed * 5) * 0.5;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.3, 0.26, 0.9, 10]} /><meshStandardMaterial color={shirt} /></mesh>
      <mesh position={[0, 1.78, 0]}><sphereGeometry args={[0.28, 12, 10]} /><meshStandardMaterial color={colors.personSkin} /></mesh>
      <mesh position={[0, 1.95, -0.03]}><sphereGeometry args={[0.3, 12, 10]} /><meshStandardMaterial color={colors.personHair} /></mesh>
      <mesh ref={legL} position={[-0.13, 0.35, 0]}><boxGeometry args={[0.16, 0.7, 0.18]} /><meshStandardMaterial color={colors.personHair} /></mesh>
      <mesh ref={legR} position={[0.13, 0.35, 0]}><boxGeometry args={[0.16, 0.7, 0.18]} /><meshStandardMaterial color={colors.personHair} /></mesh>
    </group>
  );
}

/** Mặt đất: cỏ, đường, vỉa hè, vạch kẻ, quảng trường quanh Thần Tài. */
function Ground({ colors }: { colors: SceneColors }) {
  const lanes = useMemo(() => Array.from({ length: 20 }, (_, i) => 24 - i * 3), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -6]}><planeGeometry args={[180, 180]} /><meshStandardMaterial color={colors.grass} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}><planeGeometry args={[12, 70]} /><meshStandardMaterial color={colors.tileB} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 7.1, 0.06, -8]}><boxGeometry args={[3.2, 0.12, 70]} /><meshStandardMaterial color={colors.tileA} /></mesh>)}
      {lanes.flatMap((z) => [-2.4, 2.4].map((x) => <mesh key={`${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}><planeGeometry args={[0.14, 1.2]} /><meshBasicMaterial color={colors.tileA} /></mesh>))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1]}><circleGeometry args={[5.5, 64]} /><meshStandardMaterial color={colors.tileA} /></mesh>
    </>
  );
}

/** Chỉ vẽ khi `active` và không quá `maxFps` khung/giây (điện thoại 30). Canvas dùng frameloop="demand" nên không tốn gì khi tạm dừng. */
function FrameDriver({ maxFps, active }: { maxFps: number; active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    let last = 0;
    const interval = 1000 / maxFps;
    const tick = (now: number): void => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < interval) return;
      last = now;
      invalidate();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, maxFps, active]);
  return null;
}

/** Đặt lại góc nhìn khi `resetTick` đổi; bay camera tới cửa hàng đang chọn. */
function CameraRig({ config, resetTick, goal, controls }: { config: GlbStreetProps['config']['camera']; resetTick: number; goal: { x: number; z: number } | null; controls: React.RefObject<ControlsRef | null> }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const c = controls.current;
    camera.position.set(0, config.height, config.targetZ + config.distance);
    if (c) { c.target.set(0, config.targetY, config.targetZ); c.update(); }
    invalidate();
  }, [resetTick, camera, config.height, config.distance, config.targetY, config.targetZ, controls, invalidate]);
  useFrame(() => {
    const c = controls.current;
    if (!c || !goal) return;
    c.target.x = MathUtils.lerp(c.target.x, goal.x * 0.4, 0.06);
    c.target.z = MathUtils.lerp(c.target.z, goal.z + 1, 0.06);
  });
  return null;
}

function Scene({ props }: { props: GlbStreetProps }): ReactNode {
  const { config, slots, quality, selectedPlaceId, visiblePlaceIds, onSelectPlace, onSelectDeity, deityLabel, reducedMotion, resetTick, autoRotate } = props;
  const colors = useSceneColors();
  const controls = useRef<ControlsRef>(null);
  const cam = config.camera;
  const shadows = quality === 'high';
  const sky = useMemo(() => new Color(colors.sky), [colors.sky]);
  const goal = useMemo(() => {
    const s = slots.find((x) => x.placeId !== null && x.placeId === selectedPlaceId);
    return s ? { x: s.position.x, z: s.position.z } : null;
  }, [slots, selectedPlaceId]);
  const walkers = quality === 'low' ? Math.min(config.pedestrians, 6) : config.pedestrians;
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 55, 140]} />
      <hemisphereLight args={[colors.sidewalk, colors.grass, 1.6]} />
      <directionalLight position={[-12, 24, 16]} intensity={2} castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <Ground colors={colors} />
      {config.streetGlbUrl ? <Suspense fallback={null}><Model url={config.streetGlbUrl} shadows={shadows} /></Suspense> : (
        <>
          {config.deityGlbUrl ? <Deity url={config.deityGlbUrl} scale={config.deityScale} label={deityLabel} shadows={shadows} reducedMotion={reducedMotion} ringColor={colors.gold} colors={colors} onSelect={onSelectDeity} /> : null}
          {slots.map((slot) => (
            <Shop
              key={slot.id} slot={slot} quality={quality} shadows={shadows}
              selected={slot.placeId !== null && slot.placeId === selectedPlaceId}
              enabled={visiblePlaceIds == null || (slot.placeId !== null && visiblePlaceIds.has(slot.placeId))}
              onSelect={onSelectPlace}
            />
          ))}
          <Props items={config.props} shadows={false} />
          {config.sparkles ? <Sparkles color={colors.coin} reducedMotion={reducedMotion} /> : null}
          {Array.from({ length: walkers }, (_, i) => <Walker key={i} index={i} colors={colors} reducedMotion={reducedMotion} />)}
        </>
      )}
      <OrbitControls
        ref={controls} makeDefault enableDamping dampingFactor={0.08} enablePan={false} autoRotate={autoRotate && !reducedMotion} autoRotateSpeed={0.7}
        minDistance={cam.distance * 0.4} maxDistance={cam.distance * 1.5}
        minPolarAngle={MathUtils.clamp(cam.minPolarDeg, 5, 85) * RAD} maxPolarAngle={MathUtils.clamp(cam.maxPolarDeg, 20, 89) * RAD}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }} target={[0, cam.targetY, cam.targetZ]}
      />
      <CameraRig config={cam} resetTick={resetTick} goal={goal} controls={controls} />
    </>
  );
}

export default function GlbStreet(props: GlbStreetProps) {
  const { config, quality, maxFps, active, className } = props;
  const cam = config.camera;
  return (
    <div className={className} style={{ touchAction: 'none' }}>
      <Canvas
        frameloop="demand" shadows={quality === 'high' ? 'percentage' : false} dpr={quality === 'low' ? [1, 1.35] : [1, 1.75]}
        camera={{ position: [0, cam.height, cam.targetZ + cam.distance], fov: cam.fov, near: 0.1, far: 220 }}
        gl={{ antialias: quality !== 'low', powerPreference: quality === 'low' ? 'low-power' : 'high-performance' }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 1.2; }}
      >
        <FrameDriver maxFps={maxFps} active={active} />
        <Scene props={props} />
      </Canvas>
    </div>
  );
}
