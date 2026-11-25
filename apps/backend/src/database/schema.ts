import { sql } from 'drizzle-orm';
import {
  bigint, boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';
import type {
  AccountRole, AccountStatus, AnimationKey, BadgeCondition, ChallengeScope, CommentStatus, DisplayMode, HomeActionKind, IconKey, KeywordAction,
  MemberRole, MetricType, MissionAction, MissionPeriod, NotificationType, OAuthProvider, PlaceKind, PlaceStatus, PointAction,
  PostStatus, PostType, ReactionType, ReportReason, ReportState, ReportTarget, SceneModelKey, TimeBucket, WishSource, WishTemplateSource,
} from '@chot-via/shared';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable('users', {
  id: id(),
  phone: text('phone').unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  memberRole: text('member_role').$type<MemberRole>(),
  accountRole: text('account_role').$type<AccountRole>().notNull().default('member'),
  status: text('status').$type<AccountStatus>().notNull().default('active'),
  points: integer('points').notNull().default(0),
  pointsUpdatedAt: ts('points_updated_at').notNull().defaultNow(),
  province: text('province'),
  bio: text('bio'),
  jobTitle: text('job_title'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: createdAt(),
  lastLoginAt: ts('last_login_at'),
}, (t) => [index('users_points_idx').on(t.points.desc(), t.pointsUpdatedAt)]);

export const authIdentities = pgTable('auth_identities', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').$type<OAuthProvider>().notNull(),
  providerUserId: text('provider_user_id').notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('auth_identity_unique').on(t.provider, t.providerUserId)]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: ts('expires_at').notNull(),
  revokedAt: ts('revoked_at'),
  createdAt: createdAt(),
});

