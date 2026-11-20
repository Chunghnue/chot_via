import type { SceneColors } from './colors';
import type { GlbQuality } from './glb-street';

type V3 = [number, number, number];
const Mat = ({ c }: { c: string }) => <meshStandardMaterial color={c} />;

/** Bụi cây xén vuông, có chấm hoa. */
function Hedge({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[2.4, 0.8, 0.8]} /><Mat c={colors.leafDark} /></mesh>
      {[-0.8, 0, 0.8].map((x) => <mesh key={x} position={[x, 0.85, 0]}><sphereGeometry args={[0.32, 8, 6]} /><Mat c={colors.leafLight} /></mesh>)}
    </group>
  );
}

/** Bồn hoa: chậu đá + cụm hoa hồng. */
function Planter({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.6, 0.5, 0.6, 12]} /><Mat c={colors.stone} /></mesh>
      <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.55, 10, 8]} /><Mat c={colors.leafLight} /></mesh>
      {[[-0.3, 1, 0.1], [0.3, 1.05, -0.1], [0, 1.2, 0.2], [0.1, 0.95, 0.35]].map((q, i) => <mesh key={i} position={q as V3}><sphereGeometry args={[0.2, 8, 6]} /><Mat c={i % 2 ? colors.blossomDark : colors.blossom} /></mesh>)}
    </group>
  );
}

/** Đèn lồng đỏ treo trên cột. */
function Lantern({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.06, 0.08, 3.2, 8]} /><Mat c={colors.metal} /></mesh>
      <mesh position={[0.5, 3.1, 0]}><boxGeometry args={[1, 0.06, 0.06]} /><Mat c={colors.metal} /></mesh>
      <mesh position={[0.95, 2.7, 0]} scale={[1, 1.2, 1]}><sphereGeometry args={[0.36, 12, 10]} /><meshStandardMaterial color={colors.red} emissive={colors.red} emissiveIntensity={0.35} /></mesh>
      <mesh position={[0.95, 3.05, 0]}><cylinderGeometry args={[0.12, 0.12, 0.08, 8]} /><Mat c={colors.deityGold} /></mesh>
    </group>
  );
}

/** Cờ phướn "Chốt Vía" (nền đỏ, viền vàng). */
function Banner({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[0.05, 0.05, 3.8, 6]} /><Mat c={colors.metal} /></mesh>
      <mesh position={[0.4, 2.6, 0]}><boxGeometry args={[0.7, 1.7, 0.05]} /><Mat c={colors.red} /></mesh>
      <mesh position={[0.4, 2.6, 0.04]}><boxGeometry args={[0.5, 1.5, 0.03]} /><Mat c={colors.deityGold} /></mesh>
      <mesh position={[0.4, 2.6, 0.07]}><circleGeometry args={[0.18, 10]} /><Mat c={colors.leafLight} /></mesh>
    </group>
  );
}

function Rocks({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.4, 0]} scale={[1.2, 0.8, 1]}><icosahedronGeometry args={[0.7, 0]} /><Mat c={colors.stone} /></mesh>
      <mesh position={[0.9, 0.25, 0.3]} scale={[1, 0.7, 0.9]}><icosahedronGeometry args={[0.45, 0]} /><Mat c={colors.stone} /></mesh>
    </group>
  );
}

/** Cây mai vàng. */
function MaiTree({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p} scale={1.6}>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.13, 0.2, 1.8, 7]} /><Mat c={colors.trunk} /></mesh>
      {[[0, 2.2, 0, 0.9], [-0.55, 1.8, 0.1, 0.62], [0.55, 1.9, -0.1, 0.65]].map(([x, y, z, r], i) => <mesh key={i} position={[x ?? 0, y ?? 0, z ?? 0]}><icosahedronGeometry args={[r ?? 0.6, 1]} /><Mat c={colors.mai} /></mesh>)}
    </group>
  );
}

/** Bàn ghế ngoài trời có dù. */
function TableSet({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.7, 0.7, 0.07, 14]} /><Mat c={colors.bench} /></mesh>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.07, 0.07, 0.8, 6]} /><Mat c={colors.metal} /></mesh>
      <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[0.04, 0.04, 2.2, 6]} /><Mat c={colors.metal} /></mesh>
      <mesh position={[0, 2.85, 0]}><coneGeometry args={[1.5, 0.55, 12]} /><Mat c={colors.red} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 1, 0.45, 0]}><boxGeometry args={[0.5, 0.9, 0.5]} /><Mat c={colors.bench} /></mesh>)}
    </group>
  );
}

/** Quầy sự kiện / quầy tặng vía: thân gỗ, mái che sọc đỏ - vàng, hộp quà. */
function Stall({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.6, 0]}><boxGeometry args={[2.4, 1.2, 1.1]} /><Mat c={colors.bench} /></mesh>
      {[-1.1, 1.1].map((x) => <mesh key={x} position={[x, 1.6, 0.45]}><cylinderGeometry args={[0.05, 0.05, 2.2, 6]} /><Mat c={colors.metal} /></mesh>)}
      {[-0.75, -0.25, 0.25, 0.75].map((x, i) => <mesh key={x} position={[x, 2.75, 0.2]} rotation={[0.35, 0, 0]}><boxGeometry args={[0.5, 0.06, 1.5]} /><Mat c={i % 2 ? colors.stripe : colors.red} /></mesh>)}
      <mesh position={[-0.5, 1.35, 0.1]}><boxGeometry args={[0.4, 0.3, 0.4]} /><Mat c={colors.red} /></mesh>
      <mesh position={[0.5, 1.3, 0.1]}><sphereGeometry args={[0.25, 8, 8]} /><Mat c={colors.deityGold} /></mesh>
    </group>
  );
}

