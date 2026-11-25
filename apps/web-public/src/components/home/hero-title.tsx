'use client';

import { useId } from 'react';

/**
 * Tiêu đề hero cong theo ảnh thiết kế ("Phố Chốt Vía 3D"): chữ trắng chuyển sang kem ở đáy, viền xanh dày, bóng xanh đậm phía dưới, uốn cong như vòm.
 * Vẽ bằng SVG (chữ nằm trên đường cong) nên sắc nét ở mọi cỡ; màu lấy từ biến theme.
 */
export function HeroTitle({ text, className }: { text: string; className?: string }) {
  const id = useId();
  const arc = `${id}-arc`;
  const fill = `${id}-fill`;
  // Cỡ chữ theo độ dài tiêu đề để luôn nằm gọn trong khung 640 rộng.
  const size = Math.min(92, 1080 / Math.max(text.length, 1));
  const common = { fontSize: size, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const on = (dy: number) => <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle" dy={dy}>{text}</textPath>;
  return (
    <h1 className={className} aria-label={text}>
      <svg viewBox="0 0 640 175" className="w-full overflow-visible" aria-hidden role="presentation">
        <defs>
          <path id={arc} d="M 24 138 Q 320 52 616 138" fill="none" />
          <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--color-surface)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--color-surface)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-gold-soft)' }} />
          </linearGradient>
        </defs>
        <g className="font-display font-extrabold italic" style={{ fontSynthesis: 'style' }}>
          <text {...common} className="fill-primary-strong stroke-primary-strong" strokeWidth={24}>{on(8)}</text>
          <text {...common} className="fill-primary stroke-primary" strokeWidth={18}>{on(0)}</text>
          <text {...common} fill={`url(#${fill})`} stroke="none">{on(0)}</text>
        </g>
      </svg>
    </h1>
  );
}
