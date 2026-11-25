export const WOOD_SIGN_IMAGE = '/images/bang-hieu-go.webp';

/** Bảng khẩu hiệu gỗ theo ảnh thiết kế: khung gỗ cắt từ ảnh thiết kế (`bang-hieu-go.webp`), dấu tick xanh và chữ trắng vẽ bằng mã nên admin sửa được nội dung ở `signLines`. */
export function WoodSign({ lines }: { lines: readonly string[] }) {
  const rows = lines.slice(0, 4);
  // Vị trí hàng (% chiều cao ảnh) và độ lệch ngang so le theo ảnh thiết kế (dòng sau lệch trái dần).
  const top = (i: number): number => (rows.length === 3 ? [24, 47, 71][i] ?? 24 : 22 + i * (56 / Math.max(rows.length - 1, 1)));
  return (
    <div className="relative w-full [container-type:inline-size]" style={{ aspectRatio: '951 / 445' }}>
      <img src={WOOD_SIGN_IMAGE} alt="" aria-hidden className="absolute inset-0 size-full select-none" draggable={false} />
      {rows.map((line, i) => (
        <p key={line} className="absolute flex items-center gap-[2.2%] whitespace-nowrap font-display text-[6cqw] font-extrabold italic leading-none text-surface [text-shadow:0_0.5cqw_0_rgb(60_25_5/0.85)]" style={{ top: `${top(i)}%`, left: `${15.5 - i * 1.1}%`, transform: 'translateY(-50%)' }}>
          <span className="grid size-[9cqw] shrink-0 place-items-center rounded-full bg-linear-to-b from-sign-check to-sign-check-dark shadow-[0_0.6cqw_1cqw_rgb(0_0_0/0.35),inset_0_0.8cqw_0_rgb(255_255_255/0.35)] ring-[0.5cqw] ring-surface/70">
            <svg viewBox="0 0 12 12" className="size-[5.4cqw] text-surface"><path d="M2.4 6.4l2.5 2.5 4.7-5.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          {line}
        </p>
      ))}
    </div>
  );
}
