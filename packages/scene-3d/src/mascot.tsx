import { Euler, Quaternion, Vector3, type Group } from 'three';
import type { ReactNode, RefObject } from 'react';
import { CITY_IMAGES } from './city-assets';
import { useSprite } from './city-kit';
import type { SceneColors } from './colors';

/**
 * Nhân vật phi hành gia (mũ trắng, tai nghe xanh, áo logo AB) dựng thật bằng khối 3D, cao khoảng 2 m.
 * Khuôn mặt và logo là hai tấm hình tách nền (`npc-mascot-mat.webp`, `npc-mascot-logo.webp`) dán cong lên mũ và ngực.
 * Tay trái (phía +x) cầm đồ: gắn thứ cần cầm vào `children`, nó luôn thẳng đứng dù tay đưa ra trước.
 */
export interface MascotRig {
  /** Cả thân người: xoay quanh trục đứng để quay theo hướng đi. */
  figure: RefObject<Group | null>;
  head: RefObject<Group | null>;
  legL: RefObject<Group | null>;
  legR: RefObject<Group | null>;
  /** Tay rảnh (phía -x): đung đưa khi đi, giơ lên vẫy khi xong. */
  armFree: RefObject<Group | null>;
  /** Tay cầm (phía +x): đưa ra trước giữ vật. */
  armHold: RefObject<Group | null>;
  /** Nhóm gắn ở bàn tay cầm (con của `children`): xoay nhẹ để vật lắc lư. */
  hold: RefObject<Group | null>;
}

const HEAD_R = 0.46;
const HEAD_Y = 1.55;
const SHOULDER_Y = 1.12;
const SHOULDER_X = 0.34;
const ARM_LEN = 0.47;
/** Tay cầm dang sang bên hông và hơi đưa ra trước, để tờ giấy không che mặt. */
export const HOLD_ARM_EULER = new Euler(-0.5, 0, 0.9, 'XYZ');
/** Vị trí bàn tay cầm so với gốc nhân vật (m, chưa nhân tỉ lệ), tính một lần từ góc tay. */
export const MASCOT_HAND = new Vector3(0, -ARM_LEN, 0).applyEuler(HOLD_ARM_EULER).add(new Vector3(SHOULDER_X, SHOULDER_Y, 0));
const COUNTER = new Quaternion().setFromEuler(HOLD_ARM_EULER).invert();
const COUNTER_TUPLE: [number, number, number, number] = [COUNTER.x, COUNTER.y, COUNTER.z, COUNTER.w];

/** Vật liệu bóng; `emissive` cùng màu nâng độ sáng để màu trắng không bị xám dưới ánh sáng cảnh phố. */
function Mat({ color, rough = 0.3 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={rough} metalness={0.04} />;
}

function Ear({ side, outer, suit }: { side: 1 | -1; outer: string; suit: string }) {
  return (
    <group position={[side * 0.5, -0.05, 0]} rotation={[0, 0, -side * Math.PI / 2]}>
      <mesh><cylinderGeometry args={[0.2, 0.2, 0.12, 28]} /><Mat color={suit} rough={0.25} /></mesh>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.15, 0.15, 0.05, 28]} /><Mat color={outer} rough={0.25} /></mesh>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.07, 0.07, 0.03, 20]} /><Mat color={suit} rough={0.25} /></mesh>
    </group>
  );
}

function Glove({ color, fingers }: { color: string; fingers: boolean }) {
  return (
    <group position={[0, -ARM_LEN, 0]}>
      <mesh scale={[0.11, 0.12, 0.11]}><sphereGeometry args={[1, 18, 14]} /><Mat color={color} rough={0.35} /></mesh>
      <mesh position={[0.1, 0.02, 0.05]} scale={[0.05, 0.08, 0.05]} rotation={[0, 0, -0.5]}><sphereGeometry args={[1, 12, 10]} /><Mat color={color} rough={0.35} /></mesh>
      {fingers ? [-0.065, -0.022, 0.022, 0.065].map((x, i) => (
        <mesh key={x} position={[x, -0.15 - (i === 1 || i === 2 ? 0.015 : 0), 0]}><capsuleGeometry args={[0.027, 0.06, 4, 8]} /><Mat color={color} rough={0.35} /></mesh>
      )) : null}
    </group>
  );
}

