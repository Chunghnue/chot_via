import { count, eq } from 'drizzle-orm';
import type { HomeActionKind, SceneModelKey } from '@chot-via/shared';
import { createDb } from './database';
import { appSettings, homeActions, homeFooterLinks, placeCategories, places, sceneTemplates, streetSlots } from './schema';

const { db, close } = createDb();

/** Dữ liệu trang chủ theo thiết kế: file 3D (GLB v2, 3 mức chi tiết), hàng nút hành động, chân trang, các ô cửa hàng trên phố. Chạy lại nhiều lần vẫn an toàn. */
const SEED_VERSION = 2;
const [versionRow] = await db.select().from(appSettings).where(eq(appSettings.key, 'home_seed_version')).limit(1);
const storedVersion = typeof versionRow?.value === 'object' && versionRow.value !== null && 'v' in versionRow.value && typeof versionRow.value.v === 'number' ? versionRow.value.v : 0;

const GLB: Partial<Record<SceneModelKey, string>> = { cafe: 'cafe', fashion: 'fashion', minimart: 'minimart', restaurant: 'restaurant', pharmacy: 'pharmacy', sale_office: 'sale' };
const SHOP_SCALE = 1.5;

// Mẫu 3D "Nhà thuốc" (có trong gói GLB nhưng chưa có ở dữ liệu cũ) và một cửa hàng mẫu dùng mẫu này.
let [pharmacyScene] = await db.select().from(sceneTemplates).where(eq(sceneTemplates.modelKey, 'pharmacy')).limit(1);
if (!pharmacyScene) [pharmacyScene] = await db.insert(sceneTemplates).values({ name: 'Nhà thuốc', kind: 'store', modelKey: 'pharmacy' }).returning();
let [pharmacyCat] = await db.select().from(placeCategories).where(eq(placeCategories.code, 'pharmacy')).limit(1);
if (!pharmacyCat) {
  const [max] = await db.select({ n: count() }).from(placeCategories);
  [pharmacyCat] = await db.insert(placeCategories).values({ code: 'pharmacy', name: 'Nhà thuốc', iconKey: 'spa', kind: 'store', sortOrder: max?.n ?? 0 }).returning();
}
if (pharmacyScene && pharmacyCat) {
  const [existing] = await db.select({ id: places.id }).from(places).where(eq(places.slug, 'nha-thuoc-binh-an')).limit(1);
  if (!existing) {
    const [sortMax] = await db.select({ n: count() }).from(places);
    await db.insert(places).values({ slug: 'nha-thuoc-binh-an', kind: 'store', title: 'Nhà thuốc Bình An', tagline: 'Chăm sóc sức khỏe mỗi ngày', categoryId: pharmacyCat.id, sceneTemplateId: pharmacyScene.id, isDemo: true, autoReplyEnabled: true, sortOrder: sortMax?.n ?? 6 });
  }
}

for (const [model, file] of Object.entries(GLB)) {
  const base = `/3d/models/${file}`;
  const set = { glbUrl: `${base}.glb`, glbLod1Url: `${base}_lod1.glb`, glbLod2Url: `${base}_lod2.glb`, ...(storedVersion < SEED_VERSION ? { modelScale: SHOP_SCALE } : {}) };
  await db.update(sceneTemplates).set(set).where(eq(sceneTemplates.modelKey, model as SceneModelKey));
}

const [hasActions] = await db.select({ n: count() }).from(homeActions);
if ((hasActions?.n ?? 0) === 0) {
  const a = (code: string, label: string, subLabel: string, icon: string, kind: HomeActionKind, href: string | null, tablet = true, sortOrder = 0) =>
    ({ code, label, subLabel, iconUrl: `/images/${icon}.webp`, kind, href, showMobile: true, showTablet: tablet, showDesktop: true, sortOrder });
  await db.insert(homeActions).values([
    a('story', 'Kể khổ', 'Giải tỏa áp lực', 'ic-laugh', 'story', null, true, 0),
    a('brag', 'Khoe doanh thu / Deal', 'Chia sẻ thành công', 'ic-money-bag', 'brag', null, true, 1),
    a('send_wish', 'Gửi vía', 'Ghé cửa hàng', 'ic-home', 'link', '/pho-3d', true, 2),
    a('get_wish', 'Nhận vía', 'Xin vía Thần Tài', 'ic-pray', 'wish', null, true, 3),
    a('challenge', 'Thử thách', 'Nhận quà hấp dẫn', 'ic-trophy', 'link', '/su-kien', true, 4),
    a('create_store', 'Tạo cửa hàng 3D', 'Cửa hàng của bạn', 'ic-gift', 'link', '/tao-diem', false, 5),
  ]);
}

