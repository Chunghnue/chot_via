import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Đọc màu từ packages/ui theme.css (nguồn duy nhất) cho manifest/viewport phía server — không lặp mã màu ở nơi khác. */
export function themeToken(name: string): string {
  const css = readFileSync(resolve(process.cwd(), '../../packages/ui/src/styles/theme.css'), 'utf8');
  const match = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css);
  return match?.[1]?.trim() ?? '';
}