/** Cổng chào phố: hai trụ đỏ, xà ngang đỏ viền vàng, hai nút vàng trên đỉnh. */
function Gate({ z, colors }: { z: number; colors: SceneColors }) {
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 6.4, 0, 0]}>
          <mesh position={[0, 2.2, 0]}><boxGeometry args={[0.7, 4.4, 0.7]} /><Mat c={colors.red} /></mesh>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[1.1, 0.3, 1.1]} /><Mat c={colors.stone} /></mesh>
          <mesh position={[0, 4.65, 0]}><sphereGeometry args={[0.4, 10, 8]} /><Mat c={colors.deityGold} /></mesh>
        </group>
      ))}
      <mesh position={[0, 4.35, 0]}><boxGeometry args={[13.6, 0.8, 0.6]} /><Mat c={colors.red} /></mesh>
      <mesh position={[0, 4.35, 0.32]}><boxGeometry args={[11.2, 0.5, 0.05]} /><Mat c={colors.deityGold} /></mesh>
      <mesh position={[0, 4.9, 0]}><boxGeometry args={[14.4, 0.25, 0.9]} /><Mat c={colors.deityGold} /></mesh>
    </group>
  );
}

/** Chòi nghỉ: sàn tròn, 4 cột, mái nón đỏ. */
function Gazebo({ p, colors }: { p: V3; colors: SceneColors }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[2.6, 2.8, 0.3, 8]} /><Mat c={colors.tileA} /></mesh>
      {[[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]].map(([x, z], i) => <mesh key={i} position={[x ?? 0, 1.7, z ?? 0]}><cylinderGeometry args={[0.13, 0.13, 3, 6]} /><Mat c={colors.red} /></mesh>)}
      <mesh position={[0, 3.9, 0]}><coneGeometry args={[3.5, 1.6, 8]} /><Mat c={colors.bench} /></mesh>
      <mesh position={[0, 4.8, 0]}><sphereGeometry args={[0.2, 8, 6]} /><Mat c={colors.deityGold} /></mesh>
    </group>
  );
}

/** Cầu cảnh đỏ bắc qua con suối nhỏ cuối phố. */
function Bridge({ z, colors }: { z: number; colors: SceneColors }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, -0.02, 0]}><boxGeometry args={[60, 0.06, 4]} /><meshStandardMaterial color={colors.water} transparent opacity={0.85} /></mesh>
      {[-1, 0, 1].map((i) => <mesh key={i} position={[i * 1.5, i === 0 ? 0.75 : 0.45, 0]} rotation={[0, 0, i * -0.18]}><boxGeometry args={[1.6, 0.18, 3]} /><Mat c={colors.bench} /></mesh>)}
      {[-1, 1].map((s) => (
        <group key={s}>
          {[-2.2, -1.1, 0, 1.1, 2.2].map((x) => <mesh key={x} position={[x, 1.05 - Math.abs(x) * 0.18, s * 1.4]}><cylinderGeometry args={[0.07, 0.07, 0.8, 5]} /><Mat c={colors.red} /></mesh>)}
          <mesh position={[0, 1.5, s * 1.4]}><boxGeometry args={[4.8, 0.12, 0.14]} /><Mat c={colors.red} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Đồ trang trí phố theo poster "Bộ 3D Assets": cổng chào, cầu cảnh, chòi nghỉ, cây mai, bụi cây, bồn hoa, đá cảnh, đèn lồng, cờ phướn, quầy và bàn ghế ngoài trời. Dựng bằng hình khối, màu lấy từ token theme. */
export function Decor({ colors, quality }: { colors: SceneColors; quality: GlbQuality }) {
  const full = quality !== 'low';
  return (
    <>
      <Gate z={-38} colors={colors} />
      {full ? (
        <>
          {[7, -7, -17, -24].flatMap((z) => [-1, 1].map((s) => <Hedge key={`h${s}${z}`} p={[s * 8.4, 0, z]} colors={colors} />))}
          {[3, -12, -21].flatMap((z) => [-1, 1].map((s) => <Planter key={`p${s}${z}`} p={[s * 8.2, 0, z]} colors={colors} />))}
          {[6, -4, -14].flatMap((z) => [-1, 1].map((s) => <group key={`l${s}${z}`} scale={[-s, 1, 1]}><Lantern p={[-6.6, 0, z]} colors={colors} /></group>))}
          {[-20, -2].map((z) => [-1, 1].map((s) => <Banner key={`b${s}${z}`} p={[s * 5.2, 0, z]} colors={colors} />))}
          <Rocks p={[-9.5, 0, -30]} colors={colors} />
          <Rocks p={[9.5, 0, -30]} colors={colors} />
          {[3, -7, -17].flatMap((z) => [-1, 1].map((s) => <MaiTree key={`m${s}${z}`} p={[s * 17, 0, z]} colors={colors} />))}
          <TableSet p={[-7.4, 0, -12]} colors={colors} />
          <TableSet p={[7.4, 0, -14]} colors={colors} />
          <Stall p={[-4.6, 0, 11]} colors={colors} />
          <Stall p={[4.6, 0, 11]} colors={colors} />
          <Bridge z={-32} colors={colors} />
          <Gazebo p={[0, 0, -48]} colors={colors} />
        </>
      ) : null}
    </>
  );
}