export const otpCodes = pgTable('otp_codes', {
  id: id(),
  phone: text('phone').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: ts('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: ts('consumed_at'),
  createdAt: createdAt(),
}, (t) => [index('otp_phone_idx').on(t.phone, t.createdAt)]);

export const otpLocks = pgTable('otp_locks', {
  phone: text('phone').primaryKey(),
  lockedUntil: ts('locked_until').notNull(),
});

export const guestSessions = pgTable('guest_sessions', {
  id: id(),
  anonymousHash: text('anonymous_hash').notNull().unique(),
  firstSeen: ts('first_seen').notNull().defaultNow(),
  lastSeen: ts('last_seen').notNull().defaultNow(),
  expiresAt: ts('expires_at').notNull(),
});

export const placeCategories = pgTable('place_categories', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  iconKey: text('icon_key').$type<IconKey>().notNull(),
  kind: text('kind').$type<PlaceKind>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const sceneTemplates = pgTable('scene_templates', {
  id: id(),
  name: text('name').notNull(),
  kind: text('kind').$type<PlaceKind>().notNull(),
  modelKey: text('model_key').$type<SceneModelKey>().notNull(),
  thumbnailUrl: text('thumbnail_url'),
  /** Model 3D (GLB) theo 3 mức chi tiết; thay file ở web admin, không cần đổi code. */
  glbUrl: text('glb_url'),
  glbLod1Url: text('glb_lod1_url'),
  glbLod2Url: text('glb_lod2_url'),
  modelScale: real('model_scale').notNull().default(1),
  active: boolean('active').notNull().default(true),
});

export const wishTypes = pgTable('wish_types', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  iconKey: text('icon_key').$type<IconKey>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const wishStickers = pgTable('wish_stickers', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  iconKey: text('icon_key').$type<IconKey>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const wishTemplates = pgTable('wish_templates', {
  id: id(),
  source: text('source').$type<WishTemplateSource>().notNull(),
  timeBucket: text('time_bucket').$type<TimeBucket>(),
  wishTypeId: uuid('wish_type_id').references(() => wishTypes.id, { onDelete: 'set null' }),
  roleTarget: text('role_target').$type<MemberRole>(),
  text: text('text').notNull(),
  animationKey: text('animation_key').$type<AnimationKey>().notNull(),
  active: boolean('active').notNull().default(true),
});

export const places = pgTable('places', {
  id: id(),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  kind: text('kind').$type<PlaceKind>().notNull(),
  title: text('title').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  province: text('province'),
  categoryId: uuid('category_id').notNull().references(() => placeCategories.id),
  sceneTemplateId: uuid('scene_template_id').notNull().references(() => sceneTemplates.id),
  coverUrl: text('cover_url'),
  status: text('status').$type<PlaceStatus>().notNull().default('visible'),
  isDemo: boolean('is_demo').notNull().default(false),
  autoReplyEnabled: boolean('auto_reply_enabled').notNull().default(false),
  wishCount: integer('wish_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  followCount: integer('follow_count').notNull().default(0),
  visitCount: integer('visit_count').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('places_list_idx').on(t.status, t.sortOrder), index('places_owner_idx').on(t.ownerId)]);

export const placeAutoReplies = pgTable('place_auto_replies', {
  placeId: uuid('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  wishTypeId: uuid('wish_type_id').notNull().references(() => wishTypes.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
}, (t) => [primaryKey({ columns: [t.placeId, t.wishTypeId] })]);

export const placeLikes = pgTable('place_likes', {
  placeId: uuid('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.placeId, t.userId] })]);

export const placeFollows = pgTable('place_follows', {
  placeId: uuid('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.placeId, t.userId] })]);

export const placeVisits = pgTable('place_visits', {
  id: id(),
  placeId: uuid('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestHash: text('guest_hash'),
  createdAt: createdAt(),
}, (t) => [index('place_visits_idx').on(t.placeId, t.createdAt), index('place_visits_user_idx').on(t.userId, t.createdAt)]);

export const posts = pgTable('posts', {
  id: id(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<PostType>().notNull(),
  role: text('role').$type<MemberRole>(),
  body: text('body').notNull(),
  sticker: text('sticker'),
  location: text('location'),
  hashtags: text('hashtags').array().notNull().default(sql`ARRAY[]::text[]`),
  wishTypeId: uuid('wish_type_id').references(() => wishTypes.id, { onDelete: 'set null' }),
  poll: jsonb('poll').$type<{ options: { id: string; text: string }[] }>(),
  status: text('status').$type<PostStatus>().notNull().default('published'),
  pinnedAt: ts('pinned_at'),
  isDemo: boolean('is_demo').notNull().default(false),
  reactionCount: integer('reaction_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  wishCount: integer('wish_count').notNull().default(0),
  shareCount: integer('share_count').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('posts_feed_idx').on(t.status, t.createdAt.desc()), index('posts_author_idx').on(t.authorId, t.createdAt.desc())]);

export const postMedia = pgTable('post_media', {
  id: id(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  width: integer('width'),
  height: integer('height'),
  position: integer('position').notNull().default(0),
  createdAt: createdAt(),
});

export const achievements = pgTable('achievements', {
  postId: uuid('post_id').primaryKey().references(() => posts.id, { onDelete: 'cascade' }),
  metricType: text('metric_type').$type<MetricType>().notNull(),
  displayMode: text('display_mode').$type<DisplayMode>().notNull().default('hidden'),
  rangeCode: text('range_code'),
  amount: bigint('amount', { mode: 'number' }),
  verificationStatus: text('verification_status').notNull().default('self_declared'),
});

export const reactions = pgTable('reactions', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<ReactionType>().notNull(),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId] })]);

export const comments = pgTable('comments', {
  id: id(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  status: text('status').$type<CommentStatus>().notNull().default('published'),
  createdAt: createdAt(),
}, (t) => [index('comments_post_idx').on(t.postId, t.createdAt)]);

export const postShares = pgTable('post_shares', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  actorKey: text('actor_key').notNull(),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.postId, t.actorKey] })]);

export const pollVotes = pgTable('poll_votes', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  optionId: text('option_id').notNull(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId] })]);

export const savedPosts = pgTable('saved_posts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.postId] })]);

export const userFollows = pgTable('user_follows', {
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followeeId: uuid('followee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.followerId, t.followeeId] })]);

export const userBlocks = pgTable('user_blocks', {
  blockerId: uuid('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: uuid('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]);

export const wishEvents = pgTable('wish_events', {
  id: id(),
  source: text('source').$type<WishSource>().notNull(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  guestHash: text('guest_hash'),
  targetPlaceId: uuid('target_place_id').references(() => places.id, { onDelete: 'cascade' }),
  targetPostId: uuid('target_post_id').references(() => posts.id, { onDelete: 'cascade' }),
  wishTypeId: uuid('wish_type_id').references(() => wishTypes.id, { onDelete: 'set null' }),
  stickerId: uuid('sticker_id').references(() => wishStickers.id, { onDelete: 'set null' }),
  message: text('message'),
  replyKind: text('reply_kind').$type<'auto' | 'system'>(),
  replyText: text('reply_text'),
  createdAt: createdAt(),
}, (t) => [
  index('wish_events_place_idx').on(t.targetPlaceId, t.createdAt.desc()),
  index('wish_events_actor_idx').on(t.actorUserId, t.source, t.createdAt),
  index('wish_events_post_idx').on(t.targetPostId),
]);

export const pointLedger = pgTable('point_ledger', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').$type<PointAction>().notNull(),
  points: integer('points').notNull().default(1),
  /** Khóa duy nhất theo sự kiện vía → mỗi hành động chỉ ghi điểm một lần. */
  wishEventId: uuid('wish_event_id').unique().references(() => wishEvents.id, { onDelete: 'cascade' }),
  /** Điểm thưởng nhiệm vụ: mỗi (người dùng, nhiệm vụ, kỳ) ghi đúng một lần; `periodKey` là ngày bắt đầu kỳ (ISO). */
  missionId: uuid('mission_id').references(() => missions.id, { onDelete: 'cascade' }),
  periodKey: text('period_key'),
  createdAt: createdAt(),
}, (t) => [index('point_ledger_user_idx').on(t.userId, t.action), uniqueIndex('point_ledger_mission_unique').on(t.userId, t.missionId, t.periodKey)]);

export const reports = pgTable('reports', {
  id: id(),
  targetType: text('target_type').$type<ReportTarget>().notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').$type<ReportReason>().notNull(),
  detail: text('detail'),
  reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Khóa người báo cáo (user:<id> | guest:<hash> | auto:keyword) để chống báo cáo lặp/hàng loạt. */
  reporterKey: text('reporter_key').notNull(),
  isAuto: boolean('is_auto').notNull().default(false),
  state: text('state').$type<ReportState>().notNull().default('pending'),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: ts('resolved_at'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('reports_unique_reporter').on(t.targetType, t.targetId, t.reporterKey), index('reports_state_idx').on(t.state, t.createdAt.desc())]);

export const hotTopics = pgTable('hot_topics', {
  id: id(),
  title: text('title').notNull(),
  hashtag: text('hashtag'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const sensitiveKeywords = pgTable('sensitive_keywords', {
  id: id(),
  keyword: text('keyword').notNull().unique(),
  action: text('action').$type<KeywordAction>().notNull(),
});

export const notifications = pgTable('notifications', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<NotificationType>().notNull(),
  params: jsonb('params').notNull(),
  readAt: ts('read_at'),
  createdAt: createdAt(),
}, (t) => [index('notifications_user_idx').on(t.userId, t.createdAt.desc())]);

export const missions = pgTable('missions', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  period: text('period').$type<MissionPeriod>().notNull(),
  action: text('action').$type<MissionAction>().notNull(),
  target: integer('target').notNull(),
  /** Điểm thưởng khi hoàn thành nhiệm vụ trong kỳ (0 = không thưởng). */
  rewardPoints: integer('reward_points').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const challenges = pgTable('challenges', {
  id: id(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  action: text('action').$type<MissionAction>().notNull(),
  target: integer('target').notNull(),
  scope: text('scope').$type<ChallengeScope>().notNull(),
  startsAt: ts('starts_at').notNull(),
  endsAt: ts('ends_at').notNull(),
  active: boolean('active').notNull().default(true),
});

export const events = pgTable('events', {
  id: id(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  coverUrl: text('cover_url'),
  startsAt: ts('starts_at').notNull(),
  endsAt: ts('ends_at').notNull(),
  active: boolean('active').notNull().default(true),
});

export const levels = pgTable('levels', {
  id: id(),
  level: integer('level').notNull().unique(),
  name: text('name').notNull(),
  minPoints: integer('min_points').notNull(),
});

export const badges = pgTable('badges', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  iconKey: text('icon_key').$type<IconKey>().notNull(),
  conditionType: text('condition_type').$type<BadgeCondition>().notNull(),
  threshold: integer('threshold').notNull(),
  active: boolean('active').notNull().default(true),
});

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: id(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  objectType: text('object_type').notNull(),
  objectId: text('object_id'),
  createdAt: createdAt(),
}, (t) => [index('audit_created_idx').on(t.createdAt.desc())]);

/** Hàng nút hành động ở trang chủ (Kể khổ, Khoe doanh thu, Gửi vía…), cấu hình ở web admin. */
export const homeActions = pgTable('home_actions', {
  id: id(),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  subLabel: text('sub_label').notNull().default(''),
  iconUrl: text('icon_url'),
  kind: text('kind').$type<HomeActionKind>().notNull(),
  href: text('href'),
  showMobile: boolean('show_mobile').notNull().default(true),
  showTablet: boolean('show_tablet').notNull().default(true),
  showDesktop: boolean('show_desktop').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  /** Thứ tự riêng trên iPad / máy tính (trống = theo sortOrder): thiết kế mỗi cỡ màn xếp nút khác nhau. */
  sortTablet: integer('sort_tablet'),
  sortDesktop: integer('sort_desktop'),
  active: boolean('active').notNull().default(true),
});

export const homeFooterLinks = pgTable('home_footer_links', {
  id: id(),
  groupName: text('group_name').notNull(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

/** Ô cửa hàng trên Phố Chốt Vía: vùng bấm trên ảnh phố (%) và vị trí trong cảnh WebGL. */
export const streetSlots = pgTable('street_slots', {
  id: id(),
  label: text('label').notNull(),
  placeId: uuid('place_id').references(() => places.id, { onDelete: 'set null' }),
  sceneTemplateId: uuid('scene_template_id').notNull().references(() => sceneTemplates.id),
  imageX: real('image_x').notNull().default(0),
  imageY: real('image_y').notNull().default(0),
  imageW: real('image_w').notNull().default(10),
  imageH: real('image_h').notNull().default(10),
  posX: real('pos_x').notNull().default(0),
  posZ: real('pos_z').notNull().default(0),
  rotationDeg: real('rotation_deg').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});
