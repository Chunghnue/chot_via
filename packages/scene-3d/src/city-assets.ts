import type { SceneModelKey } from '@chot-via/shared';

/** Thư mục ảnh cảnh phố (tách nền từ bộ thiết kế). Thay file cùng tên là đổi hình, không sửa code. */
const P = '/images/pho/';

export const CITY_IMAGES = {
  backdrop: '/images/pho-nen.webp',
  ground: `${P}san-pho.webp`,
  coin: '/images/ic-coin.webp',
  deityPoses: ['/images/than-tai.webp', '/images/than-tai-nhan-via.webp', '/images/than-tai-bo-dung.webp'],
  deityWalk: `${P}than-tai-di.webp`,
  mascotFace: `${P}npc-mascot-mat.webp`,
  mascotLogo: `${P}npc-mascot-logo.webp`,
  walkers: [`${P}npc-chu-quan.webp`, `${P}npc-chu-shop.webp`, `${P}npc-khach.webp`, `${P}npc-cong-dong.webp`],
} as const;

/** Bề rộng (mét) của mặt tiền từng loại cửa hàng trong cảnh. */
export const SHOP_WIDTH: Record<SceneModelKey, number> = {
  cafe: 8.4, fashion: 7.2, minimart: 7.6, restaurant: 7.2, pharmacy: 7, retail: 7.2, sale_office: 8.2, generic: 7.2,
};

/**
 * Cánh cửa thật trên hình từng kiểu cửa hàng (đo trên hình): `x` = tâm cửa so với tâm hình (tỉ lệ theo bề rộng), `w` = rộng (theo bề rộng),
 * `bottom` = mép dưới cửa tính từ đáy hình, `h` = cao (theo chiều cao hình), `aspect` = cao / rộng của hình.
 * Cánh cửa dựng đè, chỗ Thần Tài đứng gõ cửa, điểm bắn vàng và chỗ người đốt vía bước ra đều tính từ đây.
 */
export const SHOP_DOOR: Record<SceneModelKey, { x: number; w: number; bottom: number; h: number; aspect: number }> = {
  cafe: { x: 0.03, w: 0.13, bottom: 0.25, h: 0.33, aspect: 0.667 },
  minimart: { x: -0.03, w: 0.14, bottom: 0.2, h: 0.34, aspect: 0.721 },
  fashion: { x: 0.15, w: 0.12, bottom: 0.2, h: 0.36, aspect: 0.75 },
  restaurant: { x: 0.1, w: 0.12, bottom: 0.25, h: 0.34, aspect: 0.667 },
  pharmacy: { x: -0.01, w: 0.16, bottom: 0.09, h: 0.38, aspect: 0.988 },
  retail: { x: -0.11, w: 0.1, bottom: 0.14, h: 0.3, aspect: 0.75 },
  sale_office: { x: -0.17, w: 0.12, bottom: 0.2, h: 0.37, aspect: 0.667 },
  generic: { x: -0.11, w: 0.1, bottom: 0.14, h: 0.3, aspect: 0.75 },
};

/** Vị trí và cỡ cánh cửa (m) của một cửa hàng rộng `width`: `x` lệch so với tâm cửa hàng, `y` là độ cao chân cửa so với mặt đất. */
export function doorOf(key: SceneModelKey, width: number): { x: number; y: number; w: number; h: number } {
  const d = SHOP_DOOR[key];
  const imageHeight = width * d.aspect;
  return { x: d.x * width, y: d.bottom * imageHeight, w: d.w * width, h: d.h * imageHeight };
}

/**
 * Model GLB thay cho hình phẳng (xoay 360° thật, thấy cả mặt hông và mặt sau). Khóa là loại cửa hàng (`SceneModelKey`) hoặc `deity` (Thần Tài).
 * Để trống = dùng hình tách nền (luôn hướng về người xem). Khi có model GLB có texture đúng phong cách, chỉ cần điền vào đây.
 * `scale` nhân kích thước model; `y` nâng model lên (Thần Tài đứng trên bệ cao khoảng 1 m).
 */
export const CITY_GLB_OVERRIDES: Partial<Record<SceneModelKey | 'deity', { url: string; scale: number }>> = {};

/**
 * Model GLB có xương của Thần Tài trong nghi lễ Thỉnh Thần Tài (xoay đủ mọi góc, đi bộ như người thật). Để `null` = dùng bản dựng bằng khối 3D trong `deity-rig.tsx`.
 * Khi có file: đặt vào `apps/web-public/public/3d/models/`, điền `url` và tên các clip (xem `docs/THAN-TAI-GLB.md`).
 * `scale` đưa model về cao khoảng 4,3 m, `y` nâng/hạ để chân chạm đất, `walkSpeed` là tốc độ (m/s) mà clip đi bộ gốc diễn ra ở nhịp 1x.
 */
