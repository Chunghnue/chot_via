import { z } from 'zod';
import { NOTIFICATION_TYPES, REPORT_REASONS, REPORT_STATES, REPORT_TARGETS } from '../enums';
import { IdSchema, IsoDateSchema, PageQuerySchema, TurnstileTokenSchema } from '../common';
import { UserSummarySchema } from './user';
import { PostSchema } from './post';
import { PlaceSummarySchema } from './place';
import { HomeLayoutSchema } from './home';

export const ReportBodySchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: IdSchema,
  reason: z.enum(REPORT_REASONS),
  detail: z.string().trim().max(500).optional(),
  turnstileToken: TurnstileTokenSchema,
});
export type ReportBody = z.infer<typeof ReportBodySchema>;

export const MyReportSchema = z.object({ id: IdSchema, targetType: z.enum(REPORT_TARGETS), reason: z.enum(REPORT_REASONS), state: z.enum(REPORT_STATES), createdAt: IsoDateSchema });
export type MyReportDto = z.infer<typeof MyReportSchema>;

export const FollowResultSchema = z.object({ following: z.boolean(), followers: z.number().int() });
export const BlockResultSchema = z.object({ blocked: z.boolean() });
export const LikeResultSchema = z.object({ liked: z.boolean(), likes: z.number().int() });

export const SearchQuerySchema = z.object({ q: z.string().trim().min(1).max(80) });
export const SearchResultSchema = z.object({
  posts: z.array(PostSchema),
  places: z.array(PlaceSummarySchema),
  users: z.array(UserSummarySchema),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

/** Hoạt động mới (cột phải): không lộ danh tính khách. */
export const ActivityItemSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('place_wished'), id: IdSchema, createdAt: IsoDateSchema, actorName: z.string().nullable(), placeTitle: z.string(), placeSlug: z.string() }),
  z.object({ kind: z.literal('post_published'), id: IdSchema, createdAt: IsoDateSchema, actorName: z.string(), postId: IdSchema, postType: z.enum(['story', 'achievement', 'wish_share']) }),
]);
export type ActivityItem = z.infer<typeof ActivityItemSchema>;

const notifBase = { id: IdSchema, readAt: IsoDateSchema.nullable(), createdAt: IsoDateSchema };
export const NotificationSchema = z.discriminatedUnion('type', [
  z.object({ ...notifBase, type: z.literal('place_wished'), params: z.object({ placeTitle: z.string(), placeSlug: z.string(), wishTypeName: z.string(), senderName: z.string().nullable() }) }),
  z.object({ ...notifBase, type: z.literal('post_commented'), params: z.object({ postId: IdSchema, actorName: z.string() }) }),
  z.object({ ...notifBase, type: z.literal('post_reacted'), params: z.object({ postId: IdSchema, actorName: z.string() }) }),
  z.object({ ...notifBase, type: z.literal('new_follower'), params: z.object({ userId: IdSchema, actorName: z.string() }) }),
  z.object({ ...notifBase, type: z.literal('post_removed'), params: z.object({ postId: IdSchema }) }),
  z.object({ ...notifBase, type: z.literal('report_resolved'), params: z.object({ targetType: z.enum(REPORT_TARGETS) }) }),
]);
export type NotificationDto = z.infer<typeof NotificationSchema>;
/** Đánh dấu đã đọc: không có `ids` = tất cả thông báo của mình; có `ids` = chỉ các thông báo đó (của chính mình). */
export const MarkNotificationsReadBodySchema = z.object({ ids: z.array(IdSchema).min(1).max(100).optional() }).default({});
export type MarkNotificationsReadBody = z.infer<typeof MarkNotificationsReadBodySchema>;
export const NotificationListSchema = z.object({ items: z.array(NotificationSchema), unread: z.number().int() });
export const NotificationQuerySchema = PageQuerySchema;
export const NOTIFICATION_TYPE_LIST = NOTIFICATION_TYPES;

export const HomeSchema = z.object({
  heroPlaces: z.array(PlaceSummarySchema),
  stats: z.object({ members: z.number().int(), postsToday: z.number().int(), wishesTotal: z.number().int() }),
  layout: HomeLayoutSchema,
});
export type HomeDto = z.infer<typeof HomeSchema>;
