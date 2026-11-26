import { count, eq, sql } from 'drizzle-orm';
import type { HomeActionKind, SceneModelKey } from '@chot-via/shared';
import { createDb } from './database';
import { appSettings, homeActions, homeFooterLinks, placeCategories, places, sceneTemplates, streetSlots } from './schema';

const { db, close } = createDb();

/** Đổi tên thương hiệu Chốt Vía → Xin Vía trong dữ liệu đã có (bài mẫu, tên tài khoản mẫu, sự kiện, lời chúc…). Chạy mỗi lần deploy, chạy lại không đổi gì thêm. */
const textColumns = await db.execute(sql`select table_name, column_name from information_schema.columns
  where table_schema = 'public' and data_type in ('text', 'character varying')
    and table_name not in ('refresh_tokens', 'auth_identities', 'otp_codes', 'otp_locks', 'audit_logs', 'point_ledger', 'guest_sessions', 'app_settings')`);
for (const row of textColumns as unknown as { table_name: string; column_name: string }[]) {
  const t = sql.identifier(row.table_name);
  const c = sql.identifier(row.column_name);
  await db.execute(sql`update ${t} set ${c} = replace(replace(replace(${c}, 'Chốt Vía', 'Xin Vía'), 'Chốt vía', 'Xin Vía'), 'CHỐT VÍA', 'XIN VÍA') where ${c} like '%Chốt V%a%' or ${c} like '%CHỐT VÍA%'`);
}

/** Dữ liệu trang chủ theo thiết kế: file 3D (GLB v2, 3 mức chi tiết), hàng nút hành động, chân trang, các ô cửa hàng trên phố. Chạy lại nhiều lần vẫn an toàn. */
const SEED_VERSION = 5;
/** Bản đặt lại tỉ lệ model và vị trí ô cửa hàng (v2); bản 3 chỉ thêm hàng nút theo 3 ảnh mới nên không đụng bố cục phố đã chỉnh. */
const LAYOUT_VERSION = 2;
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
  const set = { glbUrl: `${base}.glb`, glbLod1Url: `${base}_lod1.glb`, glbLod2Url: `${base}_lod2.glb`, ...(storedVersion < LAYOUT_VERSION ? { modelScale: SHOP_SCALE } : {}) };
  await db.update(sceneTemplates).set(set).where(eq(sceneTemplates.modelKey, model as SceneModelKey));
}

// Hàng nút ở trang chủ (mọi cỡ màn giống nhau): Kể khổ → Đốt vía → Thỉnh Thần Tài → Khoe doanh thu / Deal. Ghé phố 3D, Thử thách, Tạo cửa hàng 3D không còn ở hàng này (vẫn có ở menu).
// Chỉ ghi đè khi chưa có hoặc bản seed cũ (< 5); sau đó admin sửa thoải mái ở "Nút hành động trang chủ".
const ACTIONS: { code: string; label: string; subLabel: string; icon: string; kind: HomeActionKind; href: string | null; active: boolean; order: number }[] = [
  { code: 'story', label: 'Kể khổ', subLabel: 'Giải tỏa áp lực', icon: 'ic-laugh', kind: 'story', href: null, active: true, order: 0 },
  { code: 'send_wish', label: 'Đốt vía', subLabel: 'Xua vía dữ, đón lộc', icon: 'ic-fire', kind: 'burn', href: null, active: true, order: 1 },
  { code: 'get_wish', label: 'Thỉnh Thần Tài', subLabel: 'Thần Tài đến cửa hàng', icon: 'ic-pray', kind: 'invoke', href: null, active: true, order: 2 },
  { code: 'brag', label: 'Khoe doanh thu / Deal', subLabel: 'Chia sẻ thành công', icon: 'ic-money-bag', kind: 'brag', href: null, active: true, order: 3 },
  { code: 'visit_street', label: 'Ghé phố 3D', subLabel: 'Khám phá cửa hàng', icon: 'ic-home', kind: 'link', href: '/pho-3d', active: false, order: 4 },
  { code: 'challenge', label: 'Thử thách', subLabel: 'Nhận quà hấp dẫn', icon: 'ic-trophy', kind: 'link', href: '/su-kien', active: false, order: 5 },
  { code: 'create_store', label: 'Tạo cửa hàng 3D', subLabel: 'Cửa hàng của riêng bạn', icon: 'ic-home', kind: 'link', href: '/tao-diem', active: false, order: 6 },
];
if (storedVersion < SEED_VERSION) {
  for (const x of ACTIONS) {
    const v = { label: x.label, subLabel: x.subLabel, iconUrl: `/images/${x.icon}.webp`, kind: x.kind, href: x.href, showMobile: true, showTablet: true, showDesktop: true, active: x.active, sortOrder: x.order, sortTablet: x.order, sortDesktop: x.order };
    const [found] = await db.select({ id: homeActions.id }).from(homeActions).where(eq(homeActions.code, x.code)).limit(1);
    if (found) await db.update(homeActions).set(v).where(eq(homeActions.id, found.id));
    else await db.insert(homeActions).values({ code: x.code, ...v });
  }
}

