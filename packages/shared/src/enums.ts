/** Mọi tập giá trị nghiệp vụ khai báo một chỗ; kiểu suy ra từ mảng `as const`. */
export const ACCOUNT_ROLES = ['member', 'moderator', 'admin'] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'banned'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Vai trò kinh doanh: Chủ quán / Sale (SRS FR-08). */
export const MEMBER_ROLES = ['owner', 'sale'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const PLACE_KINDS = ['store', 'sale_office'] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export const PLACE_STATUSES = ['visible', 'hidden'] as const;
export type PlaceStatus = (typeof PLACE_STATUSES)[number];

export const SCENE_MODEL_KEYS = ['cafe', 'fashion', 'minimart', 'restaurant', 'pharmacy', 'retail', 'sale_office', 'generic'] as const;
export type SceneModelKey = (typeof SCENE_MODEL_KEYS)[number];

export const HOME_ACTION_KINDS = ['wish', 'story', 'brag', 'link'] as const;
export type HomeActionKind = (typeof HOME_ACTION_KINDS)[number];

export const POST_TYPES = ['story', 'achievement', 'wish_share'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_STATUSES = ['published', 'hidden', 'removed'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const COMMENT_STATUSES = ['published', 'hidden'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

/** Bộ lọc feed: story=Kể khổ, brag=mọi bài Khoe, revenue=Khoe doanh thu (chủ quán), deal=Khoe deal (sale), wish=Xin vía. */
export const FEED_TYPES = ['all', 'story', 'brag', 'revenue', 'deal', 'wish'] as const;
export type FeedType = (typeof FEED_TYPES)[number];

export const FEED_SORTS = ['new', 'hot', 'following'] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

export const REACTION_TYPES = ['like', 'love', 'haha'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const OWNER_METRICS = ['revenue', 'orders', 'best_day', 'milestone'] as const;
export const SALE_METRICS = ['deal', 'contract', 'kpi', 'customers'] as const;
export const METRIC_TYPES = [...OWNER_METRICS, ...SALE_METRICS] as const;
export type MetricType = (typeof METRIC_TYPES)[number];
/** Chỉ số tính bằng tiền (VND); các chỉ số còn lại là số đếm. */
export const MONEY_METRICS: readonly MetricType[] = ['revenue', 'deal', 'contract', 'best_day'];
/** Chỉ số có thể hiển thị theo khoảng (mức C5): doanh thu ngày của chủ quán, giá trị deal của sale. */
export const RANGE_METRICS: readonly MetricType[] = ['revenue', 'deal'];

/** Mặc định `hidden` (UX-07). `range` = chỉ hiện khoảng, `exact` = hiện số. */
export const DISPLAY_MODES = ['hidden', 'range', 'exact'] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

export const VERIFICATION_STATUSES = ['self_declared'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const REPORT_REASONS = ['spam', 'offensive', 'scam', 'misinformation', 'personal_info', 'inappropriate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_TARGETS = ['post', 'comment', 'place'] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];
export const REPORT_STATES = ['pending', 'resolved', 'dismissed'] as const;
export type ReportState = (typeof REPORT_STATES)[number];
export const REPORT_ACTIONS = ['dismiss', 'keep', 'hide', 'remove', 'ban_author'] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];

export const WISH_SOURCES = ['deity', 'place', 'post'] as const;
export type WishSource = (typeof WISH_SOURCES)[number];
export const WISH_TEMPLATE_SOURCES = ['deity', 'auto_reply', 'system_thanks', 'offline'] as const;
export type WishTemplateSource = (typeof WISH_TEMPLATE_SOURCES)[number];
export const TIME_BUCKETS = ['morning', 'afternoon', 'evening'] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];
export const WISH_TITLE_CODES = ['today', 'morning', 'afternoon', 'evening'] as const;
export type WishTitleCode = (typeof WISH_TITLE_CODES)[number];

/** Hành động ghi điểm (+1 mỗi lần thành công) — chỉ 3 nguồn theo quyết định đã chốt. */
export const POINT_ACTIONS = ['deity_wish', 'place_wish_store', 'place_wish_sale'] as const;
export type PointAction = (typeof POINT_ACTIONS)[number];

export const MISSION_ACTIONS = ['deity_wish', 'place_wish', 'visit_place', 'publish_post', 'react_post', 'comment_post'] as const;
export type MissionAction = (typeof MISSION_ACTIONS)[number];
export const MISSION_PERIODS = ['daily', 'weekly'] as const;
export type MissionPeriod = (typeof MISSION_PERIODS)[number];
export const CHALLENGE_SCOPES = ['personal', 'community'] as const;
export type ChallengeScope = (typeof CHALLENGE_SCOPES)[number];

export const BADGE_CONDITIONS = ['total_points', 'deity_wishes', 'place_wishes'] as const;
export type BadgeCondition = (typeof BADGE_CONDITIONS)[number];

export const OAUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const NOTIFICATION_TYPES = ['place_wished', 'post_commented', 'post_reacted', 'new_follower', 'post_removed', 'report_resolved'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const KEYWORD_ACTIONS = ['block', 'review'] as const;
export type KeywordAction = (typeof KEYWORD_ACTIONS)[number];

/** Khóa icon do admin chọn; hiển thị do giao diện ánh xạ (packages/ui). */
export const ICON_KEYS = [
  'fire', 'chart', 'handshake', 'target', 'clover', 'heart', 'gold', 'flower', 'star', 'sun', 'moon', 'calendar',
  'coffee', 'shirt', 'cart', 'briefcase', 'fork', 'spa', 'store', 'trophy', 'crown', 'sparkles', 'users', 'smile',
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

/** Biểu tượng cảm xúc cho bài Kể khổ (sticker). */
export const STORY_STICKERS = ['😂', '😭', '😤', '🥲', '😅', '🙏', '💪', '🤯'] as const;
export type StorySticker = (typeof STORY_STICKERS)[number];

export const ANIMATION_KEYS = ['coins', 'sparkle', 'fireworks', 'glow'] as const;
export type AnimationKey = (typeof ANIMATION_KEYS)[number];
