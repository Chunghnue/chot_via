import { useMemo } from 'react';
import type { Palette, PaletteKey } from './palette';
import { Person } from './scenery';
import { Plant, SignText, Table, roundedPlate } from './shop-parts';

export type ShopKind = 'fashion' | 'restaurant' | 'minimart' | 'sale';

interface ShopTheme { wall: PaletteKey; awningA: PaletteKey; awningB: PaletteKey; sign: PaletteKey; accent: PaletteKey }

const THEMES: Readonly<Record<ShopKind, ShopTheme>> = {
  fashion: { wall: 'shopm-fashion-wall', awningA: 'shopm-fashion-awning-a', awningB: 'shopm-fashion-awning-b', sign: 'shopm-fashion-sign', accent: 'shopm-fashion-accent' },
  restaurant: { wall: 'shopm-restaurant-wall', awningA: 'shopm-restaurant-awning-a', awningB: 'shopm-restaurant-awning-b', sign: 'shopm-restaurant-sign', accent: 'shopm-restaurant-accent' },
  minimart: { wall: 'shopm-minimart-wall', awningA: 'shopm-minimart-awning-a', awningB: 'shopm-minimart-awning-b', sign: 'shopm-minimart-sign', accent: 'shopm-minimart-accent' },
  sale: { wall: 'shopm-sale-wall', awningA: 'shopm-sale-awning-a', awningB: 'shopm-sale-awning-b', sign: 'shopm-sale-sign', accent: 'shopm-sale-accent' },
};

const WIDTHS: Readonly<Record<ShopKind, number>> = { fashion: 6.4, restaurant: 7.6, minimart: 7.2, sale: 6.8 };
const HEIGHTS: Readonly<Record<ShopKind, number>> = { fashion: 3.7, restaurant: 3.7, minimart: 3.5, sale: 5.4 };

interface ShopModelProps {
  kind: ShopKind;
  palette: Palette;
  signText: string;
  onSelect?: () => void;
}