const [hasLinks] = await db.select({ n: count() }).from(homeFooterLinks);
if ((hasLinks?.n ?? 0) === 0) {
  const l = (groupName: string, label: string, href: string, sortOrder: number) => ({ groupName, label, href, sortOrder });
  await db.insert(homeFooterLinks).values([
    l('Khám phá', 'Phố 3D', '/pho-3d', 0), l('Khám phá', 'Bảng tin', '/bang-tin', 1), l('Khám phá', 'Bảng xếp hạng', '/bang-xep-hang', 2), l('Khám phá', 'Sự kiện', '/su-kien', 3),
    l('Cộng đồng', 'Tạo cửa hàng 3D', '/tao-diem', 0), l('Cộng đồng', 'Cài đặt', '/cai-dat', 1),
  ]);
}

// Hai trang theo tài liệu chiến lược (bảng giá, vật phẩm 3D): thêm vào chân trang nếu chưa có (kiểm theo đường dẫn nên chạy lặp không nhân đôi, và không đè chỉnh sửa của admin).
for (const [label, href, order] of [['Bảng giá', '/bang-gia', 4], ['Vật phẩm 3D', '/vat-pham', 5]] as const) {
  const [has] = await db.select({ n: count() }).from(homeFooterLinks).where(eq(homeFooterLinks.href, href));
  if ((has?.n ?? 0) === 0) await db.insert(homeFooterLinks).values({ groupName: 'Khám phá', label, href, sortOrder: order });
}

// Mạng xã hội: liên kết mẫu '#' (bấm không phản ứng). Admin thay bằng địa chỉ thật ở menu "Liên kết chân trang"; chỉ thêm khi nhóm này chưa có.
const [hasSocial] = await db.select({ n: count() }).from(homeFooterLinks).where(eq(homeFooterLinks.groupName, 'Mạng xã hội'));
if ((hasSocial?.n ?? 0) === 0) {
  await db.insert(homeFooterLinks).values([
    { groupName: 'Mạng xã hội', label: 'Facebook', href: '#', sortOrder: 0 },
    { groupName: 'Mạng xã hội', label: 'Zalo', href: '#', sortOrder: 1 },
    { groupName: 'Mạng xã hội', label: 'TikTok', href: '#', sortOrder: 2 },
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
  else if (storedVersion < LAYOUT_VERSION) await db.update(streetSlots).set({ posX: s.x, posZ: s.z, rotationDeg: s.rot, sortOrder: i }).where(eq(streetSlots.id, found.id));
}

await db.insert(appSettings).values({ key: 'home_seed_version', value: { v: SEED_VERSION } }).onConflictDoUpdate({ target: appSettings.key, set: { value: { v: SEED_VERSION }, updatedAt: new Date() } });
console.log('Đã nạp dữ liệu trang chủ.');
await close();
