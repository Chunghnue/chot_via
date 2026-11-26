import { useMemo } from 'react';
import type { Palette } from './palette';
import { Person } from './scenery';
import { Plant, SignText, Table, roundedPlate } from './shop-parts';

interface CafeModelProps {
  palette: Palette;
  /** Chữ trên biển hiệu (lấy từ i18n ở nơi gọi). */
  signText: string;
  onSelect?: () => void;
}

const WIDTH = 7.4;
const AWNING_SLATS = 10;

/** Quán Cafe An Nhiên: mái bạt sọc, biển gỗ có cốc cà phê, cửa kính ấm đèn, sân hiên có bàn ghế, cây và đèn dây. */
export function CafeModel({ palette, signText, onSelect }: CafeModelProps) {
  const signBack = useMemo(() => roundedPlate(5.6, 1.5, 0.45, 0.14), []);
  const signFront = useMemo(() => roundedPlate(5.3, 1.22, 0.38, 0.18), []);
  const glow = { color: palette['cafe-glow'], emissive: palette['cafe-glow'], emissiveIntensity: 0.7, roughness: 0.4 } as const;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={() => {
        if (onSelect) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Thân nhà: tường kem + chân gạch + mái gỗ */}
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[WIDTH, 3.7, 4.6]} />
        <meshStandardMaterial color={palette['cafe-wall']} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0.02]}>
        <boxGeometry args={[WIDTH + 0.04, 1.1, 4.64]} />
        <meshStandardMaterial color={palette['cafe-brick']} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.88, 0.15]}>
        <boxGeometry args={[WIDTH + 0.7, 0.34, 5.1]} />
        <meshStandardMaterial color={palette['cafe-wood-dark']} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (WIDTH / 2 - 0.12), 1.85, 2.34]}>
          <boxGeometry args={[0.24, 3.7, 0.24]} />
          <meshStandardMaterial color={palette['cafe-wood']} roughness={0.7} />
        </mesh>
      ))}

      {/* Cửa kính ấm đèn */}
      {[-1.95, 1.95].map((wx) => (
        <group key={wx} position={[wx, 1.75, 2.31]}>
          <mesh>
            <boxGeometry args={[2.5, 1.7, 0.1]} />
            <meshStandardMaterial color={palette['cafe-wood-dark']} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[2.3, 1.5, 0.05]} />
            <meshStandardMaterial {...glow} />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.06, 1.5, 0.05]} />
            <meshStandardMaterial color={palette['cafe-wood-dark']} />
          </mesh>
          <mesh position={[0, -1.0, 0.18]}>
            <boxGeometry args={[2.6, 0.32, 0.4]} />
            <meshStandardMaterial color={palette['cafe-wood']} />
          </mesh>
          {[-0.9, -0.45, 0, 0.45, 0.9].map((fx, i) => (
            <mesh key={fx} position={[fx, -0.78, 0.36]}>
              <sphereGeometry args={[0.13, 10, 10]} />
              <meshStandardMaterial color={i % 2 ? palette['scene-blossom-dark'] : palette['scene-leaf-light']} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, 1.45, 2.32]}>
        <mesh>
          <boxGeometry args={[1.3, 2.4, 0.12]} />
          <meshStandardMaterial color={palette['cafe-wood']} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.25, 0.07]}>
          <boxGeometry args={[0.95, 1.55, 0.05]} />
          <meshStandardMaterial {...glow} />
        </mesh>
      </group>
      {[-0.95, 0.95].map((lx) => (
        <mesh key={lx} position={[lx, 2.45, 2.5]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial {...glow} emissiveIntensity={1.1} />
        </mesh>
      ))}

      {/* Mái bạt sọc đỏ trắng */}
      <group position={[0, 3.2, 2.28]} rotation={[0.42, 0, 0]}>
        {Array.from({ length: AWNING_SLATS }, (_, i) => {
          const w = (WIDTH + 0.4) / AWNING_SLATS;
          const x = -((WIDTH + 0.4) / 2) + w * (i + 0.5);
          const color = i % 2 === 0 ? palette['cafe-awning-a'] : palette['cafe-awning-b'];
          return (
            <group key={i}>
              <mesh position={[x, 0, 0.95]}>
                <boxGeometry args={[w, 0.07, 1.9]} />
                <meshStandardMaterial color={color} roughness={0.7} />
              </mesh>
              <mesh position={[x, 0, 1.9]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, w, 14, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color={color} roughness={0.7} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Biển hiệu gỗ + cốc cà phê */}
      <group position={[0, 4.95, 0.6]} rotation={[-0.1, 0, 0]}>
        <mesh geometry={signBack} position={[0, 0, 0]}>
          <meshStandardMaterial color={palette['cafe-sign-trim']} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh geometry={signFront} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={palette['cafe-sign']} roughness={0.65} />
        </mesh>
        <group position={[0, -0.02, 0.37]}>
          <SignText text={signText} color={palette['cafe-awning-b']} shadow={palette['cafe-wood-dark']} width={4.9} height={1.1} />
        </group>
        <group position={[0, 1.15, 0.2]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.06, 28]} />
            <meshStandardMaterial color={palette['cafe-cup']} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.42, 0.3, 0.55, 28]} />
            <meshStandardMaterial color={palette['cafe-cup']} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.02, 28]} />
            <meshStandardMaterial color={palette['cafe-coffee']} />
          </mesh>
          <mesh position={[0.5, 0.32, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.16, 0.05, 10, 20]} />
            <meshStandardMaterial color={palette['cafe-cup']} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <torusGeometry args={[0.14, 0.035, 8, 20, Math.PI * 1.4]} />
            <meshStandardMaterial color={palette['cafe-cup']} transparent opacity={0.85} />
          </mesh>
        </group>
        {[-2.3, 2.3].map((px) => (
          <mesh key={px} position={[px, -1.1, -0.2]}>
            <boxGeometry args={[0.16, 0.9, 0.16]} />
            <meshStandardMaterial color={palette['cafe-wood-dark']} />
          </mesh>
        ))}
      </group>

      {/* Sân hiên: sàn gỗ, bàn ghế, cây, bảng đen, đèn dây */}
      <mesh position={[0, 0.06, 4.1]}>
        <boxGeometry args={[WIDTH + 1, 0.12, 3.6]} />
        <meshStandardMaterial color={palette['cafe-wood']} roughness={0.8} />
      </mesh>
      <Table palette={palette} x={-2.2} z={4.2} parasol />
      <Table palette={palette} x={0.4} z={4.6} parasol={false} />
      <Table palette={palette} x={2.7} z={4.1} parasol />
      <Plant palette={palette} x={-3.9} z={5.5} />
      <Plant palette={palette} x={3.95} z={5.6} size={1.1} />
      <Plant palette={palette} x={-3.85} z={2.6} size={0.9} />
      <group position={[1.7, 0, 3.0]} rotation={[0, -0.2, 0]}>
        <mesh position={[0, 0.55, 0]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[0.95, 1.1, 0.07]} />
          <meshStandardMaterial color={palette['cafe-board']} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.55, 0.05]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[1.05, 1.2, 0.04]} />
          <meshStandardMaterial color={palette['cafe-wood']} />
        </mesh>
      </group>
      <Person palette={palette} x={-2.2} z={3.35} shirt="scene-person-b" facing={0} seated />
      <Person palette={palette} x={2.7} z={3.2} shirt="scene-person-a" facing={0} seated />
      <Person palette={palette} x={0.4} z={5.55} shirt="scene-person-c" facing={Math.PI} seated />
      {Array.from({ length: 13 }, (_, i) => {
        const t = i / 12;
        const x = -WIDTH / 2 - 0.3 + t * (WIDTH + 0.6);
        return (
          <mesh key={i} position={[x, 3.4 - Math.sin(t * Math.PI) * 0.35, 6.2]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial {...glow} emissiveIntensity={1.2} />
          </mesh>
        );
      })}
      <pointLight position={[0, 2.2, 3.4]} intensity={10} color={palette['cafe-glow']} distance={10} />
    </group>
  );
}
