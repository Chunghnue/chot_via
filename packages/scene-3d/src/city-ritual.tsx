import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { AdditiveBlending, CanvasTexture, DoubleSide, MathUtils, SRGBColorSpace, type Group, type Sprite as SpriteObject } from 'three';
import type { SceneModelKey, StreetSlotDto } from '@chot-via/shared';
import { SHOP_IMAGES } from '@chot-via/ui';
import { CITY_IMAGES, doorOf, RITUAL_DEITY_GLB, SHOP_DOOR, SHOP_WIDTH, spreadShopX } from './city-assets';
import { glowTexture, Shadow, Sprite, useFaceCamera, useSprite } from './city-kit';
import type { SceneColors } from './colors';
import { Label } from './label';
import { DeityGlbFigure } from './deity-glb';
import { DeityWalker, newPose, type DeityPose } from './deity-walker';
import { HOLD_ARM_EULER, Mascot, MASCOT_HAND, type MascotRig } from './mascot';
import { RITUAL_BEATS, RITUAL_SECONDS, RITUAL_SPOT, type RitualScene } from './ritual';

/** Cảnh nghi lễ: Thỉnh Thần Tài (20 giây) và Đốt vía (10 giây), diễn ngay trong thành phố ở trang chủ, trước cửa hàng của người dùng. */

type Start = RefObject<number | null>;
/** Chỗ cửa hàng trong cảnh: `x` là tâm cửa hàng, `doorX` là chỗ cánh cửa thật (lệch tâm theo từng kiểu cửa hàng). */
interface Spot { x: number; z: number; own: boolean; width: number; modelKey: SceneModelKey; doorX: number }

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
  const modelKey = slot ? slot.modelKey : ritual.modelKey;
  const width = SHOP_WIDTH[modelKey];
  const x = slot ? spreadShopX(slot.position.x, slot.position.z) : RITUAL_SPOT.x;
  return { x, z: slot ? slot.position.z : RITUAL_SPOT.z, own: !slot, width, modelKey, doorX: x + SHOP_DOOR[modelKey].x * width };
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
/** Lịch của cánh cửa: mở trong [openFrom, openTo], nếu có `closeFrom/closeTo` thì đóng lại; `knocks` là các lần gõ cửa; `seconds` là lúc cả cảnh kết thúc. */
interface DoorPlan { openFrom: number; openTo: number; closeFrom?: number; closeTo?: number; knocks: readonly number[]; seconds: number }

