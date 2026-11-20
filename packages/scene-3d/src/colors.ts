import { useMemo } from 'react';
import type { SceneModelKey } from '@chot-via/shared';

export interface SceneColors {
  sky: string; ground: string; road: string; sidewalk: string; tree: string; trunk: string; lamp: string; plaza: string;
  deityHat: string; deityRobe: string; deityGold: string; deitySkin: string; wall: string; glass: string;
  shopCafe: string; shopFashion: string; shopMinimart: string; shopRestaurant: string; shopRetail: string; shopSaleOffice: string; shopGeneric: string;
  gold: string; wish: string; primary: string; surface: string; ink: string; onWish: string;
  grass: string; tileA: string; tileB: string; tileRing: string; personA: string; personB: string; personC: string; personD: string; personSkin: string; personHair: string; coin: string;
  leafLight: string; leafDark: string; blossom: string; blossomDark: string; bench: string; metal: string; red: string; stripe: string; stone: string; water: string; mai: string;
}

/** Màu cảnh 3D đọc từ token trong theme.css (một nguồn duy nhất), không viết cứng trong mã. */
export function useSceneColors(): SceneColors {
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const c = (name: string): string => style.getPropertyValue(`--color-${name}`).trim();
    return {
      sky: c('scene-sky'), ground: c('scene-ground'), road: c('scene-road'), sidewalk: c('scene-sidewalk'), tree: c('scene-tree'),
      trunk: c('scene-trunk'), lamp: c('scene-lamp'), plaza: c('scene-plaza'), deityHat: c('scene-deity-hat'), deityRobe: c('scene-deity-robe'),
      deityGold: c('scene-deity-gold'), deitySkin: c('scene-deity-skin'), wall: c('shop-wall'), glass: c('shop-glass'),
      shopCafe: c('shop-cafe'), shopFashion: c('shop-fashion'), shopMinimart: c('shop-minimart'), shopRestaurant: c('shop-restaurant'),
      shopRetail: c('shop-retail'), shopSaleOffice: c('shop-sale-office'), shopGeneric: c('shop-generic'),
      gold: c('gold'), wish: c('wish'), primary: c('primary'), surface: c('surface'), ink: c('ink'), onWish: c('on-wish'),
      grass: c('scene-grass'), tileA: c('scene-tile-a'), tileB: c('scene-tile-b'), tileRing: c('scene-tile-ring'),
      personA: c('scene-person-a'), personB: c('scene-person-b'), personC: c('scene-person-c'), personD: c('scene-person-d'), personSkin: c('scene-person-skin'), personHair: c('scene-person-hair'), coin: c('scene-coin'),
      leafLight: c('scene-leaf-light'), leafDark: c('scene-leaf-dark'), blossom: c('scene-blossom'), blossomDark: c('scene-blossom-dark'), bench: c('scene-bench'), metal: c('scene-metal'),
      red: c('scene-balloon'), stripe: c('scene-balloon-stripe'), stone: c('scene-stone'), water: c('scene-water'), mai: c('scene-mai'),
    };
  }, []);
}

export function shopColor(colors: SceneColors, key: SceneModelKey): string {
  switch (key) {
    case 'cafe': return colors.shopCafe;
    case 'fashion': return colors.shopFashion;
    case 'minimart': return colors.shopMinimart;
    case 'restaurant': return colors.shopRestaurant;
    case 'pharmacy': return colors.shopMinimart;
    case 'retail': return colors.shopRetail;
    case 'sale_office': return colors.shopSaleOffice;
    case 'generic': return colors.shopGeneric;
  }
}
