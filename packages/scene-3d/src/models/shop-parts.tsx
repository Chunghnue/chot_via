import { useEffect, useState } from 'react';
import { CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace } from 'three';
import type { Palette } from './palette';

/** Chữ trên biển hiệu vẽ vào texture (font lấy từ token --font-display, không viết cứng). */
export function SignText({ text, color, shadow, width, height }: { text: string; color: string; shadow: string; width: number; height: number }) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
    const draw = (): void => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = Math.round((1024 * height) / width);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let size = Math.round(canvas.height * 0.78);
      ctx.font = `800 ${size}px ${family}`;
      const measured = ctx.measureText(text).width;
      const limit = canvas.width * 0.94;
      if (measured > limit) {
        size = Math.floor((size * limit) / measured);
        ctx.font = `800 ${size}px ${family}`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = shadow;
      ctx.fillText(text, canvas.width / 2 + 4, canvas.height / 2 + 8);
      ctx.fillStyle = color;
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
      const next = new CanvasTexture(canvas);
      next.colorSpace = SRGBColorSpace;
      setTexture(next);
    };
    void document.fonts.load(`800 64px ${family}`, text).then(draw, draw);
    return () => { cancelled = true; };
  }, [text, color, shadow, width, height]);
  if (!texture) return null;
  return <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} transparent toneMapped={false} /></mesh>;
}

export function roundedPlate(w: number, h: number, r: number, depth: number): ExtrudeGeometry {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 8 });
}

export function Plant({ palette, x, z, size = 1 }: { palette: Palette; x: number; z: number; size?: number }) {
  return (
    <group position={[x, 0, z]} scale={size}>
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.32, 0.24, 0.6, 14]} /><meshStandardMaterial color={palette['cafe-pot']} roughness={0.7} /></mesh>
      <mesh position={[0, 0.85, 0]}><sphereGeometry args={[0.46, 16, 14]} /><meshStandardMaterial color={palette['scene-leaf-dark']} roughness={0.8} /></mesh>
      <mesh position={[0.18, 1.12, 0.1]}><sphereGeometry args={[0.3, 14, 12]} /><meshStandardMaterial color={palette['scene-leaf-light']} roughness={0.8} /></mesh>
      <mesh position={[-0.2, 1.0, -0.1]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={palette['scene-blossom-dark']} /></mesh>
    </group>
  );
}


const LEGS: ReadonlyArray<readonly [number, number]> = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];

function Chair({ palette, x, z, rotation }: { palette: Palette; x: number; z: number; rotation: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.52, 0]}><boxGeometry args={[0.62, 0.08, 0.62]} /><meshStandardMaterial color={palette['cafe-chair']} roughness={0.7} /></mesh>
      <mesh position={[0, 0.95, -0.28]}><boxGeometry args={[0.62, 0.7, 0.07]} /><meshStandardMaterial color={palette['cafe-chair']} roughness={0.7} /></mesh>
      {LEGS.map(([lx, lz]) => (
        <mesh key={`${lx}${lz}`} position={[lx, 0.26, lz]}><boxGeometry args={[0.07, 0.52, 0.07]} /><meshStandardMaterial color={palette['cafe-wood-dark']} /></mesh>
      ))}
    </group>
  );
}

export function Table({ palette, x, z, parasol }: { palette: Palette; x: number; z: number; parasol: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.62, 0.62, 0.07, 24]} /><meshStandardMaterial color={palette['cafe-table']} roughness={0.6} /></mesh>
      <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.07, 0.07, 0.78, 10]} /><meshStandardMaterial color={palette['cafe-wood-dark']} /></mesh>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.32, 0.34, 0.07, 18]} /><meshStandardMaterial color={palette['cafe-wood-dark']} /></mesh>
      <mesh position={[0.15, 0.86, 0.1]}><cylinderGeometry args={[0.1, 0.07, 0.12, 14]} /><meshStandardMaterial color={palette['cafe-cup']} /></mesh>
      <mesh position={[-0.2, 0.86, -0.12]}><cylinderGeometry args={[0.1, 0.07, 0.12, 14]} /><meshStandardMaterial color={palette['cafe-cup']} /></mesh>
      <Chair palette={palette} x={0} z={0.95} rotation={Math.PI} />
      <Chair palette={palette} x={0} z={-0.95} rotation={0} />
      {parasol ? (
        <group>
          <mesh position={[0, 1.45, 0]}><cylinderGeometry args={[0.04, 0.04, 1.8, 8]} /><meshStandardMaterial color={palette['cafe-wood-dark']} /></mesh>
          <mesh position={[0, 2.35, 0]}><coneGeometry args={[1.5, 0.7, 20]} /><meshStandardMaterial color={palette['cafe-parasol']} roughness={0.7} /></mesh>
        </group>
      ) : null}
    </group>
  );
}