function ShopDoor({ spot, colors, start, plan }: { spot: Spot; colors: SceneColors; start: Start; plan: DoorPlan }) {
  const door = doorOf(spot.modelKey, spot.width);
  const doorW = door.w;
  const doorH = door.h;
  const s = doorW / 1.5;
  const billboard = useRef<Group>(null);
  const leaf = useRef<Group>(null);
  const spill = useRef<SpriteObject>(null);
  const room = useRef<Group>(null);
  useFaceCamera(billboard, 1);
  useFrame(({ clock }) => {
    const a = ageOf(start, clock.elapsedTime);
    if (room.current) room.current.visible = a > 0.35 && a < plan.seconds - 0.4;
    const opened = smooth((a - plan.openFrom) / (plan.openTo - plan.openFrom));
    const closed = plan.closeFrom === undefined || plan.closeTo === undefined ? 0 : smooth((a - plan.closeFrom) / (plan.closeTo - plan.closeFrom));
    const open = opened * (1 - closed);
    let shake = 0;
    for (const k of plan.knocks) { const d = a - k; if (d >= 0 && d < 0.2) shake += Math.sin(d * 70) * 0.05 * (1 - d / 0.2); }
    if (leaf.current) leaf.current.rotation.y = -open * 1.75 + shake;
    const m = spill.current;
    if (m) {
      const k = open * (0.85 + 0.15 * Math.sin(a * 9));
      m.visible = open > 0.01;
      m.scale.set(doorW * 4.2 * k, doorH * 2.2 * k, 1);
    }
  });
  return (
    <group position={[spot.doorX, door.y, spot.z + 0.12]}>
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

/** Mặt trên bệ Thần Tài (m). */
const PEDESTAL_Y = 0.98;
/** Tâm bệ trong cảnh (đúng chỗ `CityDeity` đặt). */
const PEDESTAL: { x: number; z: number } = { x: 0, z: 1 };
/** Ba bậc của bệ: bán kính mép bậc (m, tính từ tâm) và độ cao bậc đó so với bậc dưới. Cộng lại đúng 0,98 m như bệ trong cảnh. */
const STAIRS: readonly { r: number; rise: number }[] = [{ r: 4.65, rise: 0.34 }, { r: 3.95, rise: 0.32 }, { r: 3.25, rise: 0.32 }];

/** Độ cao mặt đất tại điểm (x, z): 0 ngoài bệ, lên dần theo từng bậc khi vào gần tâm. `soft` là nửa bề rộng chỗ chuyển bậc (m). */
function groundAt(x: number, z: number, soft: number): number {
  const r = Math.hypot(x - PEDESTAL.x, z - PEDESTAL.z);
  let h = 0;
  for (const s of STAIRS) h += s.rise * (1 - smooth((r - s.r + soft) / (2 * soft)));
  return h;
}

/** Chỗ Thần Tài đứng trước cửa hàng, tính từ cánh cửa thật (m): ra phía người xem và lệch phải một chút để không bị chậu hoa che. */
const STOP = { dx: 0.4, dz: 4.1 } as const;
/** Một vòng bước đủ 8 khung hình (hai bước) dài bao nhiêu mét trên mặt đất: chọn để chân khớp tốc độ đi, không trượt. */
const STRIDE = 3.4;

function easeOutBack(t: number): number {
  const k = clamp01(t) - 1;
  return 1 + 2.70158 * k * k * k + 1.70158 * k * k;
}

/**
 * Thần Tài biến hình từ tượng trên bệ (loé sáng vàng) thành Thần Tài đi bộ (hoạt ảnh của chủ dự án), bước xuống bệ rồi đi tới cửa hàng, gõ cửa, chúc,
 * tung vàng, cuối cùng đi về bệ và biến lại thành tượng. Khung hình chọn theo quãng đường đã đi; độ cao theo mặt bậc dưới chân. Có file GLB
 * (`RITUAL_DEITY_GLB`) thì dùng model đó thay cho hoạt ảnh.
 */
function InvokeDeity({ spot, colors, start }: { spot: Spot; colors: SceneColors; start: Start }) {
  const B = RITUAL_BEATS.invoke;
  const outer = useRef<Group>(null);
  const shadow = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const pose = useRef<DeityPose>(newPose());
  const motion = useRef({ x: 0, z: 1, ready: false, phase: 0, move: 0, flip: false, speed: 0, throwId: 0, lastThrow: -1 });
  const stopX = spot.doorX + STOP.dx;
  const stopZ = spot.z + STOP.dz;
  const seconds = RITUAL_SECONDS.invoke;
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = ageOf(start, clock.elapsedTime);
    const m = motion.current;
    // Vị trí theo mốc: đứng trên bệ → đi tới cửa hàng → đứng gõ cửa, chúc, tung vàng → đi về bệ
    let x = PEDESTAL.x; let z = PEDESTAL.z;
    if (a >= B.jump && a < B.arrive) {
      const p = smooth((a - B.jump) / (B.arrive - B.jump));
      x = MathUtils.lerp(PEDESTAL.x, stopX, p); z = MathUtils.lerp(PEDESTAL.z, stopZ, p);
    } else if (a >= B.arrive && a < B.back) {
      x = stopX; z = stopZ;
    } else if (a >= B.back && a < B.home) {
      const p = smooth((a - B.back) / (B.home - B.back));
      x = MathUtils.lerp(stopX, PEDESTAL.x, p); z = MathUtils.lerp(stopZ, PEDESTAL.z, p);
    }
    if (!m.ready) { m.x = x; m.z = z; m.ready = true; }
    const dx = x - m.x;
    const dz = z - m.z;
    const dist = Math.hypot(dx, dz);
    m.x = x; m.z = z;
    m.speed = MathUtils.damp(m.speed, dt > 0 ? dist / dt : 0, 10, dt);
    m.move = MathUtils.damp(m.move, clamp01(m.speed / 0.5), 10, dt);
    m.phase += (dist / STRIDE) * Math.PI * 2;
    if (Math.abs(dx) > 0.0004) m.flip = dx > 0;

    // Các động tác tại chỗ: gõ cửa, chúc, vung tay tung vàng
    let knock = 0;
    for (const k of B.knocks) { const d = (a - k) / 0.35; if (d >= 0 && d < 1) knock = Math.max(knock, Math.sin(Math.PI * d)); }
    let throwing = 0; let throwIdx = -1;
    B.throws.forEach((k, i) => { const d = (a - k) / 0.8; if (d >= 0 && d < 1) { const v = Math.sin(Math.PI * d); if (v > throwing) { throwing = v; throwIdx = i; } } });
    if (throwIdx >= 0 && throwIdx !== m.lastThrow) m.throwId += 1;
    m.lastThrow = throwIdx;
    const greet = smooth((a - (B.greet - 0.4)) / 0.4) * (1 - smooth((a - (B.greet + 1.2)) / 0.3));
    const dp = pose.current;
    dp.mv = m.move; dp.ph = m.phase; dp.flip = m.flip; dp.knock = knock; dp.greet = greet; dp.throwing = throwing; dp.throwId = m.throwId;

    // Biến hình: hiện ra trong ánh sáng vàng ở đầu, biến lại thành tượng ở cuối
    const pop = easeOutBack(a / 0.6);
    const shown = a > 0.02 && a < seconds - 0.12;
    const floor = groundAt(x, z, 0.5);
    const hop = throwing * 0.18 + knock * 0.06;
    if (outer.current) { outer.current.position.set(x, 0, z); outer.current.visible = shown; }
    if (shadow.current) { shadow.current.position.y = floor; shadow.current.scale.setScalar(Math.max(0.5, 1.2 - hop * 0.3) * pop); }
    if (inner.current) { inner.current.position.y = a < B.jump || a >= B.home - 0.01 ? PEDESTAL_Y : floor + hop; inner.current.scale.setScalar(pop); }
  });
  return (
    <group ref={outer} position={[0, 0, 1]} visible={false}>
      <group ref={shadow}><Shadow size={5} opacity={0.35} color={colors.ink} /></group>
      <group ref={inner} position={[0, PEDESTAL_Y, 0]}>
        <sprite position={[0, 2.2, -0.5]} scale={[9, 9, 1]}>
          <spriteMaterial map={glowTexture()} color={colors.gold} transparent opacity={0.38} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
        {RITUAL_DEITY_GLB ? <DeityGlbFigure pose={pose} glb={RITUAL_DEITY_GLB} /> : <DeityWalker pose={pose} colors={colors} />}
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
  const originX = spot.doorX + STOP.dx - 0.9;
  const originZ = spot.z + STOP.dz - 0.4;
  const dx = spot.doorX - originX;
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
        const speed = (2 + hash(i, 1) * 3.5) * Math.max(1, len / 4.2);
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
      {RITUAL_BEATS.invoke.throws.map((at) => <Flash key={at} x={spot.doorX + 0.4} y={2.6} z={spot.z + STOP.dz - 0.6} start={start} at={at} size={9} color={colors.gold} />)}
    </>
  );
}

