import { eq } from 'drizzle-orm';
import { createDb } from './database';
import { appSettings, challenges, missions, places } from './schema';

const { db, close } = createDb();

/**
 * Đưa database về mức "bản mới deploy": chỉ giữ cấu hình hệ thống (tài khoản admin, loại vía, danh mục, mẫu cảnh, mẫu lời chúc, cấp độ, huy hiệu, nút trang chủ)
 * và bỏ cửa hàng mẫu, nhiệm vụ, thử thách (giữ các ô nhà trên phố). Chạy sau `seed` và `seed-home`. Chỉ làm MỘT lần (đánh dấu bằng khóa `baseline_applied`) để các lần deploy sau
 * không xóa cửa hàng, nhiệm vụ, thử thách mà admin đã tạo.
 */
const [applied] = await db.select().from(appSettings).where(eq(appSettings.key, 'baseline_applied')).limit(1);
if (applied) {
  console.log('Bản trắng đã áp dụng trước đó, bỏ qua.');
  await close();
  process.exit(0);
}
// Các ô cửa hàng trên phố là bố cục trang chủ nên GIỮ NGUYÊN; xóa cửa hàng mẫu chỉ làm ô đó mất liên kết (place_id = null, ON DELETE SET NULL), nhà vẫn hiện trên phố.
await db.delete(places).where(eq(places.isDemo, true));
await db.delete(challenges);
await db.delete(missions);
await db.insert(appSettings).values({ key: 'baseline_applied', value: { v: 1 } });
console.log('Đã đưa dữ liệu về bản trắng (chỉ còn cấu hình hệ thống).');
await close();