export interface RitualGlb { url: string; scale: number; y: number; walkSpeed: number; clips: { idle: string; walk: string; wave?: string; throw?: string } }
export const RITUAL_DEITY_GLB: RitualGlb | null = null;

export interface DecorItem { src: string; x: number; z: number; width: number; face?: number; flip?: boolean; shadow?: number }

/** Hệ số thu nhỏ chung của đồ trang trí so với con số ghi ở dưới. */
const K = 0.78;
const d = (name: string, x: number, z: number, width: number, extra: Partial<DecorItem> = {}): DecorItem => ({ src: `${P}${name}.webp`, x, z, width: width * K, ...extra });

/** Cây, đồ trang trí và vật dụng đặt quanh phố (toạ độ mét; x ngang, z là chiều sâu, quảng trường Thần Tài ở (0, 1)). */
export const CITY_DECOR: readonly DecorItem[] = [
  // Hàng cây phía sau cửa hàng và hai bên, tạo khung cho cảnh
  d('cay-hoa-dao', -24, 13, 11), d('cay-xanh', 24, 14, 10, { flip: true }),
  d('cay-hoa-dao', 21, -3, 10), d('cay-xanh', -22, -4, 10, { flip: true }),
  d('cay-mai', -21.5, -14, 9), d('cay-hoa-dao', 21.5, -14, 9.5, { flip: true }),
  d('cay-xanh', -17, -24, 9), d('cay-mai', 17.5, -24, 9, { flip: true }),
  d('cay-xanh', -31, -26, 10, { flip: true }), d('cay-hoa-dao', 31, -27, 10),
  d('cay-mai', -26, 4, 9), d('cay-xanh', 26, 3, 9),
  // Quanh quảng trường Thần Tài
  d('tui-loc', -5.6, 4.2, 2.8, { shadow: 0.5 }), d('hop-qua', 5.8, 4.2, 2.7, { shadow: 0.5 }),
  d('thoi-vang', -3.4, 6, 1.7, { shadow: 0.4 }), d('dong-tien', 3.5, 6.2, 1.5, { shadow: 0.4 }),
  d('bon-hoa', -7.4, 7.5, 4.2, { shadow: 0.5 }), d('bon-hoa', 7.4, 7.6, 4.2, { shadow: 0.5, flip: true }),
  d('chau-hoa', -8.2, 1, 1.8), d('chau-hoa', 8.2, 0.5, 1.8),
  // Dọc phố
  d('ghe-cong-vien', -7.7, -3.2, 3.2, { shadow: 0.4 }), d('ghe-cong-vien', 7.7, -3.4, 3.2, { shadow: 0.4, flip: true }),
  d('ghe-cong-vien', -7.7, -11.7, 3.2, { shadow: 0.4 }), d('ghe-cong-vien', 7.7, -12, 3.2, { shadow: 0.4, flip: true }),
  d('bui-cay', -11.8, 9, 3.4, { shadow: 0.5 }), d('bui-cay', 12.6, 8.4, 3.4, { shadow: 0.5 }),
  d('hang-rao', -9.2, -18.5, 4.6), d('hang-rao', 9.2, -18.8, 4.6),
  d('banner', -8.2, -7.8, 1.9), d('banner', 8.2, -8, 1.9), d('banner', -8.2, -16.8, 1.9), d('banner', 8.2, -17, 1.9),
  d('ban-ghe', -17.4, 5.2, 4.2), d('ban-ghe', 17.2, -3.4, 4.2, { flip: true }),
  d('may-man', 0, -9.5, 2.4, { shadow: 0.4 }),
  d('dai-phun-nuoc', 0, -23, 7.5, { shadow: 0.6 }),
  d('cong-chao', 0, -36, 20),
  d('cau-canh', 17, 12, 8, { flip: true }), d('da-canh', -15.5, 11.5, 3.4),
  d('choi-nghi', 16.8, -17.5, 6.5),
];

/**
 * Cửa hàng xếp hình chữ V quanh quảng trường: càng xa càng lệch ra ngoài để không bị cửa hàng phía trước che
 * (vị trí gốc trong admin là tọa độ cho cảnh GLB, nên cảnh này chỉ dùng chúng làm gốc rồi dạt ra).
 */
export function spreadShopX(x: number, z: number): number {
  const out = Math.max(0, 4 - z) * 0.45;
  return x + Math.sign(x) * out;
}

/** Cột đèn: [x, z]. */
export const CITY_LAMPS: readonly (readonly [number, number])[] = [
  [-8.4, -1.2], [8.4, -1.4], [-8.4, -9.8], [8.4, -10], [-8.4, -19], [8.4, -19.2],
];
