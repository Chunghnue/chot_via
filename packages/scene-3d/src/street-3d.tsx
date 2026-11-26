import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { MathUtils, TOUCH, type Group, type Mesh } from 'three';
import { shopColor, useSceneColors, type SceneColors } from './colors';
import { PLAZA_Z, layoutShops, streetEndZ, type PlacedShop } from './layout';
import type { StreetSceneProps } from './types';

type Labels = StreetSceneProps['labels'];
type ControlsRef = ComponentRef<typeof OrbitControls>;

function Shop({ shop, colors, dimmed, selected, labels, onSelect }: { shop: PlacedShop; colors: SceneColors; dimmed: boolean; selected: boolean; labels: Labels; onSelect: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const accent = shopColor(colors, shop.place.modelKey);
  const opacity = dimmed ? 0.35 : 1;
  const material = { transparent: dimmed, opacity } as const;
  return (
    <group
      position={[shop.x, 0, shop.z]} rotation={[0, shop.rotationY, 0]} scale={hover || selected ? 1.04 : 1}
      onClick={(e) => { e.stopPropagation(); onSelect(shop.place.id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
    >
      <mesh position={[0, 1.7, 0]}><boxGeometry args={[5, 3.4, 4]} /><meshStandardMaterial color={colors.wall} {...material} /></mesh>
      <mesh position={[0, 3.55, 0]}><boxGeometry args={[5.2, 0.4, 4.2]} /><meshStandardMaterial color={accent} {...material} /></mesh>
      <mesh position={[0, 2.55, 2.45]} rotation={[0.35, 0, 0]}><boxGeometry args={[5, 0.16, 1.6]} /><meshStandardMaterial color={accent} {...material} /></mesh>
      <mesh position={[-1.35, 1.35, 2.02]}><boxGeometry args={[1.7, 1.5, 0.08]} /><meshStandardMaterial color={colors.glass} {...material} /></mesh>
      <mesh position={[1.35, 1.35, 2.02]}><boxGeometry args={[1.7, 1.5, 0.08]} /><meshStandardMaterial color={colors.glass} {...material} /></mesh>
      <mesh position={[0, 1.05, 2.02]}><boxGeometry args={[0.9, 2.1, 0.1]} /><meshStandardMaterial color={accent} {...material} /></mesh>
      {selected ? <mesh position={[0, 0.06, 2.6]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.2, 3.7, 40]} /><meshBasicMaterial color={colors.gold} /></mesh> : null}
      <Html position={[0, 4.6, 2.2]} center distanceFactor={14} zIndexRange={[20, 0]} style={{ pointerEvents: 'none', opacity }}>
        <div className="flex flex-col items-center gap-1 whitespace-nowrap">
          <span className="rounded-full bg-surface px-3 py-1 font-display text-lg font-bold text-ink shadow-card">{shop.place.title}</span>
          {shop.place.isDemo ? <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-bold text-gold-strong">{labels.demo}</span> : null}
        </div>
      </Html>
    </group>
  );
}

function Tree({ x, z, colors }: { x: number; z: number; colors: SceneColors }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.25, 0.35, 1.8, 8]} /><meshStandardMaterial color={colors.trunk} /></mesh>
      <mesh position={[0, 3, 0]}><coneGeometry args={[1.5, 3.2, 8]} /><meshStandardMaterial color={colors.tree} /></mesh>
    </group>
  );
}

function Lamp({ x, z, colors }: { x: number; z: number; colors: SceneColors }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.08, 0.1, 3.2, 6]} /><meshStandardMaterial color={colors.road} /></mesh>
      <mesh position={[0, 3.3, 0]}><sphereGeometry args={[0.28, 12, 12]} /><meshStandardMaterial color={colors.lamp} emissive={colors.lamp} emissiveIntensity={0.9} /></mesh>
    </group>
  );
}