const [hasLinks] = await db.select({ n: count() }).from(homeFooterLinks);
if ((hasLinks?.n ?? 0) === 0) {
  const l = (groupName: string, label: string, href: string, sortOrder: number) => ({ groupName, label, href, sortOrder });
  await db.insert(homeFooterLinks).values([
    l('Khám phá', 'Phố 3D', '/pho-3d', 0), l('Khám phá', 'Bảng tin', '/bang-tin', 1), l('Khám phá', 'Bảng xếp hạng', '/bang-xep-hang', 2), l('Khám phá', 'Sự kiện', '/su-kien', 3),
    l('Cộng đồng', 'Tạo cửa hàng 3D', '/tao-diem', 0), l('Cộng đồng', 'Cài đặt', '/cai-dat', 1),
  ]);
}

// Bố cục phố: hai hàng cửa hàng đối mặt đường, Thần Tài ở giữa (gốc toạ độ). Vùng bấm theo % khung ảnh pho-3d-hero.png (0 = không có trên ảnh).
// Cafe và Văn phòng Sale ở gần (z=4), thời trang và Minimart ở giữa, Nhà hàng và Nhà thuốc ở xa. Hàng trái xoay +90°, hàng phải -90° để mặt tiền hướng ra đường.
const SLOTS: { label: string; model: SceneModelKey; img: [number, number, number, number]; x: number; z: number; rot: number }[] = [
  { label: 'Quán Cafe', model: 'cafe', img: [1, 17, 27, 58], x: -11.5, z: 4, rot: 90 },
  { label: 'Shop thời trang', model: 'fashion', img: [22.5, 26, 16, 42], x: -11.5, z: -5, rot: 90 },
  { label: 'Nhà hàng', model: 'restaurant', img: [0, 0, 0, 0], x: -11.5, z: -14, rot: 90 },
  { label: 'Văn phòng Sale', model: 'sale_office', img: [81, 25, 19, 47], x: 11.5, z: 4, rot: -90 },
  { label: 'Minimart', model: 'minimart', img: [68.5, 19, 14, 43], x: 11.5, z: -5, rot: -90 },
  { label: 'Nhà thuốc', model: 'pharmacy', img: [0, 0, 0, 0], x: 11.5, z: -14, rot: -90 },
];
const scenes = await db.select().from(sceneTemplates);
const placeRows = await db.select({ id: places.id, sceneTemplateId: places.sceneTemplateId }).from(places).orderBy(places.sortOrder, places.createdAt);
const existingSlots = await db.select().from(streetSlots);
for (const [i, s] of SLOTS.entries()) {
  const scene = scenes.find((x) => x.modelKey === s.model);
  if (!scene) continue;
  const values = { label: s.label, placeId: placeRows.find((p) => p.sceneTemplateId === scene.id)?.id ?? null, sceneTemplateId: scene.id, imageX: s.img[0], imageY: s.img[1], imageW: s.img[2], imageH: s.img[3], posX: s.x, posZ: s.z, rotationDeg: s.rot, sortOrder: i };
  const found = existingSlots.find((x) => x.label === s.label);
  if (!found) await db.insert(streetSlots).values(values);
  else if (storedVersion < SEED_VERSION) await db.update(streetSlots).set({ posX: s.x, posZ: s.z, rotationDeg: s.rot, sortOrder: i }).where(eq(streetSlots.id, found.id));
}

await db.insert(appSettings).values({ key: 'home_seed_version', value: { v: SEED_VERSION } }).onConflictDoUpdate({ target: appSettings.key, set: { value: { v: SEED_VERSION }, updatedAt: new Date() } });
console.log('Đã nạp dữ liệu trang chủ.');
await close();
