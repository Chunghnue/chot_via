'use client';

import type { CSSProperties } from 'react';

/** Kiểu có biến CSS tùy chỉnh (vị trí đích của từng đồng xu) mà không cần ép kiểu. */
type CssVars = CSSProperties & Record<`--${string}`, string>;

const COIN_COUNT = 18;

/** Đồng xu bắn tỏa hình quạt hướng lên (hai vòng gần và xa) rồi rơi nhẹ; tọa độ cố định, không ngẫu nhiên nên lần nào cũng đẹp như nhau. */
const COINS = Array.from({ length: COIN_COUNT }, (_, i) => {
  const ring = i % 2;
  const angle = (-168 + (i / (COIN_COUNT - 1)) * 156) * (Math.PI / 180);
  const reach = ring === 0 ? 54 : 88;
  return {
    id: i,
    dx: Math.round(Math.cos(angle) * reach * 1.15),
    dy: Math.round(Math.sin(angle) * reach),
    size: ring === 0 ? 18 : 24,
    delay: (i % 6) * 0.025,
    spin: (i % 2 === 0 ? 1 : -1) * (180 + ((i * 47) % 200)),
  };
});

const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { id: i, dx: Math.round(Math.cos(angle) * 46), dy: Math.round(Math.sin(angle) * 34) };
});

function sparkStyle(s: (typeof SPARKS)[number]): CssVars {
  return { '--bx': `${s.dx}px`, '--by': `${s.dy}px`, animationDelay: `${(s.id % 4) * 0.04}s` };
}

function coinStyle(c: (typeof COINS)[number]): CssVars {
  return { width: c.size, animationDelay: `${c.delay}s`, '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--spin': `${c.spin}deg` };
}

/**
 * Tiền vàng "bùm" ngay tại cụm biểu tượng vía của bài: đồng xu bắn tỏa, tia sáng nở quanh cụm.
 * Gắn `key` bằng mã lượt bấm để mỗi lần gửi vía chạy lại từ đầu; tự ẩn khi người dùng bật giảm chuyển động.
 */
export function WishCoinPop() {
  return (
    <span aria-hidden data-testid="wish-coin-pop" className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-0 motion-reduce:hidden">
      {SPARKS.map((s) => (
        <img
          key={`s${s.id}`} src="/images/ic-sparkles.webp" alt="" draggable={false} className="absolute -ml-3 -mt-3 w-6 max-w-none animate-burst object-contain opacity-0"
          style={sparkStyle(s)}
        />
      ))}
      {COINS.map((c) => (
        <img
          key={c.id} src="/images/ic-coin.webp" alt="" draggable={false} className="absolute max-w-none animate-coin-pop object-contain opacity-0 drop-shadow-md"
          style={{ ...coinStyle(c), marginLeft: -c.size / 2, marginTop: -c.size / 2 }}
        />
      ))}
    </span>
  );
}
