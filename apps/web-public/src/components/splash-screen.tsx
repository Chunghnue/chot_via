'use client';

import { useEffect, useState } from 'react';

/** Khóa lưu trong sessionStorage: đã hiện màn chờ trong phiên này (mỗi lần mở lại tab hoặc ứng dụng là một phiên mới). */
export const SPLASH_KEY = 'cv_splash_seen';

/** Đoạn chạy rất sớm trong <head>: phiên này đã xem màn chờ thì ẩn ngay từ khung hình đầu (bằng thuộc tính trên <html>, không xóa phần tử nên không lệch hydrate). */
export const SPLASH_BOOT_SCRIPT = `try{if(sessionStorage.getItem('${SPLASH_KEY}'))document.documentElement.setAttribute('data-splash','off')}catch(e){}`;

const MIN_MS = 700;
const MAX_MS = 3500;

/**
 * Màn chờ lần đầu vào web (đặc biệt trên điện thoại): logo, tên và thanh tiến độ phủ kín màn hình trong lúc trang, ảnh phố và cảnh 3D tải.
 * Chỉ hiện ở lần truy cập đầu tiên của mỗi phiên; chuyển trang hoặc quay lại trang chủ không hiện lại. HTML có sẵn từ máy chủ nên hiện ngay, không đợi JavaScript.
 */
export function SplashScreen() {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute('data-splash') === 'off') return undefined;
    const started = performance.now();
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      setFading(true);
      window.setTimeout(() => {
        root.setAttribute('data-splash', 'off');
        try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch { /* chế độ riêng tư: bỏ qua */ }
      }, 450);
    };
    const heroReady = (): boolean => {
      const img = document.querySelector<HTMLImageElement>('img[src*="pho-3d-hero"]');
      return img === null || (img.complete && img.naturalWidth > 0);
    };
    const check = (): void => {
      const elapsed = performance.now() - started;
      if (elapsed >= MAX_MS || (elapsed >= MIN_MS && document.readyState === 'complete' && heroReady())) finish();
    };
    const id = window.setInterval(check, 120);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div
      id="splash" aria-hidden
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-5 bg-linear-to-b from-primary-soft via-app to-gold-soft transition-opacity duration-500 ease-out ${fading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <img src="/images/logo-than-tai.webp" alt="" width={160} height={160} className="size-36 animate-float object-contain drop-shadow-lg sm:size-44" fetchPriority="high" />
      <p className="font-display text-4xl font-extrabold italic text-primary-strong">Chốt Vía</p>
      <p className="-mt-3 text-sm font-bold italic text-ink">Cộng đồng người bán hàng</p>
      <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-surface shadow-card ring-1 ring-primary/20">
        <div className="h-full w-2/5 animate-splash-bar rounded-full btn-glossy" />
      </div>
    </div>
  );
}
