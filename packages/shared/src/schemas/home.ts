import { z } from 'zod';
import { HOME_ACTION_KINDS, SCENE_MODEL_KEYS } from '../enums';
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
  showMobile: z.boolean(), showTablet: z.boolean(), showDesktop: z.boolean(), sortOrder: z.number().int(), active: z.boolean(),
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

export const HomeActionDtoSchema = HomeActionInputSchema.pick({ code: true, label: true, subLabel: true, iconUrl: true, kind: true, href: true, showMobile: true, showTablet: true, showDesktop: true });
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
  ...[8, -2, -12, -22].flatMap((z, i) => [-1, 1].map((side) => ({ glbUrl: `${M}${(i + (side > 0 ? 1 : 0)) % 2 === 0 ? 'tree_green' : 'tree_blossom'}.glb`, x: side * 17, z, rotationDeg: 0, scale: 1.7 }))),
  ...[11, 1, -9, -19].flatMap((z) => [-1, 1].map((side) => ({ glbUrl: `${M}street_lamp.glb`, x: side * 5.8, z, rotationDeg: 0, scale: 1.3 }))),
  { glbUrl: `${M}bench.glb`, x: -7.4, z: -0.5, rotationDeg: 90, scale: 1.3 }, { glbUrl: `${M}bench.glb`, x: 7.4, z: -0.5, rotationDeg: -90, scale: 1.3 },
  { glbUrl: `${M}gift.glb`, x: -3, z: 5, rotationDeg: 20, scale: 1.5 }, { glbUrl: `${M}gift.glb`, x: 3.2, z: 5.2, rotationDeg: -30, scale: 1.3 },
  { glbUrl: `${M}fountain.glb`, x: 0, z: -26, rotationDeg: 0, scale: 2.4 },
];

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  heroImageUrl: '/images/pho-3d-hero.png',
  heroTitle: 'Phố Chốt Vía 3D',
  heroSubtitle: 'Ghé phố – Gửi vía – Nhận vía',
  ctaHint: 'Chạm để xin vía từ Thần Tài',
  signLines: ['Chúc may mắn', 'Chốt đơn thần tốc', 'Doanh thu bùng nổ'],
  streetGlbUrl: null,
  deityGlbUrl: '/3d/models/than_tai.glb',
  deityScale: 1.6,
  deityRegion: { x: 41, y: 28, w: 21, h: 51 },
  camera: { fov: 42, distance: 23, height: 8.5, minPolarDeg: 30, maxPolarDeg: 82, autoRotate: false, targetY: 2.2, targetZ: -3 },
  props: DEFAULT_HOME_PROPS,
  pedestrians: 12,
  sparkles: true,
};
