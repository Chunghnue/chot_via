import { z } from 'zod';
import {
  DISPLAY_MODES, FEED_SORTS, FEED_TYPES, MEMBER_ROLES, METRIC_TYPES, OWNER_METRICS, POST_STATUSES, POST_TYPES,
  REACTION_TYPES, SALE_METRICS, STORY_STICKERS, VERIFICATION_STATUSES,
} from '../enums';
import { HashtagSchema, IdSchema, IsoDateSchema, PageQuerySchema } from '../common';
import { UserSummarySchema } from './user';
import { WishTypeSchema } from './catalog';

/** Số lượt gửi vía theo từng loại trên một bài (6 biểu tượng); `mine` = người xem đã gửi loại này. */
export const WishCountSchema = z.object({ wishTypeId: IdSchema, code: z.string(), name: z.string(), iconKey: WishTypeSchema.shape.iconKey, sortOrder: z.number().int(), count: z.number().int(), mine: z.boolean() });
export type WishCountDto = z.infer<typeof WishCountSchema>;

export const MediaSchema = z.object({ id: IdSchema, url: z.string(), width: z.number().int().nullable(), height: z.number().int().nullable() });
export type MediaDto = z.infer<typeof MediaSchema>;

export const AchievementSchema = z.object({
  metricType: z.enum(METRIC_TYPES),
  displayMode: z.enum(DISPLAY_MODES),
  rangeCode: z.string().nullable(),
  /** Chỉ có khi displayMode = exact. */
  amount: z.number().int().nullable(),
  verification: z.enum(VERIFICATION_STATUSES),
});
export type AchievementDto = z.infer<typeof AchievementSchema>;

export const PollSchema = z.object({
  options: z.array(z.object({ id: z.string(), text: z.string(), votes: z.number().int() })),
  totalVotes: z.number().int(),
  myVoteId: z.string().nullable(),
});
export type PollDto = z.infer<typeof PollSchema>;

export const PostSchema = z.object({
  id: IdSchema,
  type: z.enum(POST_TYPES),
  role: z.enum(MEMBER_ROLES).nullable(),
  body: z.string(),
  sticker: z.enum(STORY_STICKERS).nullable(),
  wishType: WishTypeSchema.nullable(),
  location: z.string().nullable(),
  hashtags: z.array(z.string()),
  media: z.array(MediaSchema),
  achievement: AchievementSchema.nullable(),
  poll: PollSchema.nullable(),
  author: UserSummarySchema,
  status: z.enum(POST_STATUSES),
  /** Bài được quản trị viên ghim lên đầu bảng tin trang chủ. */
  pinned: z.boolean(),
  counts: z.object({ reactions: z.number().int(), comments: z.number().int(), wishes: z.number().int(), shares: z.number().int() }),
  /** Lượt gửi vía chia theo 6 loại (đủ 6 loại, loại chưa ai gửi có `count` = 0). */
  wishBreakdown: z.array(WishCountSchema),
  viewer: z.object({ reaction: z.enum(REACTION_TYPES).nullable(), saved: z.boolean(), wished: z.boolean(), isOwn: z.boolean() }).nullable(),
  createdAt: IsoDateSchema,
});
export type PostDto = z.infer<typeof PostSchema>;

export const PostListQuerySchema = PageQuerySchema.extend({
  type: z.enum(FEED_TYPES).default('all'),
  sort: z.enum(FEED_SORTS).default('new'),
  role: z.enum(MEMBER_ROLES).optional(),
  hashtag: z.string().trim().max(30).optional(),
  q: z.string().trim().max(80).optional(),
  authorId: IdSchema.optional(),
  /** Chỉ bài có ảnh (photo) hoặc có bình chọn (poll). */
  has: z.enum(['photo', 'poll']).optional(),
  /** `first`: bài được ghim xếp trước (dùng cho bảng tin trang chủ). */
  pinned: z.enum(['first']).optional(),
});
export type PostListQuery = z.infer<typeof PostListQuerySchema>;

const common = {
  body: z.string().trim().max(5000),
  location: z.string().trim().max(40).nullable().optional(),
  hashtags: z.array(HashtagSchema).max(10).default([]),
  mediaIds: z.array(IdSchema).max(10).default([]),
};

export const StoryBodySchema = z.object({
  type: z.literal('story'),
  ...common,
  sticker: z.enum(STORY_STICKERS).nullable().optional(),
  poll: z.object({ options: z.array(z.string().trim().min(1).max(60)).min(2).max(4) }).nullable().optional(),
});
export const AchievementBodySchema = z.object({
  type: z.literal('achievement'),
  ...common,
  role: z.enum(MEMBER_ROLES),
  metricType: z.enum(METRIC_TYPES),
  displayMode: z.enum(DISPLAY_MODES).default('hidden'),
  rangeCode: z.string().max(20).nullable().optional(),
  amount: z.number().int().positive().max(1_000_000_000_000).nullable().optional(),
});
export const WishShareBodySchema = z.object({ type: z.literal('wish_share'), ...common, wishTypeId: IdSchema.nullable().optional() });

export const CreatePostBodySchema = z.discriminatedUnion('type', [StoryBodySchema, AchievementBodySchema, WishShareBodySchema]);
export type CreatePostBody = z.infer<typeof CreatePostBodySchema>;

/** Chỉ số hợp lệ theo vai trò (chủ quán / sale). */
export function metricAllowedForRole(role: (typeof MEMBER_ROLES)[number], metric: (typeof METRIC_TYPES)[number]): boolean {
  const list: readonly string[] = role === 'owner' ? OWNER_METRICS : SALE_METRICS;
  return list.includes(metric);
}

export const SetReactionBodySchema = z.object({ type: z.enum(REACTION_TYPES) });
export const ReactionResultSchema = z.object({ reactions: z.number().int(), mine: z.enum(REACTION_TYPES).nullable() });
export const VotePollBodySchema = z.object({ optionId: z.string().min(1).max(20) });

export const CommentSchema = z.object({ id: IdSchema, body: z.string(), author: UserSummarySchema, createdAt: IsoDateSchema, isOwn: z.boolean() });
export type CommentDto = z.infer<typeof CommentSchema>;
export const CreateCommentBodySchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const ShareResultSchema = z.object({ shares: z.number().int() });
export const SavedResultSchema = z.object({ saved: z.boolean() });
export const HotTopicSchema = z.object({ id: IdSchema, title: z.string(), hashtag: z.string().nullable() });
export type HotTopicDto = z.infer<typeof HotTopicSchema>;
export const StoryAuthorRankSchema = z.object({ rank: z.number().int(), user: UserSummarySchema, hearts: z.number().int() });
export type StoryAuthorRank = z.infer<typeof StoryAuthorRankSchema>;
export const HashtagCountSchema = z.object({ tag: z.string(), count: z.number().int() });
export type HashtagCount = z.infer<typeof HashtagCountSchema>;
