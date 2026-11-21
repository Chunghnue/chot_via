import { and, count, eq } from 'drizzle-orm';
import { DEFAULT_SETTINGS, normalizeVnPhone, vnWeekStart, type AnimationKey, type IconKey, type MemberRole, type PlaceKind, type SceneModelKey, type TimeBucket } from '@chot-via/shared';
import { env } from '../config/env';
import { createDb } from './database';
import {
  appSettings, badges, challenges, homeActions, levels, missions, placeCategories, places, sceneTemplates, users, wishStickers, wishTemplates, wishTypes,
} from './schema';

const { db, close } = createDb();

/** Dữ liệu khởi tạo: danh mục, mẫu lời chúc, cửa hàng DEMO do admin tạo (không có doanh thu/giao dịch thật). */
// Đổi hai nút hành động cũ "Gửi vía" / "Nhận vía" ở trang chủ thành "Đốt vía" / "Thỉnh Thần Tài" (chỉ sửa dữ liệu, không đổi cấu trúc bảng; chạy lại nhiều lần vẫn an toàn,
// và không đụng tới nút nào admin đã tự đổi sang kiểu khác).
await db.update(homeActions).set({ label: 'Đốt vía', subLabel: 'Xua vía dữ, đón lộc', iconUrl: '/images/ic-fire.webp', kind: 'burn', href: null }).where(and(eq(homeActions.code, 'send_wish'), eq(homeActions.kind, 'link')));
await db.update(homeActions).set({ label: 'Thỉnh Thần Tài', subLabel: 'Thần Tài đến cửa hàng', kind: 'invoke', href: null }).where(and(eq(homeActions.code, 'get_wish'), eq(homeActions.kind, 'wish')));

const [existing] = await db.select({ n: count() }).from(wishTypes);
if ((existing?.n ?? 0) > 0) {
  console.log('Đã có dữ liệu khởi tạo, bỏ qua.');
  await close();
  process.exit(0);
}

await db.insert(appSettings).values({ key: 'app', value: DEFAULT_SETTINGS }).onConflictDoNothing();

const types: { code: string; name: string; icon: IconKey }[] = [
  { code: 'crowd', name: 'Đông khách', icon: 'fire' },
  { code: 'orders', name: 'Nhiều đơn', icon: 'chart' },
  { code: 'deal', name: 'Chốt deal', icon: 'handshake' },
  { code: 'kpi', name: 'Đạt KPI', icon: 'target' },
  { code: 'good_customer', name: 'Gặp khách hàng tốt', icon: 'heart' },
  { code: 'lucky', name: 'Buôn may bán đắt', icon: 'clover' },
];
const typeRows = await db.insert(wishTypes).values(types.map((t, i) => ({ code: t.code, name: t.name, iconKey: t.icon, sortOrder: i }))).returning();
const typeId = (code: string): string => typeRows.find((t) => t.code === code)?.id ?? '';

await db.insert(wishStickers).values([
  { code: 'gold', name: 'Thỏi vàng', iconKey: 'gold', sortOrder: 0 },
  { code: 'flower', name: 'Hoa may mắn', iconKey: 'flower', sortOrder: 1 },
  { code: 'clover', name: 'Cỏ bốn lá', iconKey: 'clover', sortOrder: 2 },
  { code: 'star', name: 'Ngôi sao', iconKey: 'star', sortOrder: 3 },
]);

