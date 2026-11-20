import type { z } from 'zod';

type Kind = 'local' | 'session';

function area(kind: Kind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Đọc JSON an toàn: storage bị chặn/hỏng/sai khuôn → trả null để giao diện vẫn chạy bình thường (NFR). */
export function readJson<S extends z.ZodTypeAny>(kind: Kind, key: string, schema: S): z.output<S> | null {
  try {
    const raw = area(kind)?.getItem(key);
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeJson(kind: Kind, key: string, value: unknown): void {
  try {
    area(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage đầy hoặc bị chặn: bỏ qua */
  }
}

export function removeKey(kind: Kind, key: string): void {
  try {
    area(kind)?.removeItem(key);
  } catch {
    /* bỏ qua */
  }
}

export const STORAGE_KEYS = { wish: 'cv_wish_today', offlinePack: 'cv_offline_pack', draft: 'cv_composer_draft' } as const;
