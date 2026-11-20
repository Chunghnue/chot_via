import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, ExtrudeGeometry, LatheGeometry, Shape, Vector2, type Group } from 'three';
import type { Palette } from './palette';

interface DeityModelProps {
  palette: Palette;
  reducedMotion: boolean;
  onSelect?: () => void;
}

const COIN_COUNT = 9;
const STAR_COUNT = 7;

/** Biên dạng tròn xoay (bán kính, độ cao) của áo choàng Thần Tài. */
function robeProfile(): Vector2[] {
  const points: Array<[number, number]> = [
    [0, 0], [1.62, 0], [1.68, 0.12], [1.55, 0.55], [1.3, 1.05], [1.12, 1.5], [0.95, 1.85], [0.82, 2.05], [0, 2.1],
  ];
  return points.map(([r, y]) => new Vector2(r, y));
}

/** Biên dạng râu dài dưới cằm. */
function beardProfile(): Vector2[] {
  const points: Array<[number, number]> = [[0, 0], [0.1, 0.1], [0.3, 0.4], [0.45, 0.8], [0.5, 1.15], [0.4, 1.34], [0, 1.4]];
  return points.map(([r, y]) => new Vector2(r, y));
}

/** Cánh mũ (cánh chuồn): hình thuôn tròn, đùn khối mỏng. */
function wingGeometry(depth: number, grow: number): ExtrudeGeometry {
  const w = 0.95 + grow;
  const h = 0.36 + grow;
  const shape = new Shape();
  shape.moveTo(-w, 0);
  shape.quadraticCurveTo(-w, h, -w * 0.4, h);
  shape.lineTo(w * 0.55, h);
  shape.quadraticCurveTo(w, h, w, 0);
  shape.quadraticCurveTo(w, -h, w * 0.55, -h);
  shape.lineTo(-w * 0.4, -h);
  shape.quadraticCurveTo(-w, -h, -w, 0);
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 14 });
}

