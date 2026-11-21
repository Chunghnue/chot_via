import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { AdditiveBlending, CanvasTexture, DoubleSide, MathUtils, SRGBColorSpace, type Group, type Sprite as SpriteObject } from 'three';
import type { StreetSlotDto } from '@chot-via/shared';
import { SHOP_IMAGES } from '@chot-via/ui';
import { CITY_IMAGES, SHOP_WIDTH, spreadShopX } from './city-assets';
import { aspectOf, glowTexture, Shadow, Sprite, useFaceCamera, useSprite } from './city-kit';
import type { SceneColors } from './colors';
import { Label } from './label';
import { RITUAL_BEATS, RITUAL_SECONDS, RITUAL_SPOT, type RitualScene } from './ritual';

/** Cảnh nghi lễ: Thỉnh Thần Tài (20 giây) và Đốt vía (10 giây), diễn ngay trong thành phố ở trang chủ, trước cửa hàng của người dùng. */

type Start = RefObject<number | null>;
interface Spot { x: number; z: number; own: boolean; width: number }

const clamp01 = (v: number): number => MathUtils.clamp(v, 0, 1);
const smooth = (v: number): number => { const k = clamp01(v); return k * k * (3 - 2 * k); };
/** Số giả ngẫu nhiên cố định theo (chỉ số, khóa): lần nào chạy cũng giống nhau. */
function hash(i: number, k: number): number {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}
/** Thời gian đã trôi của nghi lễ (giây). Khung hình đầu tiên của bất kỳ thành phần nào đặt mốc 0 để mọi thành phần chạy cùng nhịp. */
function ageOf(start: Start, now: number): number {
  if (start.current === null) start.current = now;
  return now - start.current;
}

/** Vị trí cửa hàng cho nghi lễ: nếu cửa hàng đã nằm trên phố thì dùng đúng ô đó, không thì đặt cạnh quảng trường Thần Tài. */
export function ritualSpot(ritual: RitualScene, slots: readonly StreetSlotDto[]): Spot {
  const slot = slots.find((s) => s.placeId === ritual.placeId);
  if (slot) return { x: spreadShopX(slot.position.x, slot.position.z), z: slot.position.z, own: false, width: SHOP_WIDTH[slot.modelKey] };
  return { x: RITUAL_SPOT.x, z: RITUAL_SPOT.z, own: true, width: SHOP_WIDTH[ritual.modelKey] };
}

