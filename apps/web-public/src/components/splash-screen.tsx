'use client';

import { useEffect, useState } from 'react';

/** Khóa lưu trong sessionStorage: tab này đã có màn chờ (hoặc đã bỏ qua nó) rồi, nên tải lại hay chuyển trang trong tab này không hiện nữa. */
export const SPLASH_KEY = 'cv_splash_seen';
/** Khóa localStorage chứa nhịp "còn sống" của từng tab đang mở web (mã tab → giờ báo nhịp gần nhất), và khóa sessionStorage chứa mã của tab này. */
const ALIVE_KEY = 'cv_tabs';
const TAB_ID_KEY = 'cv_tab_id';
/** Nhịp cũ hơn mức này coi là tab đã thoát (trình duyệt tắt đột ngột). Dài vì tab chạy nền bị trình duyệt giãn hẹn giờ (khoảng 1 phút một lần). */
const ALIVE_TTL_MS = 150_000;
const BEAT_MS = 20_000;

/**
 * Đoạn chạy rất sớm trong <head> (đồng bộ, trước khung hình đầu, không đợi React) lo toàn bộ việc "web còn mở ở đâu không":
 * - Quyết định có hiện màn chờ không bằng thuộc tính `data-splash="off"` trên <html> (không xóa phần tử nên không lệch hydrate): không hiện nếu tab này
 *   đã xem rồi, hoặc còn tab khác của web đang mở (nhịp còn trong TTL). Chỉ hiện khi người dùng vào lại sau khi đã thoát hẳn mọi tab.
 * - Ghi nhịp của tab này ngay và định kỳ, xóa khi tab đóng (`pagehide`), ghi lại khi tab được khôi phục (`pageshow`) hoặc hiện lại (`visibilitychange`).
 */
export const SPLASH_BOOT_SCRIPT = `try{var K='${SPLASH_KEY}',A='${ALIVE_KEY}',I='${TAB_ID_KEY}',n=Date.now(),id=sessionStorage.getItem(I);if(!id){id=n.toString(36)+Math.random().toString(36).slice(2,8);sessionStorage.setItem(I,id)}var rd=function(){try{var v=JSON.parse(localStorage.getItem(A)||'{}');return v&&typeof v==='object'?v:{}}catch(e){return{}}},wr=function(x){try{localStorage.setItem(A,JSON.stringify(x))}catch(e){}},m=rd(),o=0;for(var k in m){if(k!==id&&typeof m[k]==='number'&&n-m[k]<${ALIVE_TTL_MS})o++}if(sessionStorage.getItem(K)||o>0)document.documentElement.setAttribute('data-splash','off');sessionStorage.setItem(K,'1');var beat=function(){var x=rd();x[id]=Date.now();wr(x)},leave=function(){var x=rd();delete x[id];wr(x)};beat();setInterval(beat,${BEAT_MS});addEventListener('pagehide',leave);addEventListener('pageshow',beat);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')beat()})}catch(e){}`;

const MIN_MS = 700;
const MAX_MS = 3500;

/**
 * Màn chờ lần đầu vào web (đặc biệt trên điện thoại): logo, tên và thanh tiến độ phủ kín màn hình trong lúc trang, ảnh phố và cảnh 3D tải.
 * Chỉ hiện khi người dùng vào lại sau khi đã thoát hẳn mọi tab/ứng dụng của web; còn đang mở ở đâu đó (chuyển trang, tab mới, F5, quay lại) thì không hiện. HTML có sẵn từ máy chủ nên hiện ngay, không đợi JavaScript.
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
      id="splash"
      aria-hidden
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-5 bg-linear-to-b from-primary-soft via-app to-gold-soft transition-opacity duration-500 ease-out ${fading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <img src="/images/logo-than-tai.webp" alt="" width={160} height={160} className="size-36 animate-float object-contain drop-shadow-lg sm:size-44" fetchPriority="high" />
      <p className="font-display text-4xl font-extrabold italic text-primary-strong">Xin Vía</p>
      <p className="-mt-3 text-sm font-bold italic text-ink">Cộng đồng người bán hàng</p>
      <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-surface shadow-card ring-1 ring-primary/20">
        <div className="h-full w-2/5 animate-splash-bar rounded-full btn-glossy" />
      </div>
    </div>
  );
}