const cats: { code: string; name: string; icon: IconKey; kind: PlaceKind }[] = [
  { code: 'cafe', name: 'Quán cafe', icon: 'coffee', kind: 'store' },
  { code: 'retail', name: 'Cửa hàng bán lẻ', icon: 'store', kind: 'store' },
  { code: 'fashion', name: 'Shop thời trang', icon: 'shirt', kind: 'store' },
  { code: 'minimart', name: 'Tạp hóa / Minimart', icon: 'cart', kind: 'store' },
  { code: 'restaurant', name: 'Nhà hàng', icon: 'fork', kind: 'store' },
  { code: 'other_store', name: 'Cửa hàng khác', icon: 'sparkles', kind: 'store' },
  { code: 'sale_office', name: 'Văn phòng sale', icon: 'briefcase', kind: 'sale_office' },
];
const catRows = await db.insert(placeCategories).values(cats.map((c, i) => ({ code: c.code, name: c.name, iconKey: c.icon, kind: c.kind, sortOrder: i }))).returning();
const catId = (code: string): string => catRows.find((c) => c.code === code)?.id ?? '';

const scenes: { name: string; kind: PlaceKind; model: SceneModelKey }[] = [
  { name: 'Quán cafe', kind: 'store', model: 'cafe' },
  { name: 'Shop thời trang', kind: 'store', model: 'fashion' },
  { name: 'Tạp hóa / Minimart', kind: 'store', model: 'minimart' },
  { name: 'Nhà hàng', kind: 'store', model: 'restaurant' },
  { name: 'Cửa hàng bán lẻ', kind: 'store', model: 'retail' },
  { name: 'Cửa hàng tổng hợp', kind: 'store', model: 'generic' },
  { name: 'Văn phòng sale', kind: 'sale_office', model: 'sale_office' },
];
const sceneRows = await db.insert(sceneTemplates).values(scenes.map((s) => ({ name: s.name, kind: s.kind, modelKey: s.model }))).returning();
const sceneId = (model: SceneModelKey): string => sceneRows.find((s) => s.modelKey === model)?.id ?? '';

type Tpl = { source: 'deity' | 'auto_reply' | 'system_thanks' | 'offline'; text: string; anim: AnimationKey; bucket?: TimeBucket; type?: string; role?: MemberRole };
const tpls: Tpl[] = [
  { source: 'deity', text: 'Thần Tài đã cho vía! Chúc bạn hôm nay đông khách, nổ đơn, chốt deal!', anim: 'coins' },
  { source: 'deity', text: 'Chúc bạn công việc hanh thông, thu nhập tăng!', anim: 'sparkle' },
  { source: 'deity', text: 'Vía lành đã về! Chúc bạn buôn may bán đắt, khách tới tấp.', anim: 'glow' },
  { source: 'deity', bucket: 'morning', text: 'Chúc bạn buổi sáng nhiều năng lượng, khách vào liên tục, đơn về đều đều!', anim: 'coins' },
  { source: 'deity', bucket: 'morning', text: 'Sáng nay Thần Tài trao vía: mở hàng thuận lợi, khách đến sớm, chốt đơn vui vẻ!', anim: 'sparkle' },
  { source: 'deity', bucket: 'afternoon', text: 'Chúc bạn buổi chiều bán hàng thuận lợi, đơn về nườm nượp, khách gật đầu liên tục!', anim: 'coins' },
  { source: 'deity', bucket: 'afternoon', text: 'Chiều nay vía tốt đã tới: giữ vững tinh thần, chốt thêm vài deal nữa nhé!', anim: 'glow' },
  { source: 'deity', bucket: 'evening', text: 'Chúc bạn buổi tối đông khách, chốt đơn trọn vẹn, kết ngày thật đẹp!', anim: 'fireworks' },
  { source: 'deity', bucket: 'evening', text: 'Tối nay Thần Tài tiếp thêm năng lượng: cuối ngày vẫn có đơn, khách vẫn gật đầu!', anim: 'sparkle' },
  { source: 'auto_reply', type: 'crowd', text: 'Chúc bạn hôm nay đông khách, đơn về liên tục nhé!', anim: 'sparkle' },
  { source: 'auto_reply', type: 'orders', text: 'Chúc bạn nhiều đơn, đơn nào cũng chốt trọn vẹn!', anim: 'sparkle' },
  { source: 'auto_reply', type: 'deal', text: 'Chúc bạn chốt deal lớn, khách gật đầu nhanh!', anim: 'sparkle' },
  { source: 'auto_reply', type: 'kpi', text: 'Chúc bạn bứt tốc KPI, về đích thật đẹp!', anim: 'sparkle' },
  { source: 'auto_reply', type: 'good_customer', text: 'Chúc bạn gặp nhiều khách hàng tốt, hợp tác lâu dài!', anim: 'sparkle' },
  { source: 'auto_reply', type: 'lucky', text: 'Chúc bạn buôn may bán đắt, vía lành đầy nhà!', anim: 'sparkle' },
  { source: 'system_thanks', text: 'Cảm ơn bạn đã gửi vía! Lời chúc của bạn đã được ghi nhận.', anim: 'sparkle' },
  { source: 'system_thanks', text: 'Hệ thống xin cảm ơn tấm lòng của bạn. Chúc bạn một ngày nhiều may mắn!', anim: 'glow' },
  { source: 'offline', text: 'Thần Tài chúc bạn một ngày thật nhiều năng lượng và may mắn!', anim: 'sparkle' },
  { source: 'offline', text: 'Chúc bạn buôn may bán đắt, khách vào không ngớt!', anim: 'sparkle' },
  { source: 'offline', text: 'Vía lành đã về, chúc bạn chốt đơn vui vẻ!', anim: 'sparkle' },
];
await db.insert(wishTemplates).values(tpls.map((t) => ({
  source: t.source, text: t.text, animationKey: t.anim, timeBucket: t.bucket ?? null, wishTypeId: t.type ? typeId(t.type) : null, roleTarget: t.role ?? null,
})));