/** Quầng sáng nở ra rồi tắt, che khoảnh khắc cửa hàng hiện ra hoặc biến đi. */
function Flash({ x, y, z, start, at, size, color }: { x: number; y: number; z: number; start: Start; at: number; size: number; color: string }) {
  const ref = useRef<SpriteObject>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const p = (ageOf(start, clock.elapsedTime) - at) / 0.9;
    m.visible = p >= 0 && p < 1;
    if (m.visible) { const s = size * Math.sin(Math.PI * p); m.scale.set(s, s, 1); }
  });
  return (
    <sprite ref={ref} position={[x, y, z]} visible={false}>
      <spriteMaterial map={glowTexture()} color={color} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

/** Cửa hàng của người dùng hiện ra giữa quầng sáng (chỉ khi cửa hàng chưa có sẵn trên phố). */
function OwnShop({ ritual, spot, colors, alphaCover, start }: { ritual: RitualScene; spot: Spot; colors: SceneColors; alphaCover: boolean; start: Start }) {
  const ref = useRef<Group>(null);
  const seconds = RITUAL_SECONDS[ritual.kind];
  useFrame(({ clock }) => {
    const a = ageOf(start, clock.elapsedTime);
    if (ref.current) ref.current.visible = a > 0.35 && a < seconds - 0.4;
  });
  return (
    <group ref={ref} visible={false}>
      <Sprite src={SHOP_IMAGES[ritual.modelKey]} width={spot.width} x={spot.x} z={spot.z} face={1} shadow={0.4} shadowColor={colors.ink} alphaCover={alphaCover}>
        <Label text={ritual.title} position={[0, spot.width * 0.82, 0.5]} bg={colors.surface} fg={colors.ink} size={1.1} />
      </Sprite>
    </group>
  );
}

/** Cánh cửa gỗ ở mặt tiền: rung theo tiếng gõ rồi mở ra, ánh sáng vàng tràn ra ngoài. */
function ShopDoor({ spot, colors, start }: { spot: Spot; colors: SceneColors; start: Start }) {
  const B = RITUAL_BEATS.invoke;
  const s = spot.width / 7.2;
  const doorW = 1.5 * s;
  const doorH = 2.7 * s;
  const billboard = useRef<Group>(null);
  const leaf = useRef<Group>(null);
  const spill = useRef<SpriteObject>(null);
  const room = useRef<Group>(null);
  useFaceCamera(billboard, 1);
  useFrame(({ clock }) => {
    const a = ageOf(start, clock.elapsedTime);
    if (room.current) room.current.visible = a > 0.35 && a < B.seconds - 0.4;
    const open = smooth((a - B.open) / 1.5);
    let shake = 0;
    for (const k of B.knocks) { const d = a - k; if (d >= 0 && d < 0.2) shake += Math.sin(d * 70) * 0.05 * (1 - d / 0.2); }
    if (leaf.current) leaf.current.rotation.y = -open * 1.75 + shake;
    const m = spill.current;
    if (m) {
      const k = open * (0.85 + 0.15 * Math.sin(a * 9));
      m.visible = open > 0.01;
      m.scale.set(doorW * 4.2 * k, doorH * 2.2 * k, 1);
    }
  });
  return (
    <group position={[spot.x, 0, spot.z + 0.12]}>
      <group ref={billboard}>
        <group ref={room} visible={false}>
          {/* Khung cửa và phần trong cửa sáng vàng */}
          <mesh position={[0, doorH / 2, 0.01]}><planeGeometry args={[doorW, doorH]} /><meshBasicMaterial color={colors.gold} toneMapped={false} /></mesh>
          <mesh position={[0, doorH + 0.07 * s, 0.04]}><boxGeometry args={[doorW + 0.3 * s, 0.14 * s, 0.1]} /><meshStandardMaterial color={colors.trunk} /></mesh>
          {[-1, 1].map((side) => <mesh key={side} position={[side * (doorW / 2 + 0.07 * s), doorH / 2, 0.04]}><boxGeometry args={[0.14 * s, doorH, 0.1]} /><meshStandardMaterial color={colors.trunk} /></mesh>)}
          <sprite ref={spill} position={[0, doorH * 0.5, 0.35]} visible={false}>
            <spriteMaterial map={glowTexture()} color={colors.gold} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
          {/* Cánh cửa: bản lề ở mép trái, mở ra phía người xem */}
          <group ref={leaf} position={[-doorW / 2, 0, 0.06]}>
            <mesh position={[doorW / 2, doorH / 2, 0]}><boxGeometry args={[doorW, doorH, 0.1]} /><meshStandardMaterial color={colors.bench} /></mesh>
            {[0.25, 0.75].map((f) => <mesh key={f} position={[doorW / 2, doorH * f, 0.06]}><boxGeometry args={[doorW * 0.74, doorH * 0.36, 0.03]} /><meshStandardMaterial color={colors.trunk} /></mesh>)}
            <mesh position={[doorW * 0.85, doorH * 0.5, 0.09]}><sphereGeometry args={[0.07 * s, 10, 8]} /><meshStandardMaterial color={colors.gold} metalness={0.6} roughness={0.3} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------- Thỉnh Thần Tài ---------- */

const RUN_SCALE = 0.6;

/** Thần Tài rời bệ, chạy tới cửa hàng, gõ cửa, chúc rồi vung tay tung vàng, cuối cùng chạy về bệ. */
function InvokeDeity({ spot, colors, start }: { spot: Spot; colors: SceneColors; start: Start }) {
  const B = RITUAL_BEATS.invoke;
  const textures = useTexture([...CITY_IMAGES.deityPoses]);
  useMemo(() => { textures.forEach((t) => { t.colorSpace = SRGBColorSpace; t.anisotropy = 8; }); }, [textures]);
  const outer = useRef<Group>(null);
  const shadow = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const bill = useRef<Group>(null);
  const poses = useRef<(Group | null)[]>([]);
  const poseHeight = 5.8;
  const stopX = spot.x + 1.8;
  const stopZ = spot.z + 3.8;
  useFaceCamera(bill, 1);
  useFrame(({ clock }) => {
    const a = ageOf(start, clock.elapsedTime);
    let x = 0; let z = 1; let y = 0.98; let sc = 1; let tilt = 0; let pulse = 0;
    if (a < B.jump) {
      y = 0.98 + Math.sin(a * 5) * 0.1;
    } else if (a < B.run) {
      const p = (a - B.jump) / (B.run - B.jump);
      z = MathUtils.lerp(1, 6.4, p); y = MathUtils.lerp(0.98, 0, p) + Math.sin(Math.PI * p) * 2.4; sc = MathUtils.lerp(1, RUN_SCALE, smooth(p));
    } else if (a < B.arrive) {
      const p = (a - B.run) / (B.arrive - B.run);
      x = MathUtils.lerp(0, stopX, p); z = MathUtils.lerp(6.4, stopZ, p); y = Math.abs(Math.sin(a * 12)) * 0.5; sc = RUN_SCALE; tilt = Math.sin(a * 12) * 0.07;
    } else if (a < B.back) {
      x = stopX; z = stopZ; y = 0; sc = RUN_SCALE;
      for (const k of B.knocks) { const d = (a - k) / 0.35; if (d >= 0 && d < 1) { y = Math.sin(Math.PI * d) * 0.35; tilt = -0.12 * Math.sin(Math.PI * d); } }
      if (a > B.greet - 0.4 && a < B.greet + 1.2) tilt = Math.sin((a - B.greet) * 5) * 0.06;
      for (const k of B.throws) { const d = (a - k) / 0.8; if (d >= 0 && d < 1) { y = Math.sin(Math.PI * d) * 0.55; tilt = -0.3 * Math.sin(Math.PI * d); pulse = 0.12 * Math.sin(Math.PI * d); } }
    } else if (a < B.home) {
      const p = (a - B.back) / (B.home - B.back);
      x = MathUtils.lerp(stopX, 0, smooth(p)); z = MathUtils.lerp(stopZ, 1, smooth(p)); y = MathUtils.lerp(0, 0.98, p) + Math.sin(Math.PI * p) * 2; sc = MathUtils.lerp(RUN_SCALE, 1, smooth(p));
    } else {
      sc = 1 + 0.1 * Math.exp(-6 * (a - B.home)); y = 0.98 + Math.sin(a * 5) * 0.1;
    }
    if (outer.current) outer.current.position.set(x, 0, z);
    if (shadow.current) shadow.current.scale.setScalar(sc * Math.max(0.5, 1.2 - y * 0.12));
    if (inner.current) { inner.current.position.y = y; inner.current.scale.setScalar(sc * (1 + pulse)); inner.current.rotation.z = tilt; }
    const throwing = a > B.throws[0] - 0.2 && a < (B.throws[2] ?? 16) + 1;
    poses.current.forEach((g, i) => { if (g) g.visible = i === (throwing ? 1 : 0); });
  });
  return (
    <group ref={outer} position={[0, 0, 1]}>
      <group ref={shadow}><Shadow size={5} opacity={0.35} color={colors.ink} /></group>
      <group ref={inner} position={[0, 0.98, 0]}>
        <group ref={bill}>
          <sprite position={[0, poseHeight * 0.55, -0.6]} scale={[14, 14, 1]}>
            <spriteMaterial map={glowTexture()} color={colors.gold} transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
          {[0, 1].map((i) => {
            const tex = textures[i];
            if (!tex) return null;
            return (
              <group key={i} ref={(g) => { poses.current[i] = g; }} visible={i === 0}>
                <mesh position={[0, poseHeight / 2, 0]}>
                  <planeGeometry args={[poseHeight * aspectOf(tex), poseHeight]} />
                  <meshBasicMaterial map={tex} alphaTest={0.4} side={DoubleSide} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}

const COINS = 66;
const GRAVITY = 16;

/** Vàng văng tung toé: ba đợt vung tay, mỗi đợt 22 đồng bắn về phía cửa hàng, nảy trên nền rồi nằm lại trước cửa. */
function InvokeCoins({ spot, start, alphaCover }: { spot: Spot; start: Start; alphaCover: boolean }) {
  const B = RITUAL_BEATS.invoke;
  const tex = useSprite(CITY_IMAGES.coin);
  const refs = useRef<(SpriteObject | null)[]>([]);
  const state = useRef({ p: new Float32Array(COINS * 3), v: new Float32Array(COINS * 3), alive: new Uint8Array(COINS) });
  const originX = spot.x + 1.8 - 0.9;
  const originZ = spot.z + 3.8 - 0.4;
  const dx = spot.x - originX;
  const dz = spot.z + 0.6 - originZ;
  const len = Math.hypot(dx, dz) || 1;
  useFrame(({ clock }, delta) => {
    const a = ageOf(start, clock.elapsedTime);
    const dt = Math.min(delta, 0.05);
    const { p, v, alive } = state.current;
    for (let i = 0; i < COINS; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const birth = (B.throws[i % 3] ?? 13) + 0.12 + Math.floor(i / 3) * 0.022;
      if (!alive[i] && a >= birth && a < birth + 0.5) {
        const speed = 2 + hash(i, 1) * 3.5;
        p[i * 3] = originX; p[i * 3 + 1] = 2.6; p[i * 3 + 2] = originZ;
        v[i * 3] = (dx / len) * speed + (hash(i, 2) - 0.5) * 4;
        v[i * 3 + 1] = 6 + hash(i, 4) * 6;
        v[i * 3 + 2] = (dz / len) * speed * 0.7 + (hash(i, 3) - 0.2) * 4;
        alive[i] = 1;
      }
      if (!alive[i]) { m.visible = false; continue; }
      let x = p[i * 3] ?? 0; let y = p[i * 3 + 1] ?? 0; let z = p[i * 3 + 2] ?? 0;
      let vx = v[i * 3] ?? 0; let vy = v[i * 3 + 1] ?? 0; let vz = v[i * 3 + 2] ?? 0;
      vy -= GRAVITY * dt; x += vx * dt; y += vy * dt; z += vz * dt;
      if (y < 0.18) { y = 0.18; vy = Math.abs(vy) > 1.2 ? -vy * 0.42 : 0; vx *= 0.7; vz *= 0.7; }
      if (z < spot.z + 0.35) { z = spot.z + 0.35; vz = Math.abs(vz) * 0.3; }
      p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; v[i * 3] = vx; v[i * 3 + 1] = vy; v[i * 3 + 2] = vz;
      const flying = y > 0.3;
      const fade = clamp01((B.home - 0.2 - a) / 0.8);
      const size = 0.85 * fade;
      m.visible = fade > 0.01;
      m.position.set(x, y, z);
      m.scale.set((flying ? Math.cos(a * 14 + i) : 1) * size, size, 1);
    }
  });
  return (
    <group>
      {Array.from({ length: COINS }, (_, i) => (
        <sprite key={i} ref={(m) => { refs.current[i] = m; }} visible={false}>
          <spriteMaterial map={tex} alphaTest={0.4} alphaToCoverage={alphaCover} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

/** Tia sáng vàng bừng lên mỗi lần Thần Tài vung tay. */
function ThrowFlashes({ spot, start, colors }: { spot: Spot; start: Start; colors: SceneColors }) {
  return (
    <>
      {RITUAL_BEATS.invoke.throws.map((at) => <Flash key={at} x={spot.x + 0.4} y={2.6} z={spot.z + 3.2} start={start} at={at} size={9} color={colors.gold} />)}
    </>
  );
}

/* ---------- Đốt vía ---------- */

/** Người đốt vía là một người nhỏ bước ra từ hông cửa hàng (ảnh gốc cao khoảng 1,4 m, cửa hàng cao hơn 6 m). */
const PERSON_SCALE = 1.05;
const PAPER_H = 1.1;
const HAND_Y = 1.15;
const SMOKE = 16;
const SMOKE_LIFE = 3.2;
const EMBERS = 14;
const BLESS = 22;

/** Vẽ hình ngọn lửa (giọt nước nhọn đầu) vào canvas, tâm ở (cx, cy), cao `h`. */
function drawFlame(g: CanvasRenderingContext2D, cx: number, cy: number, h: number): void {
  const k = h / 140;
  const x = (v: number): number => cx + (v - 64) * k;
  const y = (v: number): number => cy + (v - 75) * k;
  g.beginPath();
  g.moveTo(x(64), y(8));
  g.bezierCurveTo(x(70), y(40), x(108), y(62), x(100), y(106));
  g.bezierCurveTo(x(96), y(140), x(32), y(140), x(28), y(106));
  g.bezierCurveTo(x(24), y(80), x(48), y(70), x(52), y(44));
  g.bezierCurveTo(x(58), y(56), x(62), y(40), x(64), y(8));
  g.closePath();
  g.fill();
}

/** Hình ngọn lửa trắng (màu do vật liệu quyết định) để xếp ba lớp đỏ – cam – vàng. */
function useFlameTexture(): CanvasTexture | null {
  const map = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 160;
    const g = cv.getContext('2d');
    if (!g) return null;
    g.fillStyle = '#fff';
    drawFlame(g, 64, 80, 150);
    return new CanvasTexture(cv);
  }, []);
  useEffect(() => () => { map?.dispose(); }, [map]);
  return map;
}

/** Tờ giấy đốt vía vẽ bằng canvas: giấy vàng viền đỏ, hình ngọn lửa và chữ "VÍA". */
function usePaperTexture(colors: SceneColors): CanvasTexture | null {
  const map = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 176;
    const g = cv.getContext('2d');
    if (!g) return null;
    g.fillStyle = colors.gold; g.fillRect(0, 0, 128, 176);
    g.strokeStyle = colors.red; g.lineWidth = 8; g.strokeRect(8, 8, 112, 160);
    g.fillStyle = colors.red; g.font = '800 34px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    drawFlame(g, 64, 66, 76);
    g.fillText('VÍA', 64, 132);
    const tex = new CanvasTexture(cv);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [colors.gold, colors.red]);
  useEffect(() => () => { map?.dispose(); }, [map]);
  return map;
}

/** Người cầm tờ giấy đốt vía đi đi lại lại trước cửa hàng; giấy cháy dần từ trên xuống, khói bay lên, cuối cùng cửa hàng sáng vàng. */
function BurnActors({ spot, colors, start, alphaCover }: { spot: Spot; colors: SceneColors; start: Start; alphaCover: boolean }) {
  const B = RITUAL_BEATS.burn;
  const tex = useSprite(CITY_IMAGES.walkers[0]);
  const paper = usePaperTexture(colors);
  const flameTex = useFlameTexture();
  const root = useRef<Group>(null);
  const face = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const hand = useRef<Group>(null);
  const sheet = useRef<Group>(null);
  const flames = useRef<(SpriteObject | null)[]>([]);
  const glow = useRef<SpriteObject>(null);
  const embers = useRef<(SpriteObject | null)[]>([]);
  const smoke = useRef<(SpriteObject | null)[]>([]);
  const bless = useRef<(SpriteObject | null)[]>([]);
  const bustH = 1.4;
  const bustW = bustH * aspectOf(tex);
  const baseZ = spot.z + 4.2;
  /** Người bước ra từ hông cửa hàng (mép phải), đi tiến ra trước cửa rồi mới đi đi lại lại. */
  const startX = spot.x + spot.width * 0.5;
  const startZ = spot.z + 0.9;
  const personZ = (a: number): number => MathUtils.lerp(startZ, baseZ, smooth(a / 1.8));
  useFaceCamera(face, 1);

  const pace = (a: number): number => spot.x + 1.6 + 2.4 * Math.sin(0.8 * (Math.min(a, B.ash) - B.enter));
  const personX = (a: number): number => MathUtils.lerp(startX, pace(a), smooth(a / 1.8));
  const burned = (a: number): number => clamp01((a - B.ignite) / (B.ash - B.ignite));

  useFrame(({ clock }) => {
    const a = ageOf(start, clock.elapsedTime);
    const walking = a < B.ash;
    const dirx = Math.cos(0.8 * (Math.min(a, B.ash) - B.enter)) >= 0 ? 1 : -1;
    const x = personX(a);
    const swing = walking ? Math.sin(a * 7) * 0.55 : 0;
    if (root.current) { root.current.position.set(x, 0, personZ(a)); root.current.scale.setScalar(PERSON_SCALE); }
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (face.current) {
      face.current.position.y = walking ? Math.abs(Math.sin(a * 7)) * 0.05 : 0;
      face.current.rotation.z = a > B.ash ? Math.sin(Math.min(1, (a - B.ash) / 0.8) * Math.PI) * 0.16 : 0;
    }
    if (hand.current) { hand.current.position.set(dirx * 0.5, HAND_Y, 0.25); hand.current.rotation.z = Math.sin(a * 5) * 0.2; }
    const b = burned(a);
    const left = 1 - b;
    if (sheet.current) { sheet.current.scale.y = Math.max(0.001, left); sheet.current.visible = left > 0.01; }
    // Lửa trên mép giấy: ba lớp đỏ – cam – vàng nhấp nháy
    const lit = smoothFlame(a, B.ignite, B.ash);
    const flameY = PAPER_H * left + 0.05;
    flames.current.forEach((m, i) => {
      if (!m) return;
      m.visible = lit > 0.01;
      const k = lit * (1 + 0.16 * Math.sin(a * 23 + i * 2) + 0.08 * Math.sin(a * 41 + i));
      const size = [0.62, 0.44, 0.28][i] ?? 0.3;
      const h = size * 1.3 * k;
      m.position.set(0, flameY + h * 0.42, 0.08 + i * 0.01);
      m.scale.set(size * k, h, 1);
    });
    if (glow.current) { glow.current.visible = lit > 0.01; glow.current.position.y = flameY + 0.25; }
    // Tàn lửa bay lên từ mép giấy
    embers.current.forEach((m, i) => {
      if (!m) return;
      const t = (a * 1.1 + hash(i, 5) * 2) % 1.4;
      m.visible = lit > 0.5 && walking;
      m.position.set(x + (dirx * 0.5 + Math.sin(i * 7 + a * 3) * 0.3 * t) * PERSON_SCALE, (HAND_Y + flameY) * PERSON_SCALE + t * 1.1, personZ(a) + 0.3);
      const s = 0.2 * (1 - t / 1.4);
      m.scale.set(s, s, 1);
    });
    // Khói: mỗi cụm sinh ra ở chỗ giấy lúc đó rồi bay lên, nở ra và nhạt dần
    smoke.current.forEach((m, i) => {
      if (!m) return;
      const first = B.ignite + (i * SMOKE_LIFE) / SMOKE;
      if (a < first) { m.visible = false; return; }
      const born = first + Math.floor((a - first) / SMOKE_LIFE) * SMOKE_LIFE;
      const age = a - born;
      if (born > B.ash + 0.2) { m.visible = false; return; }
      const ex = personX(born);
      const edir = Math.cos(0.8 * (Math.min(born, B.ash) - B.enter)) >= 0 ? 1 : -1;
      m.visible = true;
      m.position.set(ex + edir * 0.5 * PERSON_SCALE + Math.sin(i * 1.7) * 0.5 * age, (HAND_Y + PAPER_H * (1 - burned(born))) * PERSON_SCALE + 0.3 + age * 1.1 + age * age * 0.3, personZ(born) + 0.4);
      const s = 0.45 + age * 0.9;
      m.scale.set(s, s, 1);
      m.material.opacity = 0.42 * (1 - age / SMOKE_LIFE);
    });
    // Lộc vàng bay lên quanh cửa hàng khi giấy cháy hết
    bless.current.forEach((m, i) => {
      if (!m) return;
      const age = a - B.ash - hash(i, 6) * 0.6;
      m.visible = age >= 0 && age < 1.6;
      if (!m.visible) return;
      m.position.set(spot.x + (hash(i, 7) - 0.5) * spot.width * 0.9, 0.6 + age * 1.9 + hash(i, 8) * 1.8, spot.z + 0.7);
      const s = 0.55 * Math.sin((Math.PI * age) / 1.6);
      m.scale.set(s, s, 1);
    });
  });

  return (
    <>
      <group ref={root}>
        <Shadow size={1.8} opacity={0.3} color={colors.ink} />
        <group ref={legL} position={[-0.16, 0.62, 0]}><mesh position={[0, -0.31, 0]}><boxGeometry args={[0.2, 0.62, 0.22]} /><meshStandardMaterial color={colors.personHair} /></mesh></group>
        <group ref={legR} position={[0.16, 0.62, 0]}><mesh position={[0, -0.31, 0]}><boxGeometry args={[0.2, 0.62, 0.22]} /><meshStandardMaterial color={colors.personHair} /></mesh></group>
        <group ref={face}>
          <mesh position={[0, 0.58 + bustH / 2, 0]}>
            <planeGeometry args={[bustW, bustH]} />
            <meshBasicMaterial map={tex} alphaTest={0.4} alphaToCoverage={alphaCover} side={DoubleSide} toneMapped={false} />
          </mesh>
          <group ref={hand}>
            <group ref={sheet}>
              <mesh position={[0, PAPER_H / 2, 0.06]}>
                <planeGeometry args={[PAPER_H * 0.72, PAPER_H]} />
                {paper ? <meshBasicMaterial map={paper} side={DoubleSide} toneMapped={false} /> : <meshBasicMaterial color={colors.gold} side={DoubleSide} />}
              </mesh>
            </group>
            {[colors.red, colors.wish, colors.gold].map((c, i) => (
              <sprite key={c + i} ref={(m) => { flames.current[i] = m; }} visible={false}>
                <spriteMaterial map={flameTex} color={c} transparent depthWrite={false} toneMapped={false} />
              </sprite>
            ))}
            <sprite ref={glow} position={[0, PAPER_H * 0.9, 0.02]} scale={[2.2, 2.2, 1]} visible={false}>
              <spriteMaterial map={glowTexture()} color={colors.wish} transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
            </sprite>
          </group>
        </group>
      </group>
      {Array.from({ length: EMBERS }, (_, i) => (
        <sprite key={i} ref={(m) => { embers.current[i] = m; }} visible={false}>
          <spriteMaterial map={glowTexture()} color={i % 2 === 0 ? colors.wish : colors.gold} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
      {Array.from({ length: SMOKE }, (_, i) => (
        <sprite key={i} ref={(m) => { smoke.current[i] = m; }} visible={false}>
          <spriteMaterial map={glowTexture()} color={colors.stone} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
      {Array.from({ length: BLESS }, (_, i) => (
        <sprite key={i} ref={(m) => { bless.current[i] = m; }} visible={false}>
          <spriteMaterial map={glowTexture()} color={colors.gold} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
      <Flash x={spot.x} y={2.5} z={spot.z + 0.8} start={start} at={B.ash} size={spot.width * 2.2} color={colors.gold} />
    </>
  );
}

/** Lửa bốc lên rồi tắt hẳn khi giấy cháy hết. */
function smoothFlame(a: number, ignite: number, ash: number): number {
  return smooth((a - ignite + 0.4) / 0.6) * (1 - smooth((a - ash + 0.3) / 0.5));
}

/* ---------- Gộp ---------- */

function RitualActors({ ritual, slots, colors, alphaCover, start, onStart }: { ritual: RitualScene; slots: readonly StreetSlotDto[]; colors: SceneColors; alphaCover: boolean; start: Start; onStart: ((tick: number) => void) | undefined }) {
  const spot = ritualSpot(ritual, slots);
  const seconds = RITUAL_SECONDS[ritual.kind];
  const reported = useRef(false);
  // Chạy sau khi mọi hình đã tải xong (Suspense): đây là lúc đặt mốc 0 và báo cho trang biết nghi lễ bắt đầu.
  useFrame(({ clock }) => {
    if (reported.current) return;
    reported.current = true;
    ageOf(start, clock.elapsedTime);
    onStart?.(ritual.tick);
  });
  return (
    <>
      <Flash x={spot.x} y={2.6} z={spot.z + 0.8} start={start} at={0} size={spot.width * 1.9} color={colors.gold} />
      <Flash x={spot.x} y={2.6} z={spot.z + 0.8} start={start} at={seconds - 0.9} size={spot.width * 1.6} color={colors.gold} />
      {spot.own ? <OwnShop ritual={ritual} spot={spot} colors={colors} alphaCover={alphaCover} start={start} /> : null}
      {ritual.kind === 'invoke' ? (
        <>
          <ShopDoor spot={spot} colors={colors} start={start} />
          <InvokeDeity spot={spot} colors={colors} start={start} />
          <InvokeCoins spot={spot} start={start} alphaCover={alphaCover} />
          <ThrowFlashes spot={spot} start={start} colors={colors} />
        </>
      ) : <BurnActors spot={spot} colors={colors} start={start} alphaCover={alphaCover} />}
    </>
  );
}

/** Dựng một lần chạy nghi lễ. Gắn `key={ritual.tick}` ở nơi dùng để mỗi lần bấm là bắt đầu lại từ đầu. */
export function RitualStage(props: { ritual: RitualScene; slots: readonly StreetSlotDto[]; colors: SceneColors; alphaCover: boolean; onStart: ((tick: number) => void) | undefined }) {
  const start = useRef<number | null>(null);
  return (
    <Suspense fallback={null}>
      <RitualActors {...props} start={start} />
    </Suspense>
  );
}
