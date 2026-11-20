import { z } from 'zod';
import { PLACE_KINDS, PLACE_STATUSES, SCENE_MODEL_KEYS } from '../enums';
import { IdSchema, IsoDateSchema, PageQuerySchema } from '../common';
import { UserSummarySchema } from './user';

export const PlaceSummarySchema = z.object({
  id: IdSchema,
  slug: z.string(),
  kind: z.enum(PLACE_KINDS),
  title: z.string(),
  tagline: z.string().nullable(),
  categoryId: IdSchema,
  categoryName: z.string(),
  coverUrl: z.string().nullable(),
  sceneTemplateId: IdSchema,
  modelKey: z.enum(SCENE_MODEL_KEYS),
  /** Điểm mẫu do admin tạo: phải gắn nhãn demo, không có doanh thu/giao dịch thật. */
  isDemo: z.boolean(),
  ownerName: z.string().nullable(),
  wishCount: z.number().int(),
  likeCount: z.number().int(),
  followCount: z.number().int(),
  visitCount: z.number().int(),
  autoReplyEnabled: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: IsoDateSchema,
});
export type PlaceSummary = z.infer<typeof PlaceSummarySchema>;

export const PlaceRankQuerySchema = z.object({ kind: z.enum(PLACE_KINDS).default('store'), limit: z.coerce.number().int().min(1).max(20).default(5) });
export type PlaceRankQuery = z.infer<typeof PlaceRankQuerySchema>;
/** Bảng xếp hạng cửa hàng/sale theo số vía nhận trong tuần (reset thứ Hai 00:00 giờ Việt Nam). */
export const PlaceRankSchema = z.object({ rank: z.number().int(), place: PlaceSummarySchema, wishes: z.number().int() });
export type PlaceRank = z.infer<typeof PlaceRankSchema>;
export const PlaceLeaderboardSchema = z.object({ weekStartsAt: IsoDateSchema, items: z.array(PlaceRankSchema) });
export type PlaceLeaderboard = z.infer<typeof PlaceLeaderboardSchema>;

export const PlaceDetailSchema = PlaceSummarySchema.extend({
  description: z.string().nullable(),
  province: z.string().nullable(),
  owner: UserSummarySchema.nullable(),
  status: z.enum(PLACE_STATUSES),
  viewer: z.object({ liked: z.boolean(), following: z.boolean(), isOwner: z.boolean() }).nullable(),
});
export type PlaceDetail = z.infer<typeof PlaceDetailSchema>;

export const PlaceListQuerySchema = PageQuerySchema.extend({
  search: z.string().trim().max(60).optional(),
  categoryId: IdSchema.optional(),
  kind: z.enum(PLACE_KINDS).optional(),
  sort: z.enum(['street', 'new', 'top']).default('street'),
  /** following = tab "Bạn bè" (điểm mình đang theo dõi). */
  scope: z.enum(['all', 'following']).default('all'),
});
export type PlaceListQuery = z.infer<typeof PlaceListQuerySchema>;

export const PlaceInputSchema = z.object({
  kind: z.enum(PLACE_KINDS),
  title: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(100).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  province: z.string().trim().max(40).nullable().optional(),
  categoryId: IdSchema,
  sceneTemplateId: IdSchema,
  autoReplyEnabled: z.boolean().default(false),
});
export type PlaceInput = z.infer<typeof PlaceInputSchema>;
export const PlaceUpdateSchema = PlaceInputSchema.partial();
export type PlaceUpdate = z.infer<typeof PlaceUpdateSchema>;

export const AutoRepliesSchema = z.object({
  replies: z.array(z.object({ wishTypeId: IdSchema, text: z.string().trim().min(2).max(200) })).max(20),
});
export type AutoReplies = z.infer<typeof AutoRepliesSchema>;
export const AutoRepliesResultSchema = AutoRepliesSchema;

export const PlaceSlugParamSchema = z.object({ idOrSlug: z.string().min(1).max(100) });
