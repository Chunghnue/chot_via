import { useEffect, useMemo } from 'react';
import { CanvasTexture } from 'three';

/** Nhãn nổi dạng sprite vẽ từ canvas (không dùng Html của drei để tránh dựng/huỷ root React trong lúc render). */
export function Label({ text, position, bg, fg, size = 1 }: { text: string; position: [number, number, number]; bg: string; fg: string; size?: number }) {
  const { map, aspect } = useMemo(() => {
    const px = 2;
    const font = `700 ${34 * px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return { map: null, aspect: 1 };
    probe.font = font;
    const padX = 26 * px;
    const w = Math.ceil(probe.measureText(text).width + padX * 2);
    const h = 58 * px;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    if (!g) return { map: null, aspect: 1 };
    g.fillStyle = bg;
    g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.fill();
    g.font = font; g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + px);
    const tex = new CanvasTexture(cv);
    tex.anisotropy = 4;
    return { map: tex, aspect: w / h };
  }, [text, bg, fg]);
  useEffect(() => () => { map?.dispose(); }, [map]);
  if (!map) return null;
  const h = 0.9 * size;
  return (
    <sprite position={position} scale={[h * aspect, h, 1]} renderOrder={10}>
      <spriteMaterial map={map} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}