/** Thần Tài (mô hình tạm bằng hình khối cơ bản, thay bằng model GLB của đội thiết kế). */
function Deity({ colors, reducedMotion, label, hint, onSelect }: { colors: SceneColors; reducedMotion: boolean; label: string; hint: string; onSelect: () => void }) {
  const ingot = useRef<Mesh>(null);
  const body = useRef<Group>(null);
  useFrame((state) => {
    if (reducedMotion) return;
    if (ingot.current) ingot.current.rotation.y = state.clock.elapsedTime * 0.9;
    if (body.current) body.current.position.y = Math.sin(state.clock.elapsedTime * 1.6) * 0.08;
  });
  return (
    <group
      position={[0, 0, PLAZA_Z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[4.4, 4.6, 0.2, 40]} />
        <meshStandardMaterial color={colors.plaza} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.5, 24]} />
        <meshStandardMaterial color={colors.deityGold} />
      </mesh>
      <group ref={body}>
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[1.25, 24, 24]} />
          <meshStandardMaterial color={colors.deityRobe} />
        </mesh>
        <mesh position={[0, 3.15, 0]}>
          <sphereGeometry args={[0.85, 24, 24]} />
          <meshStandardMaterial color={colors.deitySkin} />
        </mesh>
        <mesh position={[0, 3.85, 0]}>
          <cylinderGeometry args={[0.55, 0.8, 0.7, 20]} />
          <meshStandardMaterial color={colors.deityHat} />
        </mesh>
        <mesh position={[0, 3.55, 0]}>
          <torusGeometry args={[0.82, 0.07, 8, 24]} rotation-x={Math.PI / 2} />
          <meshStandardMaterial color={colors.deityGold} />
        </mesh>
        <mesh ref={ingot} position={[0, 1.95, 1.15]} scale={[1, 0.55, 0.7]}>
          <sphereGeometry args={[0.6, 20, 20]} />
          <meshStandardMaterial color={colors.deityGold} emissive={colors.deityGold} emissiveIntensity={0.35} />
        </mesh>
      </group>
      <pointLight position={[0, 4, 2]} intensity={14} color={colors.deityGold} distance={14} />
      <Html position={[0, 5.4, 0]} center distanceFactor={14} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center gap-1 whitespace-nowrap">
          <span className="rounded-full bg-wish px-4 py-1.5 font-display text-xl font-extrabold text-on-wish shadow-cta">{label}</span>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink-muted shadow-card">{hint}</span>
        </div>
      </Html>
    </group>
  );
}

function CameraRig({ shops, selectedId, controls }: { shops: PlacedShop[]; selectedId: string | null; controls: RefObject<ControlsRef | null> }) {
  const goal = useMemo(() => {
    const found = shops.find((s) => s.place.id === selectedId);
    return found ? { x: found.x * 0.4, z: found.z + 1 } : null;
  }, [shops, selectedId]);
  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    if (goal) {
      c.target.x = MathUtils.lerp(c.target.x, goal.x, 0.06);
      c.target.z = MathUtils.lerp(c.target.z, goal.z, 0.06);
    }
  });
  return null;
}

export default function Street3D({ places, dimmedIds, selectedId, onSelectPlace, onSelectDeity, labels, reducedMotion, className }: StreetSceneProps & { reducedMotion: boolean }) {
  const colors = useSceneColors();
  const controls = useRef<ControlsRef>(null);
  const shops = useMemo(() => layoutShops(places), [places]);
  const endZ = streetEndZ(places.length);
  const length = PLAZA_Z - endZ + 16;
  const centerZ = (PLAZA_Z + endZ) / 2;
  const rows = Math.ceil(places.length / 2);

  return (
    <div className={className} style={{ touchAction: 'none' }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 8.5, PLAZA_Z + 15], fov: 52 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={[colors.sky]} />
        <fog attach="fog" args={[colors.sky, 40, 110]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[12, 22, 10]} intensity={1.6} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, centerZ]}><planeGeometry args={[120, length + 60]} /><meshStandardMaterial color={colors.ground} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centerZ]}><planeGeometry args={[7.2, length]} /><meshStandardMaterial color={colors.road} /></mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 4.2, 0.08, centerZ]}><boxGeometry args={[1.4, 0.16, length]} /><meshStandardMaterial color={colors.sidewalk} /></mesh>
        ))}
        <Deity colors={colors} reducedMotion={reducedMotion} label={labels.deity} hint={labels.deityHint} onSelect={onSelectDeity} />
        {shops.map((shop) => (
          <Shop key={shop.place.id} shop={shop} colors={colors} dimmed={dimmedIds.has(shop.place.id)} selected={shop.place.id === selectedId} labels={labels} onSelect={onSelectPlace} />
        ))}
        {Array.from({ length: rows + 1 }, (_, row) => (
          <group key={row}>
            <Tree x={-12.5} z={PLAZA_Z - 6 - row * 7} colors={colors} />
            <Tree x={12.5} z={PLAZA_Z - 6 - row * 7} colors={colors} />
            <Lamp x={-3.7} z={PLAZA_Z - 9.5 - row * 7} colors={colors} />
            <Lamp x={3.7} z={PLAZA_Z - 9.5 - row * 7} colors={colors} />
          </group>
        ))}
        <OrbitControls
          ref={controls} makeDefault enableDamping dampingFactor={0.08} screenSpacePanning={false}
          minDistance={8} maxDistance={40} minPolarAngle={0.45} maxPolarAngle={Math.PI / 2.15}
          touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }} target={[0, 1.5, PLAZA_Z - 9]}
          onChange={() => {
            const c = controls.current;
            if (!c) return;
            c.target.x = MathUtils.clamp(c.target.x, -9, 9);
            c.target.z = MathUtils.clamp(c.target.z, endZ - 4, PLAZA_Z + 6);
          }}
        />
        <CameraRig shops={shops} selectedId={selectedId} controls={controls} />
      </Canvas>
    </div>
  );
}
