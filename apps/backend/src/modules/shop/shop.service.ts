import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DEFAULT_SHOP_CATALOG, ShopCatalogSchema, type ShopCatalog } from '@chot-via/shared';
import { DB, type Db } from '../../database/database';
import { appSettings } from '../../database/schema';

const KEY = 'shop';

/**
 * Nội dung trang Bảng giá và Vật phẩm do admin quản lý. Lưu thành một dòng JSON trong bảng `app_settings` (khóa `shop`),
 * không có bảng riêng; chưa lưu hoặc dữ liệu hỏng thì dùng nội dung mặc định theo tài liệu chiến lược.
 */
@Injectable()
export class ShopService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async get(): Promise<ShopCatalog> {
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.key, KEY)).limit(1);
    const parsed = ShopCatalogSchema.safeParse(row?.value);
    return parsed.success ? parsed.data : DEFAULT_SHOP_CATALOG;
  }

  /** Bản công khai: ẩn vật phẩm đã tắt. */
  async getPublic(): Promise<ShopCatalog> {
    const catalog = await this.get();
    return { ...catalog, items: catalog.items.filter((i) => i.active) };
  }

  async save(catalog: ShopCatalog): Promise<ShopCatalog> {
    await this.db.insert(appSettings).values({ key: KEY, value: catalog })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: catalog, updatedAt: new Date() } });
    return catalog;
  }
}
