import { z } from 'zod';
import {
  ACCOUNT_ROLES, ACCOUNT_STATUSES, ANIMATION_KEYS, BADGE_CONDITIONS, CHALLENGE_SCOPES, COMMENT_STATUSES, ICON_KEYS, KEYWORD_ACTIONS,
  MEMBER_ROLES, MISSION_ACTIONS, MISSION_PERIODS, PLACE_KINDS, PLACE_STATUSES, POST_STATUSES, REPORT_ACTIONS, REPORT_REASONS,
  REPORT_STATES, REPORT_TARGETS, SCENE_MODEL_KEYS, TIME_BUCKETS, WISH_TEMPLATE_SOURCES,
} from '../enums';
import { HashtagSchema, IdSchema, IsoDateSchema, PageQuerySchema } from '../common';
import { PlaceDetailSchema, PlaceInputSchema } from './place';
import { UserSummarySchema } from './user';
import { FooterLinkInputSchema, HomeActionInputSchema, StreetSlotInputSchema } from './home';

const withId = <T extends z.ZodRawShape>(shape: T) => z.object({ id: IdSchema, ...shape });

/* ---- Các tài nguyên CRUD đơn giản (một controller dùng chung ở backend) ---- */
export const WishTypeInputSchema = z.object({ code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'invalid_string'), name: z.string().trim().min(2).max(60), iconKey: z.enum(ICON_KEYS), sortOrder: z.number().int(), active: z.boolean() });
export const WishStickerInputSchema = WishTypeInputSchema;
export const WishTemplateInputSchema = z.object({
  source: z.enum(WISH_TEMPLATE_SOURCES), timeBucket: z.enum(TIME_BUCKETS).nullable(), wishTypeId: IdSchema.nullable(),
  roleTarget: z.enum(MEMBER_ROLES).nullable(), text: z.string().trim().min(2).max(300), animationKey: z.enum(ANIMATION_KEYS), active: z.boolean(),
});
export const PlaceCategoryInputSchema = z.object({ code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'invalid_string'), name: z.string().trim().min(2).max(60), iconKey: z.enum(ICON_KEYS), kind: z.enum(PLACE_KINDS), sortOrder: z.number().int(), active: z.boolean() });
export const SceneTemplateInputSchema = z.object({ name: z.string().trim().min(2).max(60), kind: z.enum(PLACE_KINDS), modelKey: z.enum(SCENE_MODEL_KEYS), thumbnailUrl: z.string().max(500).nullable(), glbUrl: z.string().max(500).nullable(), glbLod1Url: z.string().max(500).nullable(), glbLod2Url: z.string().max(500).nullable(), modelScale: z.number().min(0.1).max(20), active: z.boolean() });
export const KeywordInputSchema = z.object({ keyword: z.string().trim().min(2).max(60), action: z.enum(KEYWORD_ACTIONS) });
export const HotTopicInputSchema = z.object({ title: z.string().trim().min(2).max(80), hashtag: HashtagSchema.nullable(), sortOrder: z.number().int(), active: z.boolean() });
export const MissionInputSchema = z.object({ code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'invalid_string'), name: z.string().trim().min(2).max(80), description: z.string().trim().max(200), period: z.enum(MISSION_PERIODS), action: z.enum(MISSION_ACTIONS), target: z.number().int().positive().max(1000), rewardPoints: z.number().int().min(0).max(1000), sortOrder: z.number().int(), active: z.boolean() });
export const ChallengeInputSchema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(200), action: z.enum(MISSION_ACTIONS), target: z.number().int().positive().max(100000), scope: z.enum(CHALLENGE_SCOPES), startsAt: IsoDateSchema, endsAt: IsoDateSchema, active: z.boolean() });
export const EventInputSchema = z.object({ title: z.string().trim().min(2).max(100), description: z.string().trim().max(500), coverUrl: z.string().max(500).nullable(), startsAt: IsoDateSchema, endsAt: IsoDateSchema, active: z.boolean() });
export const LevelInputSchema = z.object({ level: z.number().int().positive().max(100), name: z.string().trim().min(2).max(60), minPoints: z.number().int().nonnegative() });
export const BadgeInputSchema = z.object({ code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'invalid_string'), name: z.string().trim().min(2).max(60), description: z.string().trim().max(200), iconKey: z.enum(ICON_KEYS), conditionType: z.enum(BADGE_CONDITIONS), threshold: z.number().int().positive(), active: z.boolean() });