function Awning({ palette, theme, width, y, z, slats }: { palette: Palette; theme: ShopTheme; width: number; y: number; z: number; slats: number }) {
  return (
    <group position={[0, y, z]} rotation={[0.42, 0, 0]}>
      {Array.from({ length: slats }, (_, i) => {
        const w = (width + 0.4) / slats;
        const x = -((width + 0.4) / 2) + w * (i + 0.5);
        const color = i % 2 === 0 ? palette[theme.awningA] : palette[theme.awningB];
        return (
          <group key={i}>
            <mesh position={[x, 0, 0.95]}><boxGeometry args={[w, 0.07, 1.9]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
            <mesh position={[x, 0, 1.9]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, w, 14, 1, false, 0, Math.PI]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

function Mannequin({ palette, x, color }: { palette: Palette; x: number; color: string }) {
  return (
    <group position={[x, 0.15, 1.2]}>
      <mesh position={[0, 0.65, 0]}><coneGeometry args={[0.5, 1.3, 18]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.2, 0.28, 0.5, 14]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>
      <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.2, 16, 14]} /><meshStandardMaterial color={palette['shopm-mannequin']} roughness={0.5} /></mesh>
    </group>
  );
}

/** Biểu tượng đặt trên biển hiệu theo loại cửa hàng. */
function RoofIcon({ kind, palette, theme }: { kind: ShopKind; palette: Palette; theme: ShopTheme }) {
  const accent = palette[theme.accent];
  const white = palette['shopm-white'];
  switch (kind) {
    case 'fashion':
      return (
        <group position={[-2.4, 1.0, 0.2]}>
          <mesh position={[0, 0.2, 0]}><coneGeometry args={[0.45, 0.8, 18]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.15, 0.22, 0.35, 14]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[0, 0.98, 0]}><torusGeometry args={[0.14, 0.03, 8, 16, Math.PI * 1.6]} /><meshStandardMaterial color={white} /></mesh>
        </group>
      );
    case 'restaurant':
      return (
        <group position={[-2.6, 0.95, 0.2]}>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.38, 0.34, 0.5, 18]} /><meshStandardMaterial color={white} roughness={0.7} /></mesh>
          {[-0.22, 0, 0.22].map((cx) => <mesh key={cx} position={[cx, 0.5, 0]}><sphereGeometry args={[0.26, 14, 12]} /><meshStandardMaterial color={white} roughness={0.7} /></mesh>)}
        </group>
      );
    case 'minimart':
      return (
        <group position={[-2.5, 0.9, 0.2]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.9, 0.5, 0.5]} />
            <meshStandardMaterial color={white} />
          </mesh>
          <mesh position={[-0.55, 0.65, 0]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.5, 0.06, 0.06]} />
            <meshStandardMaterial color={white} />
          </mesh>
          {[-0.3, 0.3].map((wx) => (
            <mesh key={wx} position={[wx, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
              <meshStandardMaterial color={white} />
            </mesh>
          ))}
        </group>
      );
    case 'sale':
      return (
        <group position={[-2.55, 0.85, 0.2]}>
          {[0.45, 0.75, 1.05].map((h, i) => <mesh key={h} position={[i * 0.36 - 0.36, h / 2 - 0.2, 0]}><boxGeometry args={[0.28, h, 0.2]} /><meshStandardMaterial color={white} /></mesh>)}
        </group>
      );
  }
}

/** Cửa hàng/văn phòng dựng theo thiết kế: thân nhà, mái bạt sọc, cửa kính ấm đèn, biển hiệu có chữ và đồ trưng bày riêng từng loại. */
export function ShopModel({ kind, palette, signText, onSelect }: ShopModelProps) {
  const theme = THEMES[kind];
  const width = WIDTHS[kind];
  const height = HEIGHTS[kind];
  const isSale = kind === 'sale';
  const signBack = useMemo(() => roundedPlate(width - 1.2, 1.4, 0.4, 0.14), [width]);
  const signFront = useMemo(() => roundedPlate(width - 1.5, 1.12, 0.34, 0.18), [width]);
  const glow = { color: palette['cafe-glow'], emissive: palette['cafe-glow'], emissiveIntensity: 0.65, roughness: 0.4 } as const;
  const signY = height + 1.05;

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
      {isSale ? (
        <group>
          {/* Văn phòng: khung nhà xanh, mặt tiền kính trong suốt, thấy bàn làm việc và nhân viên */}
          <mesh position={[0, height / 2, -1.2]}>
            <boxGeometry args={[width, height, 2.2]} />
            <meshStandardMaterial color={palette[theme.wall]} roughness={0.7} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (width / 2 - 0.1), height / 2, 1.15]}>
              <boxGeometry args={[0.2, height, 2.5]} />
              <meshStandardMaterial color={palette[theme.wall]} roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 0.08, 1.15]}>
            <boxGeometry args={[width, 0.16, 2.5]} />
            <meshStandardMaterial color={palette['shopm-desk']} />
          </mesh>
          <mesh position={[0, height + 0.12, 0.3]}>
            <boxGeometry args={[width + 0.4, 0.28, 4.4]} />
            <meshStandardMaterial color={palette[theme.sign]} roughness={0.6} />
          </mesh>
          <mesh position={[0, height / 2 + 0.2, 2.36]}>
            <boxGeometry args={[width - 0.3, height - 0.4, 0.06]} />
            <meshStandardMaterial color={palette['shopm-glass']} transparent opacity={0.32} roughness={0.1} metalness={0.1} />
          </mesh>
          {[-1.7, 0, 1.7].map((dx, i) => (
            <group key={dx}>
              <mesh position={[dx, 0.82, 1.5]}>
                <boxGeometry args={[1.5, 0.08, 0.9]} />
                <meshStandardMaterial color={palette['shopm-desk']} />
              </mesh>
              <mesh position={[dx, 1.05, 1.35]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.6, 0.4, 0.04]} />
                <meshStandardMaterial color={palette['shopm-screen']} emissive={palette['shopm-screen']} emissiveIntensity={0.6} />
              </mesh>
              <Person palette={palette} x={dx} z={0.6} shirt={(['scene-person-a', 'scene-person-b', 'scene-person-d'] as const)[i] ?? 'scene-person-a'} facing={Math.PI} seated />
            </group>
          ))}
          <mesh position={[0, height - 0.5, 2.3]}>
            <boxGeometry args={[width - 0.3, 0.22, 0.16]} />
            <meshStandardMaterial color={palette[theme.accent]} />
          </mesh>
          <mesh position={[width / 2 - 1.1, 1.2, 2.4]}>
            <boxGeometry args={[1.1, 2.3, 0.1]} />
            <meshStandardMaterial color={palette['shopm-glass']} transparent opacity={0.5} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height, 4.6]} />
            <meshStandardMaterial color={palette[theme.wall]} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, 0.02]}>
            <boxGeometry args={[width + 0.04, 1.0, 4.64]} />
            <meshStandardMaterial color={palette[theme.sign]} roughness={0.8} />
          </mesh>
          <mesh position={[0, height + 0.15, 0.15]}>
            <boxGeometry args={[width + 0.6, 0.32, 5.0]} />
            <meshStandardMaterial color={palette[theme.sign]} roughness={0.7} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (width / 2 - 0.08), height / 2, 2.34]}>
              <boxGeometry args={[0.2, height, 0.2]} />
              <meshStandardMaterial color={palette[theme.sign]} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * (width / 4 + 0.35), 1.7, 2.31]}>
              <mesh>
                <boxGeometry args={[width / 2 - 1.0, 1.7, 0.1]} />
                <meshStandardMaterial color={palette[theme.sign]} />
              </mesh>
              <mesh position={[0, 0, 0.06]}>
                <boxGeometry args={[width / 2 - 1.25, 1.45, 0.05]} />
                <meshStandardMaterial {...glow} />
              </mesh>
            </group>
          ))}
          <group position={[0, 1.4, 2.32]}>
            <mesh>
              <boxGeometry args={[kind === 'minimart' ? 1.9 : 1.3, 2.3, 0.12]} />
              <meshStandardMaterial color={palette[theme.sign]} />
            </mesh>
            <mesh position={[0, 0.2, 0.07]}>
              <boxGeometry args={[kind === 'minimart' ? 1.6 : 0.95, 1.7, 0.05]} />
              <meshStandardMaterial {...glow} />
            </mesh>
          </group>
          <Awning palette={palette} theme={theme} width={width} y={3.1} z={2.28} slats={Math.round(width * 1.4)} />
        </group>
      )}

      {/* Biển hiệu + biểu tượng */}
      <group position={[0, signY, isSale ? 1.5 : 0.7]} rotation={[-0.08, 0, 0]}>
        <mesh geometry={signBack}>
          <meshStandardMaterial color={palette['cafe-sign-trim']} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh geometry={signFront} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={palette[theme.sign]} roughness={0.65} />
        </mesh>
        <group position={[0.35, -0.02, 0.37]}>
          <SignText text={signText} color={palette['shopm-white']} shadow={palette['cafe-wood-dark']} width={width - 2.4} height={1.0} />
        </group>
        <RoofIcon kind={kind} palette={palette} theme={theme} />
      </group>

      {/* Đồ trưng bày / sân trước theo loại */}
      {kind === 'fashion' ? (
        <group>
          <group position={[0, 0, 0.9]}>
            <Mannequin palette={palette} x={-1.5} color={palette['shopm-fashion-awning-a']} />
            <Mannequin palette={palette} x={1.5} color={palette['shopm-fashion-accent']} />
          </group>
          <Plant palette={palette} x={-3.0} z={3.4} />
          <Plant palette={palette} x={3.0} z={3.4} />
          <Person palette={palette} x={-1.1} z={4.3} shirt="scene-person-d" facing={0.4} />
        </group>
      ) : null}
      {kind === 'restaurant' ? (
        <group>
          {[-1.1, 1.1].map((lx) => (
            <mesh key={lx} position={[lx * 2.2, 2.55, 2.5]}>
              <sphereGeometry args={[0.28, 14, 14]} />
              <meshStandardMaterial color={palette['shopm-restaurant-awning-a']} emissive={palette['shopm-restaurant-awning-a']} emissiveIntensity={0.5} />
            </mesh>
          ))}
          <Table palette={palette} x={-1.8} z={4.4} parasol={false} />
          <Table palette={palette} x={1.9} z={4.6} parasol={false} />
          <Plant palette={palette} x={-3.6} z={3.2} />
          <Plant palette={palette} x={3.6} z={3.2} />
        </group>
      ) : null}
      {kind === 'minimart' ? (
        <group>
          {[-2.6, 2.6].map((cx) => (
            <group key={cx} position={[cx, 0, 3.3]}>
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[1.3, 0.6, 0.9]} />
                <meshStandardMaterial color={palette['shopm-crate']} roughness={0.9} />
              </mesh>
              {(
                [
                  ['shopm-fruit-a', -0.4],
                  ['shopm-fruit-b', 0],
                  ['shopm-fruit-c', 0.4],
                ] as const
              ).map(([c, fx]) => (
                <mesh key={c} position={[fx, 0.68, 0]}>
                  <sphereGeometry args={[0.2, 12, 12]} />
                  <meshStandardMaterial color={palette[c]} />
                </mesh>
              ))}
            </group>
          ))}
          <Person palette={palette} x={0.5} z={4.2} shirt="scene-person-c" facing={0.2} />
        </group>
      ) : null}
      {isSale ? (
        <group>
          <Plant palette={palette} x={-3.0} z={3.4} />
          <Plant palette={palette} x={3.0} z={3.4} />
        </group>
      ) : null}
      <pointLight position={[0, 2.2, 3.2]} intensity={7} color={palette['cafe-glow']} distance={9} />
    </group>
  );
}
