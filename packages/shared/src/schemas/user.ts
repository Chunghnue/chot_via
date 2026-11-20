import { z } from 'zod';
import { ACCOUNT_ROLES, BADGE_CONDITIONS, ICON_KEYS, MEMBER_ROLES } from '../enums';
import { IdSchema, IsoDateSchema } from '../common';

export const LevelSchema = z.object({ id: IdSchema, level: z.number().int().positive(), name: z.string(), minPoints: z.number().int().nonnegative() });
export type LevelDto = z.infer<typeof LevelSchema>;

export const BadgeSchema = z.object({
  id: IdSchema, code: z.string(), name: z.string(), description: z.string(), iconKey: z.enum(ICON_KEYS),
  conditionType: z.enum(BADGE_CONDITIONS), threshold: z.number().int().positive(),
});
export type BadgeDto = z.infer<typeof BadgeSchema>;

export const UserSummarySchema = z.object({
  id: IdSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  memberRole: z.enum(MEMBER_ROLES).nullable(),
  /** Chức danh tự khai hiển thị cạnh tên (ví dụ "Chủ quán Cafe"); trống thì dùng nhãn vai trò. */
  jobTitle: z.string().nullable(),
  level: LevelSchema.nullable(),
});
export type UserSummary = z.infer<typeof UserSummarySchema>;

export const MeSchema = UserSummarySchema.extend({
  accountRole: z.enum(ACCOUNT_ROLES),
  phoneMasked: z.string().nullable(),
  points: z.number().int(),
  province: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: IsoDateSchema,
});
export type MeDto = z.infer<typeof MeSchema>;

export const UpdateMeBodySchema = z.object({
  displayName: z.string().trim().min(2).max(40).optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
  memberRole: z.enum(MEMBER_ROLES).nullable().optional(),
  province: z.string().trim().max(40).nullable().optional(),
  bio: z.string().trim().max(200).nullable().optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeBodySchema>;

export const PublicProfileSchema = UserSummarySchema.extend({
  points: z.number().int(),
  province: z.string().nullable(),
  bio: z.string().nullable(),
  badges: z.array(BadgeSchema),
  counts: z.object({ posts: z.number().int(), followers: z.number().int(), following: z.number().int() }),
  viewer: z.object({ following: z.boolean(), blocked: z.boolean() }).nullable(),
  createdAt: IsoDateSchema,
});
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const MeStatsSchema = z.object({
  points: z.number().int(),
  level: LevelSchema.nullable(),
  nextLevel: LevelSchema.nullable(),
  badges: z.array(BadgeSchema),
  rank: z.number().int().nullable(),
  wishCounts: z.object({ deity: z.number().int(), place: z.number().int() }),
  counts: z.object({ posts: z.number().int(), followers: z.number().int(), following: z.number().int() }),
});
export type MeStats = z.infer<typeof MeStatsSchema>;

export const LeaderboardQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(500).default(5) });
export const LeaderboardSchema = z.object({
  items: z.array(z.object({ rank: z.number().int(), user: UserSummarySchema, points: z.number().int() })),
  total: z.number().int(),
  me: z.object({ rank: z.number().int().nullable(), points: z.number().int() }).nullable(),
});
export type LeaderboardDto = z.infer<typeof LeaderboardSchema>;