const demo: { title: string; tagline: string; cat: string; model: SceneModelKey; kind: PlaceKind; slug: string }[] = [
  { title: 'Quán Cafe An Nhiên', tagline: 'Cafe nhỏ, khách thân quen', cat: 'cafe', model: 'cafe', kind: 'store', slug: 'quan-cafe-an-nhien' },
  { title: 'Shop Thời Trang Tâm An', tagline: 'Thời trang gọn nhẹ mỗi ngày', cat: 'fashion', model: 'fashion', kind: 'store', slug: 'shop-thoi-trang-tam-an' },
  { title: 'Minimart Hồng Phát', tagline: 'Tạp hóa tiện lợi đầu phố', cat: 'minimart', model: 'minimart', kind: 'store', slug: 'minimart-hong-phat' },
  { title: 'Nhà hàng Phố Việt', tagline: 'Món Việt cho cả nhà', cat: 'restaurant', model: 'restaurant', kind: 'store', slug: 'nha-hang-pho-viet' },
  { title: 'Văn phòng Sale Chốt Đơn', tagline: 'Team sale chốt deal mỗi ngày', cat: 'sale_office', model: 'sale_office', kind: 'sale_office', slug: 'van-phong-sale-chot-don' },
  { title: 'Văn phòng Sale Bứt Phá', tagline: 'Cùng nhau chạy KPI', cat: 'sale_office', model: 'sale_office', kind: 'sale_office', slug: 'van-phong-sale-but-pha' },
];
await db.insert(places).values(demo.map((p, i) => ({
  slug: p.slug, kind: p.kind, title: p.title, tagline: p.tagline, categoryId: catId(p.cat), sceneTemplateId: sceneId(p.model),
  isDemo: true, autoReplyEnabled: true, sortOrder: i,
})));

