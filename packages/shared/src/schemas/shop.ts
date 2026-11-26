import { z } from 'zod';

/** Ảnh vật phẩm có sẵn trong `apps/web-public/public/images/` (admin chọn một trong các ảnh này). */
export const SHOP_ITEM_IMAGES = ['vp-cay', 'vp-hoa-dao', 'vp-than-tai', 'vp-cong', 'vp-van-phong', 'vp-dai-phun', 'vp-den-long'] as const;
export type ShopItemImage = (typeof SHOP_ITEM_IMAGES)[number];

const Id = z.string().trim().min(1).max(40);
const Text = (max: number) => z.string().trim().min(1).max(max);

/** Gói thành viên (Free, Plus, Business…): tên và giá hiển thị tự do ("29k/tháng"). */
export const ShopPlanSchema = z.object({ id: Id, name: Text(40), price: Text(40) });
/** Một dòng quyền lợi; `planIds` là các gói có quyền lợi này. */
export const ShopFeatureSchema = z.object({ id: Id, label: Text(120), planIds: z.array(Id).max(6) });
/** Nguồn thu tham khảo: tên, giá tham khảo, mức ưu tiên (P0/P1/P2). */
export const ShopRevenueSchema = z.object({ id: Id, name: Text(60), price: Text(60), priority: Text(10) });
/** Vật phẩm 3D bán trong cửa hàng; `active` = false thì ẩn khỏi trang công khai. */
export const ShopItemSchema = z.object({ id: Id, name: Text(60), price: Text(40), image: z.enum(SHOP_ITEM_IMAGES), active: z.boolean() });

/** Nội dung trang Bảng giá và Vật phẩm do admin quản lý (lưu trong cài đặt, không có bảng riêng). */
export const ShopCatalogSchema = z.object({
  plans: z.array(ShopPlanSchema).min(1).max(6),
  features: z.array(ShopFeatureSchema).max(20),
  revenue: z.array(ShopRevenueSchema).max(12),
  items: z.array(ShopItemSchema).max(40),
}).superRefine((v, ctx) => {
  const planIds = new Set(v.plans.map((p) => p.id));
  if (planIds.size !== v.plans.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['plans'], message: 'invalid_string' });
  v.features.forEach((f, i) => {
    if (f.planIds.some((id) => !planIds.has(id))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['features', i, 'planIds'], message: 'invalid_string' });
  });
});
export type ShopCatalog = z.infer<typeof ShopCatalogSchema>;
export type ShopPlan = z.infer<typeof ShopPlanSchema>;
export type ShopFeature = z.infer<typeof ShopFeatureSchema>;
export type ShopRevenue = z.infer<typeof ShopRevenueSchema>;
export type ShopItem = z.infer<typeof ShopItemSchema>;

/** Nội dung mặc định theo tài liệu chiến lược mục 5–7 (giá là giả định thử nghiệm); dùng khi admin chưa lưu gì. */
export const DEFAULT_SHOP_CATALOG: ShopCatalog = {
  plans: [
    { id: 'free', name: 'Free', price: '0đ' },
    { id: 'plus', name: 'Plus', price: '29k/tháng' },
    { id: 'business', name: 'Business', price: '149k/tháng' },
  ],
  features: [
    { id: 'core', label: 'Xin vía, kể khổ, khoe, ghé phố, gửi vía', planIds: ['free', 'plus', 'business'] },
    { id: 'shop', label: 'Cửa hàng 3D cơ bản, chia sẻ thẻ vía', planIds: ['free', 'plus', 'business'] },
    { id: 'collection', label: 'Bộ sưu tập Thần Tài, vật phẩm riêng', planIds: ['plus', 'business'] },
    { id: 'diary', label: 'Nhật ký cá nhân, không quảng cáo', planIds: ['plus', 'business'] },
    { id: 'brand', label: 'Cửa hàng thương hiệu, logo, liên hệ', planIds: ['business'] },
    { id: 'stats', label: 'Link bán hàng, thống kê lượt ghé', planIds: ['business'] },
  ],
  revenue: [
    { id: 'premium', name: 'Xin Vía Premium', price: '19–39k/tháng', priority: 'P1' },
    { id: 'items', name: 'Vật phẩm 3D', price: '9–99k/vật phẩm', priority: 'P1' },
    { id: 'brandShop', name: 'Cửa hàng 3D thương hiệu', price: '99–299k/tháng', priority: 'P1' },
    { id: 'sponsor', name: 'Tài trợ sự kiện/thử thách', price: '5–50 triệu/chiến dịch', priority: 'P2' },
    { id: 'jobs', name: 'Tuyển dụng sale', price: '199–999k/tin hoặc gói', priority: 'P2' },
    { id: 'affiliate', name: 'Affiliate', price: 'Theo hoa hồng đối tác', priority: 'P2' },
  ],
  items: [
    { id: 'cay', name: 'Cây tài lộc', price: '19.000đ', image: 'vp-cay', active: true },
    { id: 'hoaDao', name: 'Cây hoa đào', price: '39.000đ', image: 'vp-hoa-dao', active: true },
    { id: 'thanTai', name: 'Skin Thần Tài', price: '59.000đ', image: 'vp-than-tai', active: true },
    { id: 'cong', name: 'Cổng cửa hàng', price: '49.000đ', image: 'vp-cong', active: true },
    { id: 'vanPhong', name: 'Văn phòng VIP', price: '99.000đ', image: 'vp-van-phong', active: true },
    { id: 'daiPhun', name: 'Đài phun nước', price: '49.000đ', image: 'vp-dai-phun', active: true },
    { id: 'denLong', name: 'Bộ trang trí Tết', price: '79.000đ', image: 'vp-den-long', active: true },
  ],
};
