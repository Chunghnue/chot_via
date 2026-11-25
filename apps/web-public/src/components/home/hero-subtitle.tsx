'use client';

import { useId } from 'react';

/**
 * Dòng phụ dưới tiêu đề hero theo ảnh thiết kế ("Ghé phố – Gửi vía – Nhận vía"): băng vàng chuyển sắc viền trắng, cong cùng chiều tiêu đề (giữa cao, hai đầu thấp),
 * chữ đen đậm chạy theo đường cong. Vẽ bằng SVG nên sắc nét ở mọi cỡ; màu lấy từ token theme.
 */
export function HeroSubtitle({ text, className }: { text: string; className?: string }) {
  const id = useId();
  const arc = `${id}-arc`;
  const fill = `${id}-fill`;
  const size = Math.min(34, 700 / Math.max(text.length * 0.6, 1));
  return (
    <p className={className} aria-label={text}>
      <svg viewBox="0 0 640 84" className="w-full overflow-visible" aria-hidden role="presentation">
        <defs>
          <path id={arc} d="M 44 52 Q 320 14 596 52" fill="none" />
          <linearGradient id={fill} gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="76">
            <stop offset="0" style={{ stopColor: 'var(--color-hero-pill-top)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-hero-pill-bottom)' }} />
          </linearGradient>
        </defs>
        <path d="M 44 54 Q 320 16 596 54" fill="none" strokeLinecap="round" strokeWidth={66} style={{ stroke: 'var(--color-hero-title-outer)', opacity: 0.18 }} transform="translate(0 4)" />
        <path d="M 44 52 Q 320 14 596 52" fill="none" strokeLinecap="round" strokeWidth={64} style={{ stroke: 'var(--color-surface)' }} />
        <path d="M 44 52 Q 320 14 596 52" fill="none" strokeLinecap="round" strokeWidth={54} stroke={`url(#${fill})`} />
        <text fontSize={size} className="font-display font-extrabold" style={{ fill: 'var(--color-ink)' }}>
          <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle" dy={size * 0.34}>{text}</textPath>
        </text>
      </svg>
    </p>
  );
}