await db.insert(missions).values([
  { code: 'deity_3', name: 'Xin vía Thần Tài 3 lần', description: '', period: 'daily', action: 'deity_wish', target: 3, sortOrder: 0 },
  { code: 'visit_2', name: 'Ghé thăm 2 cửa hàng 3D', description: '', period: 'daily', action: 'visit_place', target: 2, sortOrder: 1 },
  { code: 'send_5', name: 'Gửi vía cho 5 cửa hàng/sale', description: '', period: 'daily', action: 'place_wish', target: 5, sortOrder: 2 },
  { code: 'post_1', name: 'Đăng 1 bài chia sẻ', description: '', period: 'daily', action: 'publish_post', target: 1, sortOrder: 3 },
]);
const weekStart = vnWeekStart(new Date());
await db.insert(challenges).values({
  name: 'Thử thách tuần: gửi vía cho 10 cửa hàng/sale', description: 'Gửi vía thật nhiều để lan tỏa năng lượng tích cực.',
  action: 'place_wish', target: 10, scope: 'personal', startsAt: weekStart, endsAt: new Date(weekStart.getTime() + 30 * 86_400_000),
});

/** Cấp độ và huy hiệu do chủ dự án bàn giao (docs: bàn giao 19/11/2026); admin chỉnh lại được trong web admin. Điểm vía chỉ đến từ xin vía/gửi vía của thành viên. */
await db.insert(levels).values([
  { level: 1, name: 'Tân binh', minPoints: 1 }, { level: 2, name: 'Ghé phố', minPoints: 5 }, { level: 3, name: 'Bạn của phố', minPoints: 15 },
  { level: 4, name: 'Gương mặt quen', minPoints: 35 }, { level: 5, name: 'Kết nối cộng đồng', minPoints: 70 }, { level: 6, name: 'Lan tỏa may mắn', minPoints: 120 },
  { level: 7, name: 'Đại sứ Chốt Vía', minPoints: 200 },
]).onConflictDoNothing();
await db.insert(badges).values([
  { code: 'via_dau_tien', name: 'Vía đầu tiên', description: 'Đạt 1 điểm vía.', iconKey: 'clover', conditionType: 'total_points', threshold: 1 },
  { code: 'via_25', name: 'Tích vía', description: 'Đạt 25 điểm vía.', iconKey: 'gold', conditionType: 'total_points', threshold: 25 },
  { code: 'via_100', name: 'Sao Chốt Vía', description: 'Đạt 100 điểm vía.', iconKey: 'star', conditionType: 'total_points', threshold: 100 },
  { code: 'via_200', name: 'Đại sứ may mắn', description: 'Đạt 200 điểm vía.', iconKey: 'crown', conditionType: 'total_points', threshold: 200 },
  { code: 'xin_via_10', name: 'Ghé Thần Tài', description: 'Xin vía Thần Tài 10 lần.', iconKey: 'sun', conditionType: 'deity_wishes', threshold: 10 },
  { code: 'xin_via_30', name: 'Thân quen Thần Tài', description: 'Xin vía Thần Tài 30 lần.', iconKey: 'sparkles', conditionType: 'deity_wishes', threshold: 30 },
  { code: 'gui_via_5', name: 'Gửi lời may mắn', description: 'Gửi vía cho cửa hàng hoặc sale 5 lần.', iconKey: 'heart', conditionType: 'place_wishes', threshold: 5 },
  { code: 'gui_via_20', name: 'Kết nối khu phố', description: 'Gửi vía cho cửa hàng hoặc sale 20 lần.', iconKey: 'handshake', conditionType: 'place_wishes', threshold: 20 },
  { code: 'gui_via_50', name: 'Lan tỏa vía tốt', description: 'Gửi vía cho cửa hàng hoặc sale 50 lần.', iconKey: 'trophy', conditionType: 'place_wishes', threshold: 50 },
]).onConflictDoNothing();

const adminPhone = normalizeVnPhone(env.SEED_ADMIN_PHONE);
if (adminPhone) await db.insert(users).values({ phone: adminPhone, displayName: env.SEED_ADMIN_NAME, accountRole: 'admin' }).onConflictDoNothing();

console.log(`Đã khởi tạo dữ liệu. Tài khoản quản trị: ${adminPhone ?? '(không có)'}${env.SMS_PROVIDER === 'dev' ? ` (OTP dev: ${env.DEV_FIXED_OTP})` : ''}`);
await close();
