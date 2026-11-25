'use client';

import { useId } from 'react';

/**
 * Tiêu đề hero theo ảnh thiết kế ("Phố Chốt Vía 3D"): uốn cong mềm như cầu vồng, các từ đầu trắng ngả xanh ngọc, hai từ cuối ("Vía 3D") vàng chuyển sắc,
 * hai lớp viền xanh (đậm ngoài, tươi trong) và bóng đổ phía dưới. Vẽ bằng SVG (chữ nằm trên đường cong) nên sắc nét ở mọi cỡ; màu lấy từ token theme.
 */
export function HeroTitle({ text, className }: { text: string; className?: string }) {
  const id = useId();
  const arc = `${id}-arc`;
  const white = `${id}-white`;
  const gold = `${id}-gold`;
  const words = text.trim().split(/\s+/);
  // Từ cuối vàng; nếu tiêu đề kết thúc bằng "3D" thì cả từ trước nó cũng vàng ("Vía 3D" như ảnh thiết kế).
  const last = words[words.length - 1] ?? '';
  const goldFrom = words.length >= 3 ? (/^3d$/i.test(last) ? words.length - 2 : words.length - 1) : words.length;
  const size = Math.min(84, 960 / Math.max(text.length, 1));
  const body = (paint: (i: number) => string | undefined) => (
    <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
      {words.map((w, i) => {
        const fill = paint(i);
        return <tspan key={`${w}-${i}`} {...(fill ? { fill } : {})} fontSize={/^3d$/i.test(w) ? size * 1.1 : size}>{i > 0 ? ` ${w}` : w}</tspan>;
      })}
    </textPath>
  );
  const layer = { fontSize: size, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const outer = { stroke: 'var(--color-hero-title-outer)', fill: 'var(--color-hero-title-outer)' };
  const edge = { stroke: 'var(--color-hero-title-edge)', fill: 'var(--color-hero-title-edge)' };
  return (
    <h1 className={className} aria-label={text}>
      <svg viewBox="0 0 640 165" className="w-full overflow-visible" aria-hidden role="presentation">
        <defs>
          <path id={arc} d="M 14 138 Q 320 44 626 138" fill="none" />
          <linearGradient id={white} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--color-hero-title-top)' }} />
            <stop offset="0.45" style={{ stopColor: 'var(--color-hero-title-top)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-hero-title-bottom)' }} />
          </linearGradient>
          <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--color-hero-title-gold-top)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-hero-title-gold-bottom)' }} />
          </linearGradient>
        </defs>
        <g className="font-display font-extrabold italic" style={{ fontSynthesis: 'style' }}>
          <text {...layer} transform="translate(0 8)" {...outer} strokeWidth={26}>{body(() => undefined)}</text>
          <text {...layer} {...outer} strokeWidth={22}>{body(() => undefined)}</text>
          <text {...layer} {...edge} strokeWidth={15}>{body(() => undefined)}</text>
          <text {...layer} stroke="none">{body((i) => `url(#${i >= goldFrom ? gold : white})`)}</text>
        </g>
      </svg>
    </h1>
  );
}
