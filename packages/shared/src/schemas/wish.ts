import { z } from 'zod';
import { ANIMATION_KEYS, TIME_BUCKETS, WISH_TITLE_CODES } from '../enums';
import { IdSchema, IsoDateSchema, TurnstileTokenSchema } from '../common';

export const WishTextSchema = z.object({ templateId: IdSchema, text: z.string(), animationKey: z.enum(ANIMATION_KEYS) });
export type WishText = z.infer<typeof WishTextSchema>;

export const DeityWishBodySchema = z.object({
  sequence: z.number().int().min(1).max(100000),
  lastTemplateId: IdSchema.optional(),
  turnstileToken: TurnstileTokenSchema,
});
export type DeityWishBody = z.infer<typeof DeityWishBodySchema>;

export const DeityWishResultSchema = z.object({
  wish: WishTextSchema,
  titleCode: z.enum(WISH_TITLE_CODES),
  timeBucket: z.enum(TIME_BUCKETS),
  pointsAwarded: z.number().int().min(0).max(1),
  totalPoints: z.number().int().nullable(),
});
export type DeityWishResult = z.infer<typeof DeityWishResultSchema>;

/** Các lần xin vía Thần Tài hôm nay (giờ Việt Nam) của thành viên, dùng để đồng bộ trạng thái giữa các thiết bị. */
export const DeityTodaySchema = z.array(z.object({ at: z.string(), titleCode: z.enum(WISH_TITLE_CODES) }));
export type DeityToday = z.infer<typeof DeityTodaySchema>;

export const OfflinePackSchema = z.object({ texts: z.array(WishTextSchema) });
export type OfflinePack = z.infer<typeof OfflinePackSchema>;

export const PlaceWishBodySchema = z.object({
  wishTypeId: IdSchema,
  stickerId: IdSchema.optional(),
  message: z.string().trim().max(500).optional(),
  turnstileToken: TurnstileTokenSchema,
});
export type PlaceWishBody = z.infer<typeof PlaceWishBodySchema>;

export const PlaceWishResultSchema = z.object({
  eventId: IdSchema,
  placeTitle: z.string(),
  /** auto = chủ điểm bật tự động gửi vía; system = lời cảm ơn trung tính của hệ thống (không giả làm chủ điểm). */
  reply: z.object({ kind: z.enum(['auto', 'system']), text: z.string(), animationKey: z.enum(ANIMATION_KEYS) }),
  pointsAwarded: z.number().int().min(0).max(1),
  totalPoints: z.number().int().nullable(),
});
export type PlaceWishResult = z.infer<typeof PlaceWishResultSchema>;

export const PostWishBodySchema = z.object({ wishTypeId: IdSchema.optional() });
export const PostWishResultSchema = z.object({ wishes: z.number().int() });

export const PlaceWishItemSchema = z.object({
  id: IdSchema,
  createdAt: IsoDateSchema,
  wishTypeName: z.string(),
  message: z.string().nullable(),
  /** null = khách (hiển thị ẩn danh, không công khai danh tính — FR-06). */
  sender: z.object({ displayName: z.string(), avatarUrl: z.string().nullable() }).nullable(),
});
export type PlaceWishItem = z.infer<typeof PlaceWishItemSchema>;
