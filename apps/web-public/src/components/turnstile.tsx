'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render(el: HTMLElement, options: { sitekey: string; appearance: 'interaction-only'; callback: (token: string) => void; 'expired-callback': () => void }): string;
  reset(id: string): void;
}

function isTurnstile(value: unknown): value is TurnstileApi {
  return typeof value === 'object' && value !== null && 'render' in value && typeof value.render === 'function';
}

const SITE_KEY = process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY'] ?? '';
export const turnstileEnabled = SITE_KEY !== '';

/** Cloudflare Turnstile chạy ẩn (chỉ hiện khi cần thử thách). Không cấu hình khóa = tắt. */
export function useTurnstile(): { token: string | undefined; containerRef: React.RefObject<HTMLDivElement | null>; ready: boolean } {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!turnstileEnabled) return;
    const mount = (): boolean => {
      const api: unknown = Reflect.get(window, 'turnstile');
      if (!isTurnstile(api) || !containerRef.current) return false;
      api.render(containerRef.current, { sitekey: SITE_KEY, appearance: 'interaction-only', callback: setToken, 'expired-callback': () => setToken(undefined) });
      return true;
    };
    if (mount()) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => { mount(); };
    document.head.appendChild(script);
  }, []);

  return { token, containerRef, ready: !turnstileEnabled || token !== undefined };
}
