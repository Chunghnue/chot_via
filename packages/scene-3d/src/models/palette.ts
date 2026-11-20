import { useMemo } from 'react';

/** Danh sách token màu của cảnh mẫu (định nghĩa giá trị duy nhất tại packages/ui/src/styles/theme.css). */
export const PALETTE_KEYS = [
  'scene-sky', 'scene-ground', 'scene-road', 'scene-sidewalk', 'scene-tree', 'scene-trunk', 'scene-lamp',
  'scene-deity-hat', 'scene-deity-robe', 'scene-deity-gold', 'scene-deity-skin', 'scene-deity-robe-dark',
  'scene-deity-cheek', 'scene-deity-beard', 'scene-deity-mouth', 'scene-deity-gem',
  'scene-tile-a', 'scene-tile-b', 'scene-tile-ring', 'scene-grass', 'scene-leaf-light', 'scene-leaf-dark',
  'scene-blossom', 'scene-blossom-dark', 'scene-far-a', 'scene-far-b', 'scene-far-c', 'scene-balloon', 'scene-balloon-stripe',
  'scene-person-a', 'scene-person-b', 'scene-person-c', 'scene-person-d', 'scene-person-skin', 'scene-person-hair',
  'scene-bench', 'scene-metal', 'scene-coin', 'scene-star',
  'cafe-wood', 'cafe-wood-dark', 'cafe-wall', 'cafe-brick', 'cafe-awning-a', 'cafe-awning-b', 'cafe-glow', 'cafe-sign',
  'cafe-sign-trim', 'cafe-cup', 'cafe-coffee', 'cafe-chair', 'cafe-table', 'cafe-pot', 'cafe-board', 'cafe-parasol',
  'shopm-fashion-wall', 'shopm-fashion-awning-a', 'shopm-fashion-awning-b', 'shopm-fashion-sign', 'shopm-fashion-accent', 'shopm-restaurant-wall', 'shopm-restaurant-awning-a', 'shopm-restaurant-awning-b', 'shopm-restaurant-sign', 'shopm-restaurant-accent', 'shopm-minimart-wall', 'shopm-minimart-awning-a', 'shopm-minimart-awning-b', 'shopm-minimart-sign', 'shopm-minimart-accent', 'shopm-sale-wall', 'shopm-sale-awning-a', 'shopm-sale-awning-b', 'shopm-sale-sign', 'shopm-sale-accent', 'shopm-glass', 'shopm-mannequin', 'shopm-crate', 'shopm-fruit-a', 'shopm-fruit-b', 'shopm-fruit-c', 'shopm-desk', 'shopm-screen', 'shopm-white',
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];
export type Palette = Readonly<Record<PaletteKey, string>>;

/** Đọc toàn bộ màu cảnh mẫu từ CSS variables của theme (không viết cứng màu trong mã). */
export function usePalette(): Palette {
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const entries = PALETTE_KEYS.map((key): [PaletteKey, string] => [key, style.getPropertyValue(`--color-${key}`).trim()]);
    return Object.fromEntries(entries) as Palette;
  }, []);
}