/* ---------- Đốt vía ---------- */

/** Người đốt vía là nhân vật phi hành gia 3D bước ra từ cửa cửa hàng (cao khoảng 2 m, cửa hàng cao hơn 6 m). */
const PERSON_SCALE = 1.05;
const PAPER_H = 0.85;
/** Góc quay thân tối đa (rad) khi đi ngang: nhìn chếch ba phần tư thay vì dán mặt vào máy quay. */
const WALK_YAW = 0.85;
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
function BurnActors({ spot, colors, start }: { spot: Spot; colors: SceneColors; start: Start }) {
  const B = RITUAL_BEATS.burn;
  const paper = usePaperTexture(colors);
  const flameTex = useFlameTexture();
  const root = useRef<Group>(null);
  const face = useRef<Group>(null);
  const figure = useRef<Group>(null);
  const head = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armFree = useRef<Group>(null);
  const armHold = useRef<Group>(null);
  const hold = useRef<Group>(null);
  const rig: MascotRig = { figure, head, legL, legR, armFree, armHold, hold };
  const sheet = useRef<Group>(null);
  const flames = useRef<(SpriteObject | null)[]>([]);
  const glow = useRef<SpriteObject>(null);
  const embers = useRef<(SpriteObject | null)[]>([]);
  const smoke = useRef<(SpriteObject | null)[]>([]);
  const bless = useRef<(SpriteObject | null)[]>([]);
  const baseZ = spot.z + 4.2;
  /** Người bước ra từ cửa chính của cửa hàng (cửa mở ra rồi mới thấy người), đi tiến ra trước cửa rồi mới đi đi lại lại. */
  const startX = spot.doorX;
  const startZ = spot.z + 0.4;
  const out = (a: number): number => smooth((a - B.enter - 0.4) / 2.2);
  const personZ = (a: number): number => MathUtils.lerp(startZ, baseZ, out(a));
  useFaceCamera(face, 1);

  const pace = (a: number): number => spot.doorX + 1.6 + 2.4 * Math.sin(0.8 * (Math.min(a, B.ash) - B.enter));
  const personX = (a: number): number => MathUtils.lerp(startX, pace(a), out(a));
  const burned = (a: number): number => clamp01((a - B.ignite) / (B.ash - B.ignite));
  const rootScale = (a: number): number => PERSON_SCALE * (0.5 + 0.5 * out(a));
  /** Góc xoay thân quanh trục đứng: quay về phía đang đi (đổi chiều êm ở hai đầu quãng đường), đứng thẳng lại khi giấy cháy hết. */
  const yawOf = (a: number): number => WALK_YAW * MathUtils.clamp(2.5 * Math.cos(0.8 * (Math.min(a, B.ash) - B.enter)), -1, 1) * out(a) * (1 - smooth((a - B.ash) / 0.6));
  /** Vị trí bàn tay cầm giấy trong cảnh tại thời điểm `a` (giả định máy quay nhìn thẳng từ phía trước, như phần còn lại của nghi lễ). */
  const handAt = (a: number): { x: number; z: number } => {
    const k = rootScale(a);
    const yaw = yawOf(a);
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return { x: personX(a) + k * (MASCOT_HAND.x * c + MASCOT_HAND.z * s), z: personZ(a) + k * (-MASCOT_HAND.x * s + MASCOT_HAND.z * c) };
  };

  useFrame(({ clock }) => {
    const a = ageOf(start, clock.elapsedTime);
    const walking = a < B.ash;
    const k = rootScale(a);
    const yaw = yawOf(a);
    const swing = walking ? Math.sin(a * 7) * 0.55 : 0;
    const wave = smooth((a - B.ash) / 0.5);
    if (root.current) { root.current.position.set(personX(a), 0, personZ(a)); root.current.scale.setScalar(k); root.current.visible = a > B.enter + 0.5; }
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (figure.current) { figure.current.position.y = walking ? Math.abs(Math.sin(a * 7)) * 0.05 : 0; figure.current.rotation.y = yaw; }
    if (head.current) { head.current.rotation.y = -yaw * 0.55; head.current.rotation.z = a > B.ash ? Math.sin(Math.min(1, (a - B.ash) / 0.8) * Math.PI) * 0.16 : 0; }
    // Tay rảnh đung đưa khi đi, giơ lên vẫy khi giấy cháy hết; tay cầm hạ xuống
    if (armFree.current) armFree.current.rotation.set(-swing * 0.8 * (1 - wave), 0, -wave * (2.5 + 0.35 * Math.sin(a * 9)));
    if (armHold.current) armHold.current.rotation.set(HOLD_ARM_EULER.x * (1 - wave) + Math.sin(a * 7) * 0.04, 0, HOLD_ARM_EULER.z * (1 - wave));
    if (hold.current) hold.current.rotation.set(0, -yaw * 0.9, Math.sin(a * 5) * 0.12);
    const b = burned(a);
    const left = 1 - b;
    if (sheet.current) { sheet.current.scale.y = Math.max(0.001, left); sheet.current.visible = left > 0.01; }
    // Lửa trên mép giấy: ba lớp đỏ – cam – vàng nhấp nháy
    const lit = smoothFlame(a, B.ignite, B.ash);
    const flameY = PAPER_H * left + 0.05;
    flames.current.forEach((m, i) => {
      if (!m) return;
      m.visible = lit > 0.01;
      const f = lit * (1 + 0.16 * Math.sin(a * 23 + i * 2) + 0.08 * Math.sin(a * 41 + i));
      const size = [0.62, 0.44, 0.28][i] ?? 0.3;
      const h = size * 1.3 * f;
      m.position.set(0, flameY + h * 0.42, 0.08 + i * 0.01);
      m.scale.set(size * f, h, 1);
    });
    if (glow.current) { glow.current.visible = lit > 0.01; glow.current.position.y = flameY + 0.25; }
    // Tàn lửa bay lên từ mép giấy
    const hand = handAt(a);
    embers.current.forEach((m, i) => {
      if (!m) return;
      const t = (a * 1.1 + hash(i, 5) * 2) % 1.4;
      m.visible = lit > 0.5 && walking;
      m.position.set(hand.x + Math.sin(i * 7 + a * 3) * 0.3 * t * k, (MASCOT_HAND.y + flameY) * k + t * 1.1, hand.z + 0.3);
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
      const at = handAt(born);
      m.visible = true;
      m.position.set(at.x + Math.sin(i * 1.7) * 0.5 * age, (MASCOT_HAND.y + PAPER_H * (1 - burned(born))) * rootScale(born) + 0.3 + age * 1.1 + age * age * 0.3, at.z + 0.4);
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
        <group ref={face}>
          <Mascot rig={rig} colors={colors}>
            <group ref={sheet}>
              <mesh position={[PAPER_H * 0.72 * 0.3, PAPER_H / 2, 0]}>
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
          </Mascot>
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
          <ShopDoor spot={spot} colors={colors} start={start} plan={{ openFrom: RITUAL_BEATS.invoke.open, openTo: RITUAL_BEATS.invoke.open + 1.5, knocks: RITUAL_BEATS.invoke.knocks, seconds: RITUAL_SECONDS.invoke }} />
          <InvokeDeity spot={spot} colors={colors} start={start} />
          <Flash x={0} y={2.8} z={1} start={start} at={0} size={11} color={colors.gold} />
          <Flash x={0} y={2.8} z={1} start={start} at={RITUAL_BEATS.invoke.home} size={11} color={colors.gold} />
          <InvokeCoins spot={spot} start={start} alphaCover={alphaCover} />
          <ThrowFlashes spot={spot} start={start} colors={colors} />
        </>
      ) : (
        <>
          <ShopDoor spot={spot} colors={colors} start={start} plan={{ openFrom: 0.5, openTo: 1.2, closeFrom: 2.8, closeTo: 3.5, knocks: [], seconds: RITUAL_SECONDS.burn }} />
          <BurnActors spot={spot} colors={colors} start={start} />
        </>
      )}
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
