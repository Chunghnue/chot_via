import { count, eq } from 'drizzle-orm';
import { vnWeekStart, type PlaceKind, type SceneModelKey } from '@xin-via/shared';
import { createDb } from './database';
import { challenges, missions, placeCategories, places, sceneTemplates } from './schema';

/**
 * Nạp BỘ DỮ LIỆU MẪU ĐẦY ĐỦ theo thiết kế (chạy tay khi cần, không nằm trong chuỗi deploy tự động): cửa hàng/văn phòng mẫu, nhiệm vụ, thử thách tuần,
 * rồi tài khoản mẫu, bài Kể khổ / Khoe, chủ đề hot, sự kiện, số vía trong tuần (`seed-demo-content`). Chạy lặp được, không nhân đôi. Dữ liệu mẫu có cờ `is_demo`
 * và ẩn/hiện bằng công tắc "Hiện dữ liệu mẫu" trong cài đặt admin.
 */
const { db, close } = createDb();

const demoPlaces: { title: string; tagline: string; cat: string; model: SceneModelKey; kind: PlaceKind; slug: string }[] = [
  { title: 'Quán Cafe An Nhiên', tagline: 'Cafe nhỏ, khách thân quen', cat: 'cafe', model: 'cafe', kind: 'store', slug: 'quan-cafe-an-nhien' },
  { title: 'Shop Thời Trang Tâm An', tagline: 'Thời trang gọn nhẹ mỗi ngày', cat: 'fashion', model: 'fashion', kind: 'store', slug: 'shop-thoi-trang-tam-an' },
  { title: 'Minimart Hồng Phát', tagline: 'Tạp hóa tiện lợi đầu phố', cat: 'minimart', model: 'minimart', kind: 'store', slug: 'minimart-hong-phat' },
  { title: 'Nhà hàng Phố Việt', tagline: 'Món Việt cho cả nhà', cat: 'restaurant', model: 'restaurant', kind: 'store', slug: 'nha-hang-pho-viet' },
  { title: 'Văn phòng Sale Chốt Đơn', tagline: 'Team sale chốt deal mỗi ngày', cat: 'sale_office', model: 'sale_office', kind: 'sale_office', slug: 'van-phong-sale-chot-don' },
  { title: 'Văn phòng Sale Bứt Phá', tagline: 'Cùng nhau chạy KPI', cat: 'sale_office', model: 'sale_office', kind: 'sale_office', slug: 'van-phong-sale-but-pha' },
];
const [scenes, cats, [placeTotal]] = await Promise.all([db.select().from(sceneTemplates), db.select().from(placeCategories), db.select({ n: count() }).from(places)]);
let sort = placeTotal?.n ?? 0;
for (const p of demoPlaces) {
  const [found] = await db.select({ id: places.id }).from(places).where(eq(places.slug, p.slug)).limit(1);
  if (found) continue;
  const scene = scenes.find((s) => s.modelKey === p.model);
  const cat = cats.find((c) => c.code === p.cat);
  if (!scene || !cat) continue;
  await db
    .insert(places)
    .values({
      slug: p.slug,
      kind: p.kind,
      title: p.title,
      tagline: p.tagline,
      categoryId: cat.id,
      sceneTemplateId: scene.id,
      isDemo: true,
      autoReplyEnabled: true,
      sortOrder: sort,
    });
  sort += 1;
}

const missionDefs = [
  { code: 'deity_3', name: 'Xin vía Thần Tài 3 lần', action: 'deity_wish', target: 3, sortOrder: 0 },
  { code: 'visit_2', name: 'Ghé thăm 2 cửa hàng 3D', action: 'visit_place', target: 2, sortOrder: 1 },
  { code: 'send_5', name: 'Gửi vía cho 5 cửa hàng/sale', action: 'place_wish', target: 5, sortOrder: 2 },
  { code: 'post_1', name: 'Đăng 1 bài chia sẻ', action: 'publish_post', target: 1, sortOrder: 3 },
] as const;
for (const m of missionDefs) {
  const [found] = await db.select({ id: missions.id }).from(missions).where(eq(missions.code, m.code)).limit(1);
  if (!found) await db.insert(missions).values({ ...m, description: '', period: 'daily' });
}
const [anyChallenge] = await db.select({ n: count() }).from(challenges);
if ((anyChallenge?.n ?? 0) === 0) {
  const weekStart = vnWeekStart(new Date());
  await db.insert(challenges).values({
    name: 'Thử thách tuần: gửi vía cho 10 cửa hàng/sale', description: 'Gửi vía thật nhiều để lan tỏa năng lượng tích cực.',
    action: 'place_wish', target: 10, scope: 'personal', startsAt: weekStart, endsAt: new Date(weekStart.getTime() + 30 * 86_400_000),
  });
}
await close();
console.log('Đã nạp cửa hàng, nhiệm vụ, thử thách mẫu.');
await import('./seed-demo-content');