export const ADMIN_RESOURCES = {
  'wish-types': WishTypeInputSchema,
  'wish-stickers': WishStickerInputSchema,
  'wish-templates': WishTemplateInputSchema,
  'place-categories': PlaceCategoryInputSchema,
  'scene-templates': SceneTemplateInputSchema,
  keywords: KeywordInputSchema,
  'hot-topics': HotTopicInputSchema,
  missions: MissionInputSchema,
  challenges: ChallengeInputSchema,
  events: EventInputSchema,
  levels: LevelInputSchema,
  badges: BadgeInputSchema,
  'home-actions': HomeActionInputSchema,
  'footer-links': FooterLinkInputSchema,
  'street-slots': StreetSlotInputSchema,
} as const;
export type AdminResourceKey = keyof typeof ADMIN_RESOURCES;
export const ADMIN_RESOURCE_KEYS = Object.keys(ADMIN_RESOURCES).filter((k): k is AdminResourceKey => k in ADMIN_RESOURCES);

export type WishTypeInput = z.infer<typeof WishTypeInputSchema>;
export type WishStickerInput = z.infer<typeof WishStickerInputSchema>;
export type WishTemplateInput = z.infer<typeof WishTemplateInputSchema>;
export type PlaceCategoryInput = z.infer<typeof PlaceCategoryInputSchema>;
export type SceneTemplateInput = z.infer<typeof SceneTemplateInputSchema>;
export type HotTopicInput = z.infer<typeof HotTopicInputSchema>;
export type KeywordInput = z.infer<typeof KeywordInputSchema>;
export type MissionInput = z.infer<typeof MissionInputSchema>;
export type ChallengeInput = z.infer<typeof ChallengeInputSchema>;
export type EventInput = z.infer<typeof EventInputSchema>;
export type LevelInput = z.infer<typeof LevelInputSchema>;
export type BadgeInput = z.infer<typeof BadgeInputSchema>;
export type HomeActionItem = z.infer<typeof HomeActionItemSchema>;
export type FooterLinkItem = z.infer<typeof FooterLinkItemSchema>;
export type StreetSlotItem = z.infer<typeof StreetSlotItemSchema>;

export const WishTypeItemSchema = withId(WishTypeInputSchema.shape);
export const WishStickerItemSchema = withId(WishStickerInputSchema.shape);
export const WishTemplateItemSchema = withId(WishTemplateInputSchema.shape);
export const PlaceCategoryItemSchema = withId(PlaceCategoryInputSchema.shape);
export const SceneTemplateItemSchema = withId(SceneTemplateInputSchema.shape);
export const KeywordItemSchema = withId(KeywordInputSchema.shape);
export const HotTopicItemSchema = withId(HotTopicInputSchema.shape);
export const MissionItemSchema = withId(MissionInputSchema.shape);
export const ChallengeItemSchema = withId(ChallengeInputSchema.shape);
export const EventItemSchema = withId(EventInputSchema.shape);
export const LevelItemSchema = withId(LevelInputSchema.shape);
export const BadgeItemSchema = withId(BadgeInputSchema.shape);
export const HomeActionItemSchema = withId(HomeActionInputSchema.shape);
export const FooterLinkItemSchema = withId(FooterLinkInputSchema.shape);
export const StreetSlotItemSchema = withId(StreetSlotInputSchema.shape);
export type WishTypeItem = z.infer<typeof WishTypeItemSchema>;
export type WishStickerItem = z.infer<typeof WishStickerItemSchema>;
export type WishTemplateItem = z.infer<typeof WishTemplateItemSchema>;
export type PlaceCategoryItem = z.infer<typeof PlaceCategoryItemSchema>;
export type SceneTemplateItem = z.infer<typeof SceneTemplateItemSchema>;
export type HotTopicItem = z.infer<typeof HotTopicItemSchema>;
export type KeywordItem = z.infer<typeof KeywordItemSchema>;
export type MissionItem = z.infer<typeof MissionItemSchema>;
export type ChallengeItem = z.infer<typeof ChallengeItemSchema>;
export type EventItem = z.infer<typeof EventItemSchema>;
export type LevelItem = z.infer<typeof LevelItemSchema>;
export type BadgeItem = z.infer<typeof BadgeItemSchema>;

/* ---- Địa điểm (admin tạo mẫu demo, sửa, ẩn, xóa) ---- */
export const AdminPlaceInputSchema = PlaceInputSchema.extend({
  ownerId: IdSchema.nullable().optional(),
  isDemo: z.boolean().default(true),
  status: z.enum(PLACE_STATUSES).default('visible'),
  sortOrder: z.number().int().default(0),
  coverUrl: z.string().max(500).nullable().optional(),
});
export type AdminPlaceInput = z.infer<typeof AdminPlaceInputSchema>;
export const AdminPlaceUpdateSchema = AdminPlaceInputSchema.partial();
export type AdminPlaceUpdate = z.infer<typeof AdminPlaceUpdateSchema>;
export const AdminPlaceSchema = PlaceDetailSchema;

/* ---- Danh sách quản trị ---- */
export const AdminListQuerySchema = PageQuerySchema.extend({
  q: z.string().trim().max(80).optional(),
  status: z.string().max(30).optional(),
  state: z.enum(REPORT_STATES).optional(),
});
export type AdminListQuery = z.infer<typeof AdminListQuerySchema>;

