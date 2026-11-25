'use client';

import { useId } from 'react';

/**
 * Tiêu đề hero cong nhẹ theo ảnh thiết kế ("Phố Chốt Vía 3D"): chữ nghiêng trắng ngả xanh ngọc ở đáy, hai lớp viền xanh (đậm ngoài, tươi trong), bóng đổ phía dưới;
 * "3D" lớn hơn một chút. Vẽ bằng SVG (chữ nằm trên đường cong) nên sắc nét ở mọi cỡ; màu lấy từ token theme.
 */
export function HeroTitle({ text, className }: { text: string; className?: string }) {
  const id = useId();
  const arc = `${id}-arc`;
  const fill = `${id}-fill`;
  const m = /^(.*?)\s+(3D)$/.exec(text);
  const head = m ? `${m[1]} ` : text;
  const tail = m ? (m[2] ?? '') : '';
  const size = Math.min(88, 1000 / Math.max(text.length, 1));
  const body = (
    <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
      {head}{tail ? <tspan fontSize={size * 1.16}>{tail}</tspan> : null}
    </textPath>
  );
  const layer = { fontSize: size, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <h1 className={className} aria-label={text}>
      <svg viewBox="0 0 640 150" className="w-full overflow-visible" aria-hidden role="presentation">
        <defs>
          <path id={arc} d="M 14 112 Q 320 70 626 112" fill="none" />
          <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" style={{ stopColor: 'var(--color-hero-title-top)' }} />
            <stop offset="0.5" style={{ stopColor: 'var(--color-hero-title-top)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-hero-title-bottom)' }} />
          </linearGradient>
        </defs>
        <g className="font-display font-extrabold italic" style={{ fontSynthesis: 'style' }}>
          <text {...layer} transform="translate(0 7)" style={{ stroke: 'var(--color-hero-title-outer)', fill: 'var(--color-hero-title-outer)' }} strokeWidth={26}>{body}</text>
          <text {...layer} style={{ stroke: 'var(--color-hero-title-outer)', fill: 'var(--color-hero-title-outer)' }} strokeWidth={22}>{body}</text>
          <text {...layer} style={{ stroke: 'var(--color-hero-title-edge)', fill: 'var(--color-hero-title-edge)' }} strokeWidth={15}>{body}</text>
          <text {...layer} fill={`url(#${fill})`} stroke="none">{body}</text>
        </g>
      </svg>
    </h1>
  );
}