/** Thần Tài hoạt hình 3D dựng hoàn toàn bằng hình khối (mũ cánh chuồn, râu dài, đĩnh vàng, bệ vàng). */
export function DeityModel({ palette, reducedMotion, onSelect }: DeityModelProps) {
  const body = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const stars = useRef<Group>(null);
  const robe = useMemo(() => new LatheGeometry(robeProfile(), 40), []);
  const beard = useMemo(() => new LatheGeometry(beardProfile(), 24), []);
  const wingBack = useMemo(() => wingGeometry(0.1, 0.07), []);
  const wingFront = useMemo(() => wingGeometry(0.16, 0), []);
  const gold = { color: palette['scene-deity-gold'], metalness: 0.55, roughness: 0.28 } as const;
  const goldGlow = { ...gold, emissive: palette['scene-deity-gold'], emissiveIntensity: 0.22 } as const;

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (body.current) body.current.position.y = Math.sin(t * 1.6) * 0.06;
    if (orbit.current) orbit.current.rotation.y = t * 0.55;
    if (stars.current) stars.current.rotation.y = -t * 0.3;
  });

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      onPointerOver={() => { if (onSelect) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Bệ vàng 3 tầng + vòng sáng dưới chân */}
      <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[3.05, 3.15, 0.28, 56]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[2.55, 2.65, 0.26, 56]} /><meshStandardMaterial color={palette['scene-deity-robe']} roughness={0.5} /></mesh>
      <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[2.05, 2.2, 0.3, 56]} /><meshStandardMaterial {...goldGlow} /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.2, 4.3, 64]} /><meshBasicMaterial color={palette['scene-deity-gold']} transparent opacity={0.32} /></mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.5, 4.75, 64]} /><meshBasicMaterial color={palette['scene-deity-gold']} transparent opacity={0.5} /></mesh>

      <group ref={body} position={[0, 0.83, 0]}>
        {/* Áo choàng + đai vàng + viền */}
        <mesh geometry={robe}><meshStandardMaterial color={palette['scene-deity-robe']} roughness={0.4} /></mesh>
        {[-0.62, -0.2, 0.2, 0.62].map((a) => (
          <mesh key={a} position={[Math.sin(a) * 1.5, 0.55, Math.cos(a) * 1.5]} rotation={[Math.PI / 2 - 0.25, 0, -a]}><cylinderGeometry args={[0.2, 0.2, 0.05, 20]} /><meshStandardMaterial {...goldGlow} /></mesh>
        ))}
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.64, 0.09, 12, 56]} /><meshStandardMaterial {...gold} /></mesh>
        <mesh position={[0, 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.32, 0.14, 12, 56]} /><meshStandardMaterial {...gold} /></mesh>
        <mesh position={[0, 0.82, 1.3]}><boxGeometry args={[0.42, 0.34, 0.12]} /><meshStandardMaterial {...goldGlow} /></mesh>
        <mesh position={[0, 1.78, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.9, 0.1, 12, 40]} /><meshStandardMaterial {...gold} /></mesh>
        <mesh position={[0, 1.38, 1.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.34, 0.34, 0.06, 28]} /><meshStandardMaterial {...goldGlow} /></mesh>
        <mesh position={[0, 1.38, 1.08]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.06, 28]} /><meshStandardMaterial color={palette['scene-deity-robe-dark']} /></mesh>

        {/* Hai tay ôm đĩnh vàng */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 1.0, 1.55, 0.35]} rotation={[0.75, 0, side * -0.45]}><capsuleGeometry args={[0.34, 0.8, 8, 16]} /><meshStandardMaterial color={palette['scene-deity-robe']} roughness={0.55} /></mesh>
            <mesh position={[side * 0.78, 1.45, 0.98]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.3, 0.08, 10, 24]} /><meshStandardMaterial {...gold} /></mesh>
            <mesh position={[side * 0.62, 1.42, 1.15]}><sphereGeometry args={[0.27, 20, 20]} /><meshStandardMaterial color={palette['scene-deity-skin']} roughness={0.6} /></mesh>
          </group>
        ))}
        <group position={[0, 1.7, 1.3]} rotation={[-0.55, 0, 0]} scale={[1.25, 1.25, 1]}>
          <mesh rotation={[0, 0, Math.PI]}><torusGeometry args={[0.78, 0.3, 18, 36, Math.PI]} /><meshStandardMaterial {...goldGlow} /></mesh>
          <mesh position={[0, -0.42, 0]} scale={[1.05, 0.5, 0.9]}><sphereGeometry args={[0.7, 28, 20]} /><meshStandardMaterial {...goldGlow} /></mesh>
          <mesh position={[0, -0.12, 0]} scale={[0.9, 0.3, 0.7]}><sphereGeometry args={[0.6, 24, 18]} /><meshStandardMaterial {...goldGlow} /></mesh>
        </group>

        {/* Đầu */}
        <group position={[0, 3.0, 0]} scale={1.2}>
          <mesh scale={[1.14, 1, 1]}><sphereGeometry args={[1, 48, 40]} /><meshStandardMaterial color={palette['scene-deity-skin']} roughness={0.6} /></mesh>
          <mesh position={[0, 0.06, -0.32]} scale={[1.15, 1, 0.82]}><sphereGeometry args={[0.99, 36, 30]} /><meshStandardMaterial color={palette['scene-deity-beard']} roughness={0.7} /></mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 1.1, -0.05, 0]} scale={[0.4, 0.55, 0.4]}><sphereGeometry args={[0.5, 20, 20]} /><meshStandardMaterial color={palette['scene-deity-skin']} roughness={0.6} /></mesh>
              <mesh position={[side * 0.42, 0.1, 0.9]} rotation={[0, 0, 0]}><torusGeometry args={[0.15, 0.04, 10, 20, Math.PI]} /><meshStandardMaterial color={palette['scene-deity-beard']} /></mesh>
              <mesh position={[side * 0.42, 0.37, 0.88]} rotation={[0, 0, side * -0.28]} scale={[1, 0.26, 0.5]}><sphereGeometry args={[0.24, 16, 12]} /><meshStandardMaterial color={palette['scene-deity-beard']} /></mesh>
              <mesh position={[side * 0.68, -0.18, 0.7]} scale={[1, 0.62, 0.34]}><sphereGeometry args={[0.2, 16, 14]} /><meshStandardMaterial color={palette['scene-deity-cheek']} transparent opacity={0.85} /></mesh>
              <mesh position={[side * 0.27, -0.25, 0.92]} rotation={[0, 0, side * -0.55]} scale={[1.15, 0.5, 0.55]}><sphereGeometry args={[0.24, 16, 14]} /><meshStandardMaterial color={palette['scene-deity-beard']} /></mesh>
            </group>
          ))}
          <mesh position={[0, -0.12, 0.98]} scale={[1, 0.85, 0.8]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={palette['scene-deity-cheek']} roughness={0.5} /></mesh>
          <group position={[0, -0.5, 0.86]}>
            <mesh scale={[1.25, 1.2, 0.55]}><sphereGeometry args={[0.3, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color={palette['scene-deity-mouth']} side={DoubleSide} /></mesh>
            <mesh position={[0, -0.12, 0.05]} scale={[1, 0.5, 0.5]}><sphereGeometry args={[0.18, 16, 12]} /><meshStandardMaterial color={palette['scene-deity-cheek']} /></mesh>
          </group>
          <mesh position={[0, -1.78, 0.66]} rotation={[0.1, 0, 0]} scale={[0.78, 0.72, 0.6]}><primitive object={beard} attach="geometry" /><meshStandardMaterial color={palette['scene-deity-beard']} roughness={0.7} /></mesh>

          {/* Mũ cánh chuồn */}
          <group position={[0, 0.82, 0]}>
            <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.82, 0.98, 0.78, 36]} /><meshStandardMaterial color={palette['scene-deity-hat']} roughness={0.5} /></mesh>
            <mesh position={[0, -0.27, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.97, 0.08, 12, 40]} /><meshStandardMaterial {...gold} /></mesh>
            <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.82, 0.06, 12, 40]} /><meshStandardMaterial {...gold} /></mesh>
            <mesh position={[0, 0.65, 0]}><sphereGeometry args={[0.28, 20, 20]} /><meshStandardMaterial {...goldGlow} /></mesh>
            <mesh position={[0, 0.1, 0.93]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.08, 28]} /><meshStandardMaterial {...goldGlow} /></mesh>
            <mesh position={[0, 0.1, 0.99]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.08, 20]} /><meshStandardMaterial color={palette['scene-deity-gem']} roughness={0.2} metalness={0.2} /></mesh>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 1.5, 0.12, -0.08]} rotation={[0, 0, side * 0.12]} scale={[side, 1, 1]}>
                <mesh geometry={wingBack} position={[0, 0, -0.04]}><meshStandardMaterial {...gold} /></mesh>
                <mesh geometry={wingFront} position={[0, 0, 0.02]}><meshStandardMaterial color={palette['scene-deity-hat']} roughness={0.5} /></mesh>
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* Đồng xu vàng xoay quanh */}
      <group ref={orbit} position={[0, 2.6, 0]}>
        {Array.from({ length: COIN_COUNT }, (_, i) => {
          const a = (i / COIN_COUNT) * Math.PI * 2;
          const r = 3.2 + (i % 3) * 0.45;
          return (
            <mesh key={i} position={[Math.cos(a) * r, Math.sin(i * 1.7) * 1.1 + 0.4, Math.sin(a) * r]} rotation={[Math.PI / 2, 0, a]}>
              <cylinderGeometry args={[0.26, 0.26, 0.06, 24]} />
              <meshStandardMaterial {...goldGlow} />
            </mesh>
          );
        })}
      </group>
      <group ref={stars} position={[0, 3.2, 0]}>
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const a = (i / STAR_COUNT) * Math.PI * 2 + 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * 3.8, Math.sin(i * 2.3) * 1.3 + 0.6, Math.sin(a) * 3.8]} scale={0.2 + (i % 3) * 0.06}>
              <octahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color={palette['scene-star']} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 4.2, 3]} intensity={18} color={palette['scene-deity-gold']} distance={14} />
    </group>
  );
}
