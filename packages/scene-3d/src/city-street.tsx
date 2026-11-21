import { OrbitControls, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import {
  AdditiveBlending, BackSide, CanvasTexture, Color, DoubleSide, MathUtils, MirroredRepeatWrapping, SRGBColorSpace, TOUCH,
  Vector3, type Group, type Points, type Texture,
} from 'three';
import type { HomeConfig, StreetSlotDto } from '@chot-via/shared';
import { SHOP_IMAGES } from '@chot-via/ui';
import { CITY_DECOR, CITY_GLB_OVERRIDES, CITY_IMAGES, CITY_LAMPS, SHOP_WIDTH, spreadShopX, type DecorItem } from './city-assets';
import { useSceneColors, type SceneColors } from './colors';
import { Model, type CameraCommand, type GlbQuality } from './glb-street';
import { Label } from './label';

type ControlsRef = ComponentRef<typeof OrbitControls>;

export interface CityStreetProps {
  command?: CameraCommand | null;
  config: Pick<HomeConfig, 'camera' | 'pedestrians' | 'sparkles' | 'signLines'>;
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
  /** Tăng giá trị để Thần Tài "nổ vía": đồng xu bắn tung ra từ Thần Tài và Thần Tài nhún lên. */
  burstTick?: number | undefined;
  /** Nửa bề ngang (mét) luôn phải thấy được; bỏ trống thì tự chọn theo tỉ lệ khung (khung hẹp chỉ cần thấy phần giữa). */
  fitHalfWidth?: number | undefined;
  selectedPlaceId?: string | null | undefined;
  /** Khi lọc/tìm: chỉ các cửa hàng có id trong tập này sáng và bấm được. null = không lọc. */
  visiblePlaceIds?: ReadonlySet<string> | null | undefined;
  onSelectPlace: (placeId: string) => void;
  onSelectDeity: () => void;
  className?: string;
}

const RAD = Math.PI / 180;
/** Nửa bề ngang (mét) cần thấy được ở mặt phẳng cửa hàng: khung càng hẹp càng chỉ cần thấy phần giữa (Thần Tài và hai cửa hàng gần), khung rộng thì thấy cả hai dãy phố. */
const FIT_HALF_WIDTH_NARROW = 9.5;
const FIT_HALF_WIDTH_WIDE = 15;
const POSE_SECONDS = 6;

/* ---------- Texture dùng chung ---------- */

let glowCache: CanvasTexture | null = null;
/** Vệt sáng/đốm mềm hình tròn (chỉ là mặt nạ alpha, màu do vật liệu quyết định). */
function glowTexture(): CanvasTexture {
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

function useSprite(src: string): Texture {
  const tex = useTexture(src);
  useMemo(() => { tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8; }, [tex]);
  return tex;
}

function aspectOf(tex: Texture): number {
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
function useFaceCamera(ref: RefObject<Group | null>, face: number, screen = false): void {
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

function Shadow({ size, opacity, color }: { size: number; opacity: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.2]} scale={[1, 0.5, 1]} renderOrder={1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={glowTexture()} color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

interface SpriteProps {
  src: string; width: number; x: number; z: number; y?: number; face?: number; flip?: boolean; shadow?: number; shadowColor: string;
  alphaCover: boolean; opacity?: number; children?: ReactNode;
  onClick?: (() => void) | undefined; onHover?: ((over: boolean) => void) | undefined;
}

/** Một món đồ (cây, ghế, cửa hàng…) là ảnh tách nền đặt đứng trên mặt đường. */
function Sprite({ src, width, x, z, y = 0, face = 1, flip = false, shadow = 0, shadowColor, alphaCover, opacity = 1, children, onClick, onHover }: SpriteProps) {
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

/** Nền trời và thành phố xa bọc kín một vòng 360°: ảnh panorama lát đối xứng hai lần quanh vòng nên không lộ mép. */
function Backdrop() {
  const tex = useTexture(CITY_IMAGES.backdrop);
  useMemo(() => { tex.colorSpace = SRGBColorSpace; tex.wrapS = MirroredRepeatWrapping; tex.repeat.set(-2, 1); tex.offset.set(1.5, 0); tex.anisotropy = 4; }, [tex]);
  const radius = 96;
  const height = (radius * Math.PI) / aspectOf(tex);
  return (
    <mesh position={[0, height * 0.03, -3]} renderOrder={-10}>
      <cylinderGeometry args={[radius, radius, height, 96, 1, true]} />
      <meshBasicMaterial map={tex} side={BackSide} fog={false} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function Ground({ colors }: { colors: SceneColors }) {
  const tex = useTexture(CITY_IMAGES.ground);
  useMemo(() => { tex.colorSpace = SRGBColorSpace; tex.anisotropy = 12; }, [tex]);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -5]}><planeGeometry args={[420, 420]} /><meshBasicMaterial color={colors.grass} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -35]}><planeGeometry args={[80, 120]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </>
  );
}

function LampPost({ x, z, colors }: { x: number; z: number; colors: SceneColors }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.07, 0.11, 3.4, 8]} /><meshStandardMaterial color={colors.metal} /></mesh>
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.28, 0.34, 0.24, 10]} /><meshStandardMaterial color={colors.metal} /></mesh>
      <mesh position={[0, 3.55, 0]}><sphereGeometry args={[0.24, 14, 12]} /><meshBasicMaterial color={colors.lamp} toneMapped={false} /></mesh>
      <sprite position={[0, 3.55, 0]} scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={glowTexture()} color={colors.lamp} transparent opacity={0.25} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

interface ShopProps { slot: StreetSlotDto; selected: boolean; enabled: boolean; colors: SceneColors; alphaCover: boolean; onSelect: (placeId: string) => void }

function CityShop({ slot, selected, enabled, colors, alphaCover, onSelect }: ShopProps) {
  const [hover, setHover] = useState(false);
  const clickable = slot.placeId !== null && enabled;
  const width = SHOP_WIDTH[slot.modelKey];
  const placeId = slot.placeId;
  const x = spreadShopX(slot.position.x, slot.position.z);
  const glb = CITY_GLB_OVERRIDES[slot.modelKey];
  const pick = clickable && placeId ? () => { onSelect(placeId); } : undefined;
  const over = (value: boolean): void => { setHover(value); document.body.style.cursor = value && clickable ? 'pointer' : 'auto'; };
  const extras = (
    <>
      {selected ? <mesh position={[0, 0.08, 0.6]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[width * 0.46, width * 0.5, 48]} /><meshBasicMaterial color={colors.gold} /></mesh> : null}
      {enabled && (hover || selected) ? <Label text={slot.label} position={[0, width * 0.82, 0.5]} bg={colors.surface} fg={colors.ink} size={1.1} /> : null}
    </>
  );
  if (glb) {
    // Model GLB thật: xoay 360° đúng hình khối; mặt tiền hướng ra phố theo góc của ô cửa hàng.
    return (
      <group
        position={[x, 0, slot.position.z]} rotation={[0, slot.position.rotationDeg * RAD, 0]} scale={hover && clickable ? 1.03 : 1}
        onClick={(e: ThreeEvent<MouseEvent>) => { if (e.delta > 8) return; e.stopPropagation(); pick?.(); }}
        onPointerOver={(e) => { e.stopPropagation(); over(true); }} onPointerOut={() => { over(false); }}
      >
        <Suspense fallback={null}><Model url={glb.url} scale={glb.scale} opacity={enabled ? 1 : 0.35} /></Suspense>
        {extras}
      </group>
    );
  }
  return (
    <Suspense fallback={null}>
      <Sprite
        src={SHOP_IMAGES[slot.modelKey]} width={width * (hover && clickable ? 1.03 : 1)} x={x} z={slot.position.z} face={1}
        shadow={0.4} shadowColor={colors.ink} alphaCover={alphaCover} opacity={enabled ? 1 : 0.35}
        onClick={pick} onHover={over}
      >
        {extras}
      </Sprite>
    </Suspense>
  );
}

function CityDeity({ colors, reducedMotion, burstTick, onSelect }: { colors: SceneColors; reducedMotion: boolean; burstTick: number; onSelect: () => void }) {
  const textures = useTexture([...CITY_IMAGES.deityPoses]);
  useMemo(() => { textures.forEach((t) => { t.colorSpace = SRGBColorSpace; t.anisotropy = 8; }); }, [textures]);
  const float = useRef<Group>(null);
  const face = useRef<Group>(null);
  const poses = useRef<(Group | null)[]>([]);
  const aura = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const baseY = 0.98;
  const poseHeight = 5.8;
  const glb = CITY_GLB_OVERRIDES.deity;
  const burstAt = useRef(-10);
  const burstSeen = useRef(burstTick);
  useFaceCamera(face, 1);
  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.elapsedTime;
    if (burstTick !== burstSeen.current) { burstSeen.current = burstTick; burstAt.current = clock.elapsedTime; }
    const sinceBurst = reducedMotion ? 99 : clock.elapsedTime - burstAt.current;
    const bursting = sinceBurst < 2.2;
    const idx = bursting ? textures.length - 1 : Math.floor(t / POSE_SECONDS) % textures.length;
    const local = t % POSE_SECONDS;
    poses.current.forEach((g, i) => { if (g) { g.visible = i === idx; g.scale.setScalar(i === idx ? 1 + 0.07 * Math.exp(-5 * local) + (bursting ? 0.22 * Math.exp(-4 * sinceBurst) : 0) : 1); } });
    if (float.current) float.current.position.y = baseY + Math.sin(t * 1.6) * 0.1 + (bursting ? Math.abs(Math.sin(sinceBurst * 7)) * 0.5 * Math.exp(-1.6 * sinceBurst) : 0);
    if (aura.current) aura.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
  });
  const hit = {
    onClick: (e: ThreeEvent<MouseEvent>) => { if (e.delta > 8) return; e.stopPropagation(); onSelect(); },
    onPointerOver: () => { document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { document.body.style.cursor = 'auto'; },
  };
  return (
    <group position={[0, 0, 1]}>
      <group ref={ring}><mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.4, 5.85, 64]} /><meshBasicMaterial color={colors.gold} toneMapped={false} /></mesh></group>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[4.5, 4.8, 0.34, 48]} /><meshStandardMaterial color={colors.deityGold} metalness={0.5} roughness={0.35} emissive={colors.deityGold} emissiveIntensity={0.25} /></mesh>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[3.8, 4.1, 0.32, 48]} /><meshStandardMaterial color={colors.deityRobe} roughness={0.5} emissive={colors.deityRobe} emissiveIntensity={0.15} /></mesh>
      <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[3.1, 3.4, 0.32, 48]} /><meshStandardMaterial color={colors.deityGold} metalness={0.5} roughness={0.35} emissive={colors.deityGold} emissiveIntensity={0.25} /></mesh>
      <group ref={float} position={[0, baseY, 0]}>
        {glb ? (
          <group onClick={hit.onClick} onPointerOver={hit.onPointerOver} onPointerOut={hit.onPointerOut}>
            <Suspense fallback={null}><Model url={glb.url} scale={glb.scale} /></Suspense>
          </group>
        ) : null}
        <group ref={face}>
          <group ref={aura} position={[0, poseHeight * 0.55, -0.6]}>
            <mesh>
              <planeGeometry args={[17, 17]} />
              <meshBasicMaterial map={glowTexture()} color={colors.gold} transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
          {glb ? null : textures.map((tex, i) => {
            const w = poseHeight * aspectOf(tex);
            return (
              <group key={CITY_IMAGES.deityPoses[i]} ref={(g) => { poses.current[i] = g; }} visible={i === 0}>
                <mesh position={[0, poseHeight / 2, 0]} {...hit}>
                  <planeGeometry args={[w, poseHeight]} />
                  <meshBasicMaterial map={tex} alphaTest={0.4} side={DoubleSide} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
      <pointLight position={[0, 5, 4]} intensity={20} color={colors.gold} distance={18} />
    </group>
  );
}

/** Bảng hiệu gỗ "Chúc may mắn…" dựng trong cảnh (nội dung do admin nhập ở `signLines`). */
function CitySign({ lines, colors }: { lines: readonly string[]; colors: SceneColors }) {
  const ref = useRef<Group>(null);
  useFaceCamera(ref, 1, true);
  const { map, aspect } = useMemo(() => {
    const w = 640;
    const lineH = 96;
    const h = 60 + lines.length * lineH + 40;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    if (!g) return { map: null, aspect: 1 };
    g.fillStyle = colors.bench;
    g.beginPath(); g.roundRect(0, 0, w, h, 36); g.fill();
    g.strokeStyle = colors.trunk; g.lineWidth = 14;
    g.beginPath(); g.roundRect(7, 7, w - 14, h - 14, 30); g.stroke();
    g.fillStyle = colors.trunk; g.globalAlpha = 0.25;
    for (let x = 80; x < w; x += 110) g.fillRect(x, 14, 6, h - 28);
    g.globalAlpha = 1;
    g.font = '800 58px system-ui, -apple-system, "Segoe UI", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = colors.surface;
    lines.forEach((line, i) => g.fillText(line, w / 2, 60 + i * lineH + lineH / 2 - 10, w - 60));
    const tex = new CanvasTexture(cv);
    tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8;
    return { map: tex, aspect: w / h };
  }, [lines, colors.bench, colors.trunk, colors.surface]);
  useEffect(() => () => { map?.dispose(); }, [map]);
  if (!map || lines.length === 0) return null;
  const boardH = 1.9;
  const boardW = boardH * aspect;
  return (
    <group position={[8.2, 0, 8.4]}>
      <Shadow size={boardW * 1.1} opacity={0.3} color={colors.ink} />
      <group ref={ref}>
        {[-1, 1].map((side) => <mesh key={side} position={[side * boardW * 0.32, 1.05, -0.05]}><boxGeometry args={[0.14, 2.1, 0.14]} /><meshStandardMaterial color={colors.trunk} /></mesh>)}
        <mesh position={[0, 1.0 + boardH / 2, 0.02]}>
          <planeGeometry args={[boardW, boardH]} />
          <meshBasicMaterial map={map} transparent side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Đồng xu bắn tung ra từ Thần Tài mỗi khi `tick` tăng (nổ vía), rơi theo trọng lực rồi mờ dần. */
function CoinShower({ tick, reducedMotion, alphaCover }: { tick: number; reducedMotion: boolean; alphaCover: boolean }) {
  const tex = useSprite(CITY_IMAGES.coin);
  const start = useRef(-1);
  const seen = useRef(tick);
  const group = useRef<Group>(null);
  const coins = useMemo(() => Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
    const up = 5 + ((i * 7) % 6);
    const out = 2.5 + ((i * 5) % 5);
    return { vx: Math.cos(a) * out, vz: Math.sin(a) * out * 0.5, vy: up, size: 0.9 + ((i * 3) % 4) * 0.22, spin: 3 + (i % 5) };
  }), []);
  const meshes = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    if (tick !== seen.current) { seen.current = tick; start.current = clock.elapsedTime; }
    const g = group.current;
    if (!g) return;
    const age = start.current < 0 ? -1 : clock.elapsedTime - start.current;
    g.visible = age >= 0 && age < 2.2;
    if (!g.visible) return;
    coins.forEach((c, i) => {
      const m = meshes.current[i];
      if (!m) return;
      m.position.set(c.vx * age, 4 + c.vy * age - 9 * age * age * 0.5, 1 + c.vz * age);
      m.scale.set(Math.cos(age * c.spin * 3) * c.size, c.size, 1);
      m.visible = age < 1.9 || Math.floor(age * 18 + i) % 2 === 0;
    });
  });
  return (
    <group ref={group} visible={false}>
      {coins.map((_, i) => (
        <group key={i} ref={(m) => { meshes.current[i] = m; }}>
          <mesh>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={tex} alphaTest={0.4} alphaToCoverage={alphaCover} side={DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Đồng xu vàng xoay lơ lửng quanh Thần Tài. */
function FloatingCoin({ index, reducedMotion, alphaCover }: { index: number; reducedMotion: boolean; alphaCover: boolean }) {
  const tex = useSprite(CITY_IMAGES.coin);
  const holder = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const radius = 4.2 + (index % 3) * 0.9;
  const lift = 3.2 + (index % 4) * 1.15;
  const size = 0.95 + (index % 3) * 0.25;
  useFaceCamera(holder, 1);
  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.elapsedTime;
    const a = index * 2.1 + t * (0.28 + (index % 3) * 0.05);
    const g = holder.current?.parent;
    if (g) g.position.set(Math.cos(a) * radius, lift + Math.sin(t * 1.3 + index) * 0.35, 1 + Math.sin(a) * radius * 0.55);
    if (spin.current) spin.current.scale.x = Math.cos(t * 2.4 + index);
  });
  return (
    <group>
      <group ref={holder}>
        <group ref={spin}>
          <mesh>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial map={tex} alphaTest={0.4} alphaToCoverage={alphaCover} side={DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Người đi lại: thân trên là ảnh tách từ bộ thiết kế, hai chân là khối 3D thật nên bước chân vung được. */
function CityWalker({ index, colors, reducedMotion, alphaCover }: { index: number; colors: SceneColors; reducedMotion: boolean; alphaCover: boolean }) {
  const [shopkeeper, seller, buyer, crowd] = CITY_IMAGES.walkers;
  const src = index === 3 ? crowd : [shopkeeper, seller, buyer][index % 3] ?? shopkeeper;
  const tex = useSprite(src);
  const root = useRef<Group>(null);
  const face = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const group = src === crowd;
  const bustH = group ? 1.7 : 1.4;
  const bustW = bustH * aspectOf(tex);
  const orbit = index % 3 === 2;
  const dir = index % 2 === 0 ? -1 : 1;
  const lane = (index % 2 === 0 ? -1 : 1) * (5.2 + (index % 3) * 0.9);
  const speed = 0.9 + (index % 5) * 0.2;
  const offset = index * 6.1;
  useFaceCamera(face, 1);
  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = reducedMotion ? 0 : clock.elapsedTime;
    if (orbit) {
      const r = 9.4 + (index % 2) * 1.3;
      const a = index * 1.3 + (t * speed * dir) / r;
      g.position.set(Math.cos(a) * r, 0, 1 + Math.sin(a) * r * 0.8);
    } else {
      const length = 56;
      const travelled = (offset + t * speed) % length;
      g.position.set(lane, 0, dir < 0 ? 16 - travelled : -40 + travelled);
    }
    const swing = Math.sin(t * speed * 5) * 0.55;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (face.current) face.current.position.y = Math.abs(Math.sin(t * speed * 5)) * 0.05;
  });
  return (
    <group ref={root}>
      <Shadow size={1.6} opacity={0.3} color={colors.ink} />
      <group ref={legL} position={[-0.16, 0.62, 0]}><mesh position={[0, -0.31, 0]}><boxGeometry args={[0.2, 0.62, 0.22]} /><meshStandardMaterial color={colors.personHair} /></mesh></group>
      <group ref={legR} position={[0.16, 0.62, 0]}><mesh position={[0, -0.31, 0]}><boxGeometry args={[0.2, 0.62, 0.22]} /><meshStandardMaterial color={colors.personHair} /></mesh></group>
      <group ref={face}>
        <mesh position={[0, 0.58 + bustH / 2, 0]} scale={[dir, 1, 1]}>
          <planeGeometry args={[bustW, bustH]} />
          <meshBasicMaterial map={tex} alphaTest={0.4} alphaToCoverage={alphaCover} side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Cánh hoa đào rơi nhẹ trong không khí. */
function Petals({ count, color, reducedMotion }: { count: number; color: string; reducedMotion: boolean }) {
  const ref = useRef<Points>(null);
  const data = useMemo(() => {
    let seed = 11;
    const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pos = new Float32Array(count * 3);
    const fall = new Float32Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * 50; pos[i * 3 + 1] = rnd() * 14; pos[i * 3 + 2] = -28 + rnd() * 46;
      fall[i] = 0.35 + rnd() * 0.5; phase[i] = rnd() * 6.28;
    }
    return { pos, fall, phase };
  }, [count]);
  useFrame(({ clock }, delta) => {
    const p = ref.current;
    if (!p || reducedMotion) return;
    const attr = p.geometry.getAttribute('position');
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = (data.pos[i * 3 + 1] ?? 0) - (data.fall[i] ?? 0.5) * delta;
      if (y < 0) y = 14;
      data.pos[i * 3 + 1] = y;
      data.pos[i * 3] = (data.pos[i * 3] ?? 0) + Math.sin(t * 0.6 + (data.phase[i] ?? 0)) * delta * 0.5;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[data.pos, 3]} /></bufferGeometry>
      <pointsMaterial map={glowTexture()} color={color} size={0.42} sizeAttenuation transparent opacity={0.85} depthWrite={false} toneMapped={false} />
    </points>
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

/** Khoảng cách camera theo tỉ lệ khung: khung hẹp (điện thoại) lùi ra để vẫn thấy hai dãy cửa hàng. */
function fitDistance(cam: CityStreetProps['config']['camera'], aspect: number, fixedHalf: number | undefined): number {
  const half = fixedHalf ?? MathUtils.lerp(FIT_HALF_WIDTH_NARROW, FIT_HALF_WIDTH_WIDE, MathUtils.clamp((aspect - 1) / 1.3, 0, 1));
  const need = half / (Math.tan((cam.fov * RAD) / 2) * Math.max(aspect, 0.4));
  return Math.max(cam.distance, need);
}

/** Đặt camera theo khung hình, xử lý nút điều khiển (đi tới/lui, xoay, phóng to/thu nhỏ) và bay tới cửa hàng đang chọn. */
function CameraRig({ config, fitHalfWidth, resetTick, goal, controls, command }: { config: CityStreetProps['config']['camera']; fitHalfWidth: number | undefined; resetTick: number; goal: { x: number; z: number } | null; controls: RefObject<ControlsRef | null>; command: CameraCommand | null }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(size.height, 1);
  const dist = fitDistance(config, aspect, fitHalfWidth);
  const lift = config.height * (dist / config.distance);
  useEffect(() => {
    const c = controls.current;
    camera.position.set(0, lift, config.targetZ + dist);
    if (c) { c.target.set(0, config.targetY, config.targetZ); c.minDistance = dist * 0.42; c.maxDistance = dist * 1.1; c.update(); }
    invalidate();
  }, [resetTick, camera, dist, lift, config.targetY, config.targetZ, controls, invalidate]);
  useEffect(() => {
    const c = controls.current;
    if (!c || !command) return;
    const turn = 0.2;
    const walk = (dz: number): void => {
      const nz = MathUtils.clamp(c.target.z + dz, -18, 8);
      const applied = nz - c.target.z;
      c.target.z = nz;
      camera.position.z += applied;
    };
    switch (command.kind) {
      case 'left': c.setAzimuthalAngle(c.getAzimuthalAngle() - turn); break;
      case 'right': c.setAzimuthalAngle(c.getAzimuthalAngle() + turn); break;
      case 'up': walk(-3.5); break;
      case 'down': walk(3.5); break;
      case 'in': case 'out': {
        const k = command.kind === 'in' ? 0.82 : 1.22;
        camera.position.sub(c.target).multiplyScalar(k).add(c.target);
        break;
      }
    }
    c.update();
    invalidate();
  }, [command, camera, controls, invalidate]);
  useFrame(() => {
    const c = controls.current;
    if (!c || !goal) return;
    c.target.x = MathUtils.lerp(c.target.x, goal.x * 0.3, 0.06);
  });
  return null;
}

/** Cuộn chuột chỉ cuộn trang (phóng to bằng Ctrl/⌘+cuộn, chụm hai ngón hoặc nút +/−); vuốt dọc trên cảm ứng vẫn cuộn trang. */
function GestureGuard() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const wrap = el.parentElement;
    const onWheel = (e: WheelEvent): void => { if (!e.ctrlKey && !e.metaKey) e.stopPropagation(); };
    wrap?.addEventListener('wheel', onWheel, { capture: true, passive: true });
    const id = window.setTimeout(() => { el.style.touchAction = 'pan-y'; }, 0);
    return () => { wrap?.removeEventListener('wheel', onWheel, { capture: true }); window.clearTimeout(id); };
  }, [gl]);
  return null;
}

function Scene({ props }: { props: CityStreetProps }): ReactNode {
  const { config, slots, quality, selectedPlaceId, visiblePlaceIds, onSelectPlace, onSelectDeity, reducedMotion, resetTick, autoRotate, command } = props;
  const colors = useSceneColors();
  const controls = useRef<ControlsRef>(null);
  const cam = config.camera;
  const alphaCover = quality !== 'low';
  const sky = useMemo(() => new Color(colors.sky), [colors.sky]);
  const goal = useMemo(() => {
    const s = slots.find((x) => x.placeId !== null && x.placeId === selectedPlaceId);
    return s ? { x: s.position.x, z: s.position.z } : null;
  }, [slots, selectedPlaceId]);
  const walkers = quality === 'low' ? Math.min(config.pedestrians, 6) : config.pedestrians;
  const decor: readonly DecorItem[] = quality === 'low' ? CITY_DECOR.filter((_, i) => i % 3 !== 1) : CITY_DECOR;
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 70, 170]} />
      <hemisphereLight args={[colors.sidewalk, colors.grass, 1.5]} />
      <directionalLight position={[-12, 24, 16]} intensity={1.6} />
      <Suspense fallback={null}><Backdrop /></Suspense>
      <Suspense fallback={null}><Ground colors={colors} /></Suspense>
      {CITY_LAMPS.map(([x, z]) => <LampPost key={`${x}-${z}`} x={x} z={z} colors={colors} />)}
      {decor.map((it) => (
        <Suspense key={`${it.src}-${it.x}-${it.z}`} fallback={null}>
          <Sprite src={it.src} width={it.width} x={it.x} z={it.z} face={it.face ?? 1} flip={it.flip ?? false} shadow={it.shadow ?? 0.35} shadowColor={colors.ink} alphaCover={alphaCover} />
        </Suspense>
      ))}
      {slots.map((slot) => (
        <CityShop
          key={slot.id} slot={slot} colors={colors} alphaCover={alphaCover}
          selected={slot.placeId !== null && slot.placeId === selectedPlaceId}
          enabled={visiblePlaceIds == null || (slot.placeId !== null && visiblePlaceIds.has(slot.placeId))}
          onSelect={onSelectPlace}
        />
      ))}
      <Suspense fallback={null}><CityDeity colors={colors} reducedMotion={reducedMotion} burstTick={props.burstTick ?? 0} onSelect={onSelectDeity} />
        <CoinShower tick={props.burstTick ?? 0} reducedMotion={reducedMotion} alphaCover={alphaCover} /></Suspense>
      <CitySign lines={config.signLines} colors={colors} />
      {config.sparkles ? (
        <Suspense fallback={null}>{Array.from({ length: quality === 'low' ? 4 : 8 }, (_, i) => <FloatingCoin key={i} index={i} reducedMotion={reducedMotion} alphaCover={alphaCover} />)}</Suspense>
      ) : null}
      {Array.from({ length: walkers }, (_, i) => (
        <Suspense key={i} fallback={null}><CityWalker index={i} colors={colors} reducedMotion={reducedMotion} alphaCover={alphaCover} /></Suspense>
      ))}
      {quality === 'low' ? null : <Petals count={quality === 'high' ? 140 : 80} color={colors.blossom} reducedMotion={reducedMotion} />}
      <OrbitControls
        ref={controls} makeDefault enableDamping dampingFactor={0.08} enablePan={false} autoRotate={autoRotate && !reducedMotion} autoRotateSpeed={0.6}
        minPolarAngle={MathUtils.clamp(cam.minPolarDeg, 5, 85) * RAD} maxPolarAngle={MathUtils.clamp(cam.maxPolarDeg, 20, 86) * RAD}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }} target={[0, cam.targetY, cam.targetZ]}
      />
      <CameraRig config={cam} fitHalfWidth={props.fitHalfWidth} resetTick={resetTick} goal={goal} controls={controls} command={command ?? null} />
      <GestureGuard />
    </>
  );
}

export default function CityStreet(props: CityStreetProps) {
  const { config, quality, maxFps, className } = props;
  const cam = config.camera;
  return (
    <div className={className}>
      <Canvas
        frameloop="demand" dpr={quality === 'low' ? [1, 1.35] : [1, 1.85]}
        camera={{ position: [0, cam.height, cam.targetZ + cam.distance], fov: cam.fov, near: 0.1, far: 500 }}
        gl={{ antialias: quality !== 'low', powerPreference: quality === 'low' ? 'low-power' : 'high-performance' }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 1.1; }}
      >
        <FrameDriver maxFps={maxFps} active={props.active} />
        <Scene props={props} />
      </Canvas>
    </div>
  );
}
