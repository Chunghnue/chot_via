import { z } from 'zod';
import { FEED_TYPES, HOME_ACTION_KINDS, SCENE_MODEL_KEYS, type SceneModelKey } from '../enums';
import { IdSchema } from '../common';

export const HomePropSchema = z.object({
  glbUrl: z.string().trim().min(1).max(500),
  x: z.number().min(-80).max(80), z: z.number().min(-80).max(80), rotationDeg: z.number().min(-360).max(360), scale: z.number().min(0.1).max(20),
});
export type HomeProp = z.infer<typeof HomePropSchema>;

/** Cấu hình hero trang chủ (một bản duy nhất, admin sửa ở màn "Trang chủ"). Ảnh phố và file 3D đều là đường dẫn để thay được mà không đổi code. */
export const HomeConfigSchema = z.object({
  heroImageUrl: z.string().trim().min(1).max(500),
  heroTitle: z.string().trim().min(2).max(60),
  heroSubtitle: z.string().trim().min(2).max(80),
  ctaHint: z.string().trim().max(80),
  signLines: z.array(z.string().trim().min(1).max(40)).max(6),
  /** Ô đăng bài nhanh ở bảng tin trang chủ: ảnh đại diện mặc định (khi chưa đăng nhập hoặc chưa có ảnh) và chữ gợi ý. */
  composeAvatarUrl: z.string().trim().max(500),
  composePlaceholder: z.string().trim().max(120),
  /** Các chip lọc bảng tin trang chủ, theo thứ tự (chữ lấy từ loại bài; `emoji` hiện sau chữ, để trống nếu không cần). */
  feedFilters: z.array(z.object({ type: z.enum(FEED_TYPES), emoji: z.string().trim().max(8) })).min(1).max(6),
  /** File GLB cả phố (tuỳ chọn); trống thì ghép từng cửa hàng theo bố cục phố. */
  streetGlbUrl: z.string().trim().max(500).nullable(),
  /** Vùng bấm Thần Tài trên ảnh phố (% khung ảnh). */
  /** Model Thần Tài trong cảnh 3D (GLB) và tỉ lệ. */
  deityGlbUrl: z.string().trim().max(500).nullable(),
  deityScale: z.number().min(0.2).max(10),
  deityRegion: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100), w: z.number().min(0).max(100), h: z.number().min(0).max(100) }),
  camera: z.object({
    fov: z.number().min(20).max(80),
    distance: z.number().min(6).max(80),
    height: z.number().min(1).max(40),
    minPolarDeg: z.number().min(10).max(85),
    maxPolarDeg: z.number().min(20).max(89),
    autoRotate: z.boolean(),
    /** Điểm camera nhìn vào (mét): độ cao và vị trí dọc phố. */
    targetY: z.number().min(0).max(20),
    targetZ: z.number().min(-60).max(60),
  }),
  /** Vật trang trí đặt trên phố (cây, đèn đường, ghế, đài phun nước, quà…): mỗi vật là một file GLB. */
  props: z.array(HomePropSchema).max(80),
  /** Số người đi bộ trên vỉa hè (0 = tắt) và hiệu ứng tia sáng quanh Thần Tài. */
  pedestrians: z.number().int().min(0).max(40),
  sparkles: z.boolean(),
});
export type HomeConfig = z.infer<typeof HomeConfigSchema>;

const pct = z.number().min(0).max(100);
const code = z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'invalid_string');

export const HomeActionInputSchema = z.object({
  code, label: z.string().trim().min(2).max(40), subLabel: z.string().trim().max(60),
  iconUrl: z.string().trim().max(500).nullable(), kind: z.enum(HOME_ACTION_KINDS), href: z.string().trim().max(200).nullable(),
  showMobile: z.boolean(), showTablet: z.boolean(), showDesktop: z.boolean(), sortOrder: z.number().int(),
  /** Thứ tự riêng trên iPad / máy tính (null = theo sortOrder). */
  sortTablet: z.number().int().nullable(), sortDesktop: z.number().int().nullable(), active: z.boolean(),
});
export type HomeActionInput = z.infer<typeof HomeActionInputSchema>;

export const FooterLinkInputSchema = z.object({
  groupName: z.string().trim().min(2).max(40), label: z.string().trim().min(2).max(60), href: z.string().trim().min(1).max(300), sortOrder: z.number().int(), active: z.boolean(),
});
export type FooterLinkInput = z.infer<typeof FooterLinkInputSchema>;

/** Một ô cửa hàng trên phố: vùng bấm trên ảnh phố (% khung ảnh) và vị trí trong cảnh WebGL (mét, độ). */
export const StreetSlotInputSchema = z.object({
  label: z.string().trim().min(2).max(40),
  placeId: IdSchema.nullable(),
  sceneTemplateId: IdSchema,
  imageX: pct, imageY: pct, imageW: pct, imageH: pct,
  posX: z.number().min(-60).max(60), posZ: z.number().min(-60).max(60), rotationDeg: z.number().min(-360).max(360),
  sortOrder: z.number().int(), active: z.boolean(),
});
export type StreetSlotInput = z.infer<typeof StreetSlotInputSchema>;

export const HomeActionDtoSchema = HomeActionInputSchema.pick({
  code: true,
  label: true,
  subLabel: true,
  iconUrl: true,
  kind: true,
  href: true,
  showMobile: true,
  showTablet: true,
  showDesktop: true,
  sortTablet: true,
  sortDesktop: true,
});
export type HomeActionDto = z.infer<typeof HomeActionDtoSchema>;
export const FooterLinkDtoSchema = FooterLinkInputSchema.pick({ groupName: true, label: true, href: true });
export type FooterLinkDto = z.infer<typeof FooterLinkDtoSchema>;

