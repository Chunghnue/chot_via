import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Palette, PaletteKey } from './palette';

type ShirtKey = Extract<PaletteKey, 'scene-person-a' | 'scene-person-b' | 'scene-person-c' | 'scene-person-d'>;

interface PersonProps {
  palette: Palette;
  x: number;
  z: number;
  shirt: ShirtKey;
  facing: number;
  seated?: boolean;
}

/** Người hoạt hình đơn giản (đứng hoặc ngồi). */
export function Person({ palette, x, z, shirt, facing, seated = false }: PersonProps) {
  const lift = seated ? 0.52 : 0.8;
  return (
    <group position={[x, 0, z]} rotation={[0, facing, 0]}>
      {seated ? (
        <>
          <mesh position={[0, 0.58, 0.22]}>
            <boxGeometry args={[0.34, 0.16, 0.5]} />
            <meshStandardMaterial color={palette['scene-metal']} />
          </mesh>
          <mesh position={[0, 0.3, 0.46]}>
            <boxGeometry args={[0.3, 0.5, 0.14]} />
            <meshStandardMaterial color={palette['scene-metal']} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.11, 0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 6, 10]} />
            <meshStandardMaterial color={palette['scene-metal']} />
          </mesh>
          <mesh position={[0.11, 0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 6, 10]} />
            <meshStandardMaterial color={palette['scene-metal']} />
          </mesh>
        </>
      )}
      <mesh position={[0, lift + 0.42, 0]}>
        <capsuleGeometry args={[0.26, 0.5, 8, 14]} />
        <meshStandardMaterial color={palette[shirt]} roughness={0.7} />
      </mesh>
      <mesh position={[0, lift + 1.05, 0]}>
        <sphereGeometry args={[0.24, 18, 16]} />
        <meshStandardMaterial color={palette['scene-person-skin']} roughness={0.6} />
      </mesh>
      <mesh position={[0, lift + 1.12, -0.03]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.255, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshStandardMaterial color={palette['scene-person-hair']} />
      </mesh>
    </group>
  );
}

interface WalkerProps extends Omit<PersonProps, 'seated'> {
  reducedMotion: boolean;
  /** Biên độ đi lại dọc theo trục x. */
  span: number;
  speed: number;
}

/** Người đi dạo qua lại trên phố. */
export function Walker({ reducedMotion, span, speed, ...person }: WalkerProps) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (reducedMotion || !ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.position.x = Math.sin(t) * span;
    ref.current.rotation.y = Math.cos(t) > 0 ? Math.PI / 2 : -Math.PI / 2;
    ref.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.05;
  });
  return <group ref={ref}><Person {...person} x={0} facing={0} /></group>;
}

export function RoundTree({ palette, x, z, scale = 1 }: { palette: Palette; x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.22, 0.34, 2.2, 10]} /><meshStandardMaterial color={palette['scene-trunk']} roughness={0.9} /></mesh>
      <mesh position={[0, 3.1, 0]}><sphereGeometry args={[1.5, 20, 18]} /><meshStandardMaterial color={palette['scene-leaf-dark']} roughness={0.85} /></mesh>
      <mesh position={[0.9, 2.6, 0.5]}><sphereGeometry args={[1.0, 18, 16]} /><meshStandardMaterial color={palette['scene-leaf-light']} roughness={0.85} /></mesh>
      <mesh position={[-0.9, 3.5, -0.2]}><sphereGeometry args={[1.05, 18, 16]} /><meshStandardMaterial color={palette['scene-leaf-light']} roughness={0.85} /></mesh>
      <mesh position={[0.1, 4.0, 0.3]}><sphereGeometry args={[0.95, 18, 16]} /><meshStandardMaterial color={palette['scene-tree']} roughness={0.85} /></mesh>
    </group>
  );
}

