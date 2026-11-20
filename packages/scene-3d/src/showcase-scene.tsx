import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Mesh } from 'three';
import { CafeModel } from './models/cafe-model';
import { DeityModel } from './models/deity-model';
import { usePalette } from './models/palette';
import { ShopModel } from './models/shop-model';
import { Bench, BlossomTree, Ground, RoundTree, Skyline, StreetLamp, Walker } from './models/scenery';

export interface ShowcaseSceneProps {
  /** Chữ trên biển hiệu các cửa hàng (từ i18n ở nơi gọi). */
  signs: { cafe: string; fashion: string; restaurant: string; minimart: string; sale: string };
  reducedMotion: boolean;
  onSelectDeity?: () => void;
  onSelectCafe?: () => void;
  className?: string;
}

/** Bật đổ bóng cho toàn bộ khối trong cảnh (trừ vật liệu không chịu ánh sáng). */
function ShadowAll() {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        const lit = material !== undefined && material.type !== 'MeshBasicMaterial';
        object.castShadow = lit;
        object.receiveShadow = lit;
      }
    });
  });
  return null;
}

/** Cảnh mẫu: quảng trường Thần Tài + Quán Cafe để đối chiếu với thiết kế trước khi dựng cả phố. */
export default function ShowcaseScene({ signs, reducedMotion, onSelectDeity, onSelectCafe, className }: ShowcaseSceneProps) {
  const palette = usePalette();
  return (
    <div className={className} style={{ touchAction: 'none' }}>
      <Canvas flat shadows dpr={[1, 2]} camera={{ position: [0, 4.4, 14.2], fov: 56 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={[palette['scene-sky']]} />
        <fog attach="fog" args={[palette['scene-sky'], 55, 120]} />
        <hemisphereLight args={[palette['scene-sky'], palette['scene-grass'], 1.25]} />
        <directionalLight
          position={[12, 22, 14]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={90}
        />
        <Ground palette={palette} />
        <Skyline palette={palette} reducedMotion={reducedMotion} />
        <DeityModel palette={palette} reducedMotion={reducedMotion} onSelect={onSelectDeity} />
        <group position={[-11.4, 0, -2.6]} rotation={[0, 0.82, 0]}>
          <CafeModel palette={palette} signText={signs.cafe} onSelect={onSelectCafe} />
        </group>
        <group position={[-10.9, 0, -12.2]} rotation={[0, 1.3, 0]}><ShopModel kind="fashion" palette={palette} signText={signs.fashion} /></group>
        <group position={[-10.9, 0, -20.6]} rotation={[0, 1.4, 0]}><ShopModel kind="restaurant" palette={palette} signText={signs.restaurant} /></group>
        <group position={[11.4, 0, -2.6]} rotation={[0, -0.82, 0]}><ShopModel kind="minimart" palette={palette} signText={signs.minimart} /></group>
        <group position={[10.9, 0, -12.4]} rotation={[0, -1.3, 0]}><ShopModel kind="sale" palette={palette} signText={signs.sale} /></group>
        <BlossomTree palette={palette} x={-18} z={-4} scale={1.25} />
        <RoundTree palette={palette} x={-18} z={-15} scale={1.1} />
        <RoundTree palette={palette} x={18.5} z={-4} scale={1.2} />
        <BlossomTree palette={palette} x={18} z={-12} scale={1.15} />
        <RoundTree palette={palette} x={17.5} z={-21} />
        <RoundTree palette={palette} x={-20} z={4} />
        <RoundTree palette={palette} x={19} z={4} scale={1.1} />
        <StreetLamp palette={palette} x={-6.2} z={-9} />
        <StreetLamp palette={palette} x={6.2} z={-9} />
        <StreetLamp palette={palette} x={-6.2} z={-20} />
        <StreetLamp palette={palette} x={6.2} z={-20} />
        <Bench palette={palette} x={9} z={4.2} rotation={-2.2} />
        <Bench palette={palette} x={-8.6} z={6.6} rotation={2.4} />
        <Walker palette={palette} reducedMotion={reducedMotion} x={0} z={-3.5} shirt="scene-person-a" facing={0} span={9} speed={0.2} />
        <Walker palette={palette} reducedMotion={reducedMotion} x={0} z={-7} shirt="scene-person-d" facing={0} span={4} speed={0.28} />
        <Walker palette={palette} reducedMotion={reducedMotion} x={0} z={-14} shirt="scene-person-b" facing={0} span={3.5} speed={0.4} />
        <ShadowAll />
        <OrbitControls target={[0, 2.6, 0]} enablePan={false} minAzimuthAngle={-0.9} maxAzimuthAngle={0.9} minDistance={9} maxDistance={32} minPolarAngle={0.9} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
    </div>
  );
}