export const StreetSlotDtoSchema = z.object({
  id: IdSchema, label: z.string(), placeId: IdSchema.nullable(), modelKey: z.enum(SCENE_MODEL_KEYS),
  glb: z.object({ high: z.string().nullable(), lod1: z.string().nullable(), lod2: z.string().nullable() }), modelScale: z.number(),
  region: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  position: z.object({ x: z.number(), z: z.number(), rotationDeg: z.number() }),
});
export type StreetSlotDto = z.infer<typeof StreetSlotDtoSchema>;

export const HomeLayoutSchema = z.object({
  config: HomeConfigSchema,
  actions: z.array(HomeActionDtoSchema),
  footerLinks: z.array(FooterLinkDtoSchema),
  street: z.array(StreetSlotDtoSchema),
});
export type HomeLayout = z.infer<typeof HomeLayoutSchema>;

const M = '/3d/models/';
/** Bố cục vật trang trí mặc định theo gói 3D v2: cây hai bên, đèn đường dọc vỉa hè, ghế, quà cạnh Thần Tài, đài phun nước cuối phố. */
const DEFAULT_HOME_PROPS: HomeProp[] = [
  ...[8, -2, -12, -22].flatMap((z, i) =>
    [-1, 1].map((side) => ({ glbUrl: `${M}${(i + (side > 0 ? 1 : 0)) % 2 === 0 ? 'tree_green' : 'tree_blossom'}.glb`, x: side * 17, z, rotationDeg: 0, scale: 1.7 })),
  ),
  ...[11, 1, -9, -19].flatMap((z) => [-1, 1].map((side) => ({ glbUrl: `${M}street_lamp.glb`, x: side * 5.8, z, rotationDeg: 0, scale: 1.3 }))),
  { glbUrl: `${M}bench.glb`, x: -7.4, z: -0.5, rotationDeg: 90, scale: 1.3 },
  { glbUrl: `${M}bench.glb`, x: 7.4, z: -0.5, rotationDeg: -90, scale: 1.3 },
  { glbUrl: `${M}gift.glb`, x: -3, z: 5, rotationDeg: 20, scale: 1.5 },
  { glbUrl: `${M}gift.glb`, x: 3.2, z: 5.2, rotationDeg: -30, scale: 1.3 },
  { glbUrl: `${M}fountain.glb`, x: 0, z: -26, rotationDeg: 0, scale: 2.4 },
];

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  heroImageUrl: '/images/pho-3d-hero.webp',
  heroTitle: 'Phố Xin Vía',
  heroSubtitle: 'Bán được thì khoe – Chưa được thì xin vía',
  ctaHint: 'Chạm để xin vía từ Thần Tài',
  signLines: ['Giải tỏa áp lực', 'Tiếp thêm động lực', 'Kết nối cộng đồng'],
  composeAvatarUrl: '/images/av-01.webp',
  composePlaceholder: 'Chia sẻ câu chuyện, thành tích, nỗi lòng của bạn...',
  feedFilters: [{ type: 'all', emoji: '' }, { type: 'story', emoji: '😂' }, { type: 'revenue', emoji: '💰' }, { type: 'wish', emoji: '🙏' }],
  streetGlbUrl: null,
  deityGlbUrl: '/3d/models/than_tai.glb',
  deityScale: 1.6,
  deityRegion: { x: 41, y: 28, w: 21, h: 51 },
  camera: { fov: 42, distance: 23, height: 8.5, minPolarDeg: 30, maxPolarDeg: 82, autoRotate: false, targetY: 2.2, targetZ: -3 },
  props: DEFAULT_HOME_PROPS,
  pedestrians: 12,
  sparkles: true,
};

/**
 * Phố mặc định khi database chưa có ô cửa hàng nào (server mới deploy, chưa nạp dữ liệu trang chủ): hai hàng nhà đối mặt đường, Thần Tài ở giữa.
 * Cùng bố cục với `seed-home` ở backend; nhà chỉ để xem (chưa gắn cửa hàng, `placeId = null`) và mất đi khi admin tạo ô thật.
 */
const NO_GLB = { high: null, lod1: null, lod2: null } as const;
const DEFAULT_STREET: readonly { n: number; label: string; modelKey: SceneModelKey; x: number; z: number; rotationDeg: number }[] = [
  { n: 1, label: 'Quán Cafe', modelKey: 'cafe', x: -11.5, z: 4, rotationDeg: 90 },
  { n: 2, label: 'Shop thời trang', modelKey: 'fashion', x: -11.5, z: -5, rotationDeg: 90 },
  { n: 3, label: 'Nhà hàng', modelKey: 'restaurant', x: -11.5, z: -14, rotationDeg: 90 },
  { n: 4, label: 'Văn phòng Sale', modelKey: 'sale_office', x: 11.5, z: 4, rotationDeg: -90 },
  { n: 5, label: 'Minimart', modelKey: 'minimart', x: 11.5, z: -5, rotationDeg: -90 },
  { n: 6, label: 'Nhà thuốc', modelKey: 'pharmacy', x: 11.5, z: -14, rotationDeg: -90 },
];
export const DEFAULT_STREET_SLOTS: StreetSlotDto[] = DEFAULT_STREET.map((s) => ({
  id: `00000000-0000-4000-8000-00000000010${s.n}`, label: s.label, placeId: null, modelKey: s.modelKey, glb: { ...NO_GLB }, modelScale: 1,
  region: { x: 0, y: 0, w: 0, h: 0 }, position: { x: s.x, z: s.z, rotationDeg: s.rotationDeg },
}));