export function BlossomTree({ palette, x, z, scale = 1 }: { palette: Palette; x: number; z: number; scale?: number }) {
  const puffs: Array<[number, number, number, number, boolean]> = [
    [0, 3.4, 0, 1.55, true], [1.2, 3.0, 0.6, 1.05, false], [-1.2, 3.2, -0.3, 1.15, false], [0.3, 4.2, 0.2, 1.0, true], [-0.4, 2.7, 1.0, 0.85, false],
  ];
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.36, 2.4, 10]} />
        <meshStandardMaterial color={palette['scene-trunk']} roughness={0.9} />
      </mesh>
      {puffs.map(([px, py, pz, r, dark]) => (
        <mesh key={`${px}${py}`} position={[px, py, pz]}>
          <sphereGeometry args={[r, 18, 16]} />
          <meshStandardMaterial color={dark ? palette['scene-blossom-dark'] : palette['scene-blossom']} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export function StreetLamp({ palette, x, z }: { palette: Palette; x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.07, 0.11, 3.4, 8]} /><meshStandardMaterial color={palette['scene-metal']} /></mesh>
      <mesh position={[0, 3.55, 0]}><sphereGeometry args={[0.3, 14, 14]} /><meshStandardMaterial color={palette['scene-lamp']} emissive={palette['scene-lamp']} emissiveIntensity={0.9} /></mesh>
      <mesh position={[0, 3.85, 0]}><coneGeometry args={[0.34, 0.22, 12]} /><meshStandardMaterial color={palette['scene-metal']} /></mesh>
    </group>
  );
}

export function Bench({ palette, x, z, rotation }: { palette: Palette; x: number; z: number; rotation: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.7, 0.1, 0.6]} /><meshStandardMaterial color={palette['scene-bench']} roughness={0.8} /></mesh>
      <mesh position={[0, 0.9, -0.27]}><boxGeometry args={[1.7, 0.5, 0.07]} /><meshStandardMaterial color={palette['scene-bench']} roughness={0.8} /></mesh>
      {[-0.7, 0.7].map((lx) => (
        <mesh key={lx} position={[lx, 0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.5]} /><meshStandardMaterial color={palette['scene-metal']} /></mesh>
      ))}
    </group>
  );
}

/** Nền quảng trường lát gạch nhiều vòng + đường phố kéo dài về phía xa + vỉa hè. */
export function Ground({ palette }: { palette: Palette }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -30]}><planeGeometry args={[220, 200]} /><meshStandardMaterial color={palette['scene-grass']} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -34]}><planeGeometry args={[11, 48]} /><meshStandardMaterial color={palette['scene-road']} roughness={0.95} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 6.4, 0.07, -34]}><boxGeometry args={[2.4, 0.14, 48]} /><meshStandardMaterial color={palette['scene-sidewalk']} roughness={0.9} /></mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[10.5, 72]} /><meshStandardMaterial color={palette['scene-tile-a']} roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[6.6, 8.4, 72]} /><meshStandardMaterial color={palette['scene-tile-b']} roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[8.4, 8.8, 72]} /><meshStandardMaterial color={palette['scene-tile-ring']} roughness={0.8} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[10.1, 10.5, 72]} /><meshStandardMaterial color={palette['scene-tile-ring']} roughness={0.8} /></mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 7.5, 0.04, Math.sin(a) * 7.5]} rotation={[-Math.PI / 2, 0, -a]}>
            <planeGeometry args={[1.6, 0.14]} />
            <meshStandardMaterial color={palette['scene-tile-ring']} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Nhà cao tầng phía xa (nền thành phố) và khinh khí cầu. */
export function Skyline({ palette, reducedMotion }: { palette: Palette; reducedMotion: boolean }) {
  const balloon = useRef<Group>(null);
  useFrame((state) => {
    if (reducedMotion || !balloon.current) return;
    balloon.current.position.y = 13 + Math.sin(state.clock.elapsedTime * 0.6) * 0.5;
  });
  const colors: PaletteKey[] = ['scene-far-a', 'scene-far-b', 'scene-far-c'];
  return (
    <group>
      {Array.from({ length: 18 }, (_, i) => {
        const x = -46 + i * 5.4;
        const h = 9 + ((i * 7) % 6) * 3.2;
        return (
          <mesh key={i} position={[x, h / 2, -62 - (i % 3) * 4]}>
            <boxGeometry args={[4.4, h, 4.4]} />
            <meshStandardMaterial color={palette[colors[i % 3] ?? 'scene-far-a']} roughness={0.9} />
          </mesh>
        );
      })}
      <group ref={balloon} position={[14, 13, -26]}>
        <mesh scale={[1, 1.15, 1]}><sphereGeometry args={[1.5, 24, 20]} /><meshStandardMaterial color={palette['scene-balloon']} roughness={0.6} /></mesh>
        <mesh scale={[1.01, 1.16, 0.35]}><sphereGeometry args={[1.5, 24, 20]} /><meshStandardMaterial color={palette['scene-balloon-stripe']} roughness={0.6} /></mesh>
        <mesh position={[0, -2.2, 0]}><boxGeometry args={[0.6, 0.45, 0.6]} /><meshStandardMaterial color={palette['scene-bench']} /></mesh>
      </group>
    </group>
  );
}
