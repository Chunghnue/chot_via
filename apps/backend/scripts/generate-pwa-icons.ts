import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

/** Sinh icon PWA từ token màu duy nhất trong packages/ui theme.css. Chạy: pnpm --filter @xin-via/backend exec tsx scripts/generate-pwa-icons.ts */
const root = resolve(process.cwd(), '../..');
const css = readFileSync(resolve(root, 'packages/ui/src/styles/theme.css'), 'utf8');
const token = (name: string): string => new RegExp(`--color-${name}:\s*([^;]+);`).exec(css)?.[1]?.trim() ?? '#16a34a';
const [primary, strong, soft, gold] = [token('primary'), token('primary-strong'), token('primary-soft'), token('gold')];

const svg = (size: number, pad: number): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${primary}"/>
  <g transform="translate(${256 - 256 * pad} ${256 - 256 * pad}) scale(${pad})">
    <circle cx="190" cy="190" r="100" fill="${soft}"/><circle cx="322" cy="190" r="100" fill="${soft}"/>
    <circle cx="190" cy="322" r="100" fill="${soft}"/><circle cx="322" cy="322" r="100" fill="${soft}"/>
    <circle cx="256" cy="256" r="52" fill="${gold}"/>
    <path d="M256 290 L292 470" stroke="${strong}" stroke-width="28" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

const out = resolve(root, 'apps/web-public/public/icons');
await mkdir(out, { recursive: true });
await sharp(Buffer.from(svg(192, 1))).png().toFile(resolve(out, 'icon-192.png'));
await sharp(Buffer.from(svg(512, 1))).png().toFile(resolve(out, 'icon-512.png'));
await sharp(Buffer.from(svg(512, 0.7))).png().toFile(resolve(out, 'icon-maskable-512.png'));
console.log('Đã sinh icon PWA.');