function Arm({ rigRef, side, suit, glove, fingers, children }: { rigRef: RefObject<Group | null>; side: 1 | -1; suit: string; glove: string; fingers: boolean; children?: ReactNode }) {
  return (
    <group ref={rigRef} position={[side * SHOULDER_X, SHOULDER_Y, 0]} rotation={side === 1 ? [HOLD_ARM_EULER.x, HOLD_ARM_EULER.y, HOLD_ARM_EULER.z] : [0, 0, 0]}>
      <mesh position={[0, -0.2, 0]}><capsuleGeometry args={[0.07, 0.24, 6, 12]} /><Mat color={suit} /></mesh>
      <Glove color={glove} fingers={fingers} />
      {children}
    </group>
  );
}

function Leg({ rigRef, side, boot, suit }: { rigRef: RefObject<Group | null>; side: 1 | -1; boot: string; suit: string }) {
  return (
    <group ref={rigRef} position={[side * 0.14, 0.62, 0]}>
      <mesh position={[0, -0.1, 0]}><capsuleGeometry args={[0.085, 0.1, 6, 12]} /><Mat color={suit} /></mesh>
      <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.15, 0.17, 0.3, 22]} /><Mat color={boot} rough={0.3} /></mesh>
      <mesh position={[0, -0.5, 0.05]} scale={[0.2, 0.11, 0.29]}><sphereGeometry args={[1, 22, 14]} /><Mat color={suit} rough={0.25} /></mesh>
    </group>
  );
}

export function Mascot({ rig, colors, children }: { rig: MascotRig; colors: SceneColors; children?: ReactNode }) {
  const face = useSprite(CITY_IMAGES.mascotFace);
  const logo = useSprite(CITY_IMAGES.mascotLogo);
  const { mascotSuit: suit, mascotTeal: teal, mascotGreen: green } = colors;
  return (
    <group ref={rig.figure}>
      <Leg rigRef={rig.legL} side={-1} boot={teal} suit={suit} />
      <Leg rigRef={rig.legR} side={1} boot={green} suit={suit} />
      <mesh position={[0, 0.63, 0]} scale={[0.24, 0.15, 0.19]}><sphereGeometry args={[1, 22, 14]} /><Mat color={suit} /></mesh>
      <group position={[0, 0.82, 0]} scale={[0.3, 0.32, 0.24]}>
        <mesh><sphereGeometry args={[1, 30, 22]} /><Mat color={suit} /></mesh>
        <mesh renderOrder={2}>
          <sphereGeometry args={[1.012, 24, 16, Math.PI / 2 - 0.55, 1.1, 1.02, 0.66]} />
          <meshBasicMaterial map={logo} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} toneMapped={false} />
        </mesh>
      </group>
      <Arm rigRef={rig.armFree} side={-1} suit={suit} glove={green} fingers />
      <Arm rigRef={rig.armHold} side={1} suit={suit} glove={teal} fingers={false}>
        <group position={[0, -ARM_LEN, 0]} quaternion={COUNTER_TUPLE}>
          <group ref={rig.hold}>{children}</group>
        </group>
      </Arm>
      <group ref={rig.head} position={[0, HEAD_Y, 0]}>
        <mesh><sphereGeometry args={[HEAD_R, 40, 28]} /><Mat color={suit} rough={0.18} /></mesh>
        <mesh renderOrder={2}>
          <sphereGeometry args={[HEAD_R + 0.012, 36, 24, Math.PI / 2 - 0.975, 1.95, 1.255, 1.25]} />
          <meshBasicMaterial map={face} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} toneMapped={false} />
        </mesh>
        <Ear side={-1} outer={teal} suit={suit} />
        <Ear side={1} outer={green} suit={suit} />
      </group>
    </group>
  );
}