export const AdminUserSchema = z.object({
  id: IdSchema, displayName: z.string(), phoneMasked: z.string().nullable(), accountRole: z.enum(ACCOUNT_ROLES), status: z.enum(ACCOUNT_STATUSES),
  memberRole: z.enum(MEMBER_ROLES).nullable(), points: z.number().int(), createdAt: IsoDateSchema,
});
export type AdminUserDto = z.infer<typeof AdminUserSchema>;
export const AdminUserUpdateSchema = z.object({ status: z.enum(ACCOUNT_STATUSES).optional(), accountRole: z.enum(ACCOUNT_ROLES).optional() });
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;

/* ---- Dữ liệu mẫu (tài khoản mẫu, bài mẫu) quản lý trong web admin ---- */
export const DemoUserInputSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  memberRole: z.enum(MEMBER_ROLES).nullable(),
  jobTitle: z.string().trim().max(60).nullable(),
  province: z.string().trim().max(40).nullable(),
  avatarUrl: z.string().max(500).nullable(),
  status: z.enum(ACCOUNT_STATUSES),
});
export type DemoUserInput = z.infer<typeof DemoUserInputSchema>;
export const DemoUserItemSchema = DemoUserInputSchema.extend({ id: IdSchema, createdAt: IsoDateSchema });
export type DemoUserItem = z.infer<typeof DemoUserItemSchema>;

export const DEMO_POST_TYPES = ['story', 'achievement'] as const;
export const DemoPostInputSchema = z.object({
  authorId: IdSchema,
  type: z.enum(DEMO_POST_TYPES),
  body: z.string().trim().min(2).max(2000),
  hashtags: z.array(HashtagSchema).max(5),
  imageUrl: z.string().max(500).nullable(),
  pinned: z.boolean(),
  reactionCount: z.number().int().min(0).max(10_000_000),
  commentCount: z.number().int().min(0).max(10_000_000),
  shareCount: z.number().int().min(0).max(10_000_000),
  hoursAgo: z.number().min(0).max(24 * 365),
});
export type DemoPostInput = z.infer<typeof DemoPostInputSchema>;
export const DemoPostItemSchema = DemoPostInputSchema.omit({ hoursAgo: true }).extend({ id: IdSchema, authorName: z.string(), createdAt: IsoDateSchema });
export type DemoPostItem = z.infer<typeof DemoPostItemSchema>;

export const AdminPostUpdateSchema = z.object({ status: z.enum(POST_STATUSES).optional(), pinned: z.boolean().optional() }).refine((v) => v.status !== undefined || v.pinned !== undefined, { message: 'required' });
export type AdminPostUpdate = z.infer<typeof AdminPostUpdateSchema>;
export const AdminCommentSchema = z.object({ id: IdSchema, postId: IdSchema, body: z.string(), author: UserSummarySchema, status: z.enum(COMMENT_STATUSES), createdAt: IsoDateSchema });
export type AdminCommentDto = z.infer<typeof AdminCommentSchema>;
export const AdminCommentUpdateSchema = z.object({ status: z.enum(COMMENT_STATUSES) });

export const AdminReportSchema = z.object({
  id: IdSchema, targetType: z.enum(REPORT_TARGETS), targetId: IdSchema, reason: z.enum(REPORT_REASONS), detail: z.string().nullable(),
  state: z.enum(REPORT_STATES), reporterName: z.string().nullable(), isAuto: z.boolean(),
  /** Số báo cáo đang chờ trên cùng đối tượng; >= ngưỡng thì đưa lên hàng chờ ưu tiên. */
  targetReportCount: z.number().int(), escalated: z.boolean(),
  preview: z.object({ text: z.string().nullable(), authorName: z.string().nullable(), status: z.string().nullable() }),
  createdAt: IsoDateSchema,
});
export type AdminReportDto = z.infer<typeof AdminReportSchema>;
export const AdminReportActionSchema = z.object({ action: z.enum(REPORT_ACTIONS) });
export type AdminReportAction = z.infer<typeof AdminReportActionSchema>;

export const AdminStatsSchema = z.object({
  members: z.number().int(), newMembers7d: z.number().int(), bannedMembers: z.number().int(),
  postsTotal: z.number().int(), posts7d: z.number().int(), wishesTotal: z.number().int(), wishes7d: z.number().int(),
  placesTotal: z.number().int(), pendingReports: z.number().int(),
});
export type AdminStatsDto = z.infer<typeof AdminStatsSchema>;

export const AuditLogSchema = z.object({ id: IdSchema, actorName: z.string().nullable(), action: z.string(), objectType: z.string(), objectId: z.string().nullable(), createdAt: IsoDateSchema });
export type AuditLogDto = z.infer<typeof AuditLogSchema>;
