import { z } from 'zod';

const hour = z.number().int().min(0).max(23);

export const RangeDefSchema = z.object({
  code: z.string().min(1).max(20),
  minVnd: z.number().int().nonnegative().nullable(),
  maxVnd: z.number().int().positive().nullable(),
});
export type RangeDef = z.infer<typeof RangeDefSchema>;

/** Cài đặt hệ thống do admin chỉnh. Giá trị khởi tạo ở DEFAULT_SETTINGS. */
export const AppSettingsSchema = z.object({
  timeWindows: z.object({ morningStartHour: hour, afternoonStartHour: hour, eveningStartHour: hour }),
  campaignMode: z.boolean(),
  /** Hiện hay ẩn dữ liệu mẫu (tài khoản, bài, cửa hàng đánh dấu is_demo) trên các màn công khai. */
  showDemoData: z.boolean(),
  wishCounterTtlHours: z.number().int().min(1).max(168),
  storyMaxChars: z.number().int().min(50).max(5000),
  achievementMaxChars: z.number().int().min(50).max(5000),
  commentMaxChars: z.number().int().min(20).max(2000),
  wishMessageMaxChars: z.number().int().min(10).max(500),
  postMaxImages: z.number().int().min(0).max(10),
  imageMaxMb: z.number().min(0.5).max(20),
  hashtagMax: z.number().int().min(0).max(10),
  achievementRanges: z.object({ ownerRevenue: z.array(RangeDefSchema), saleDeal: z.array(RangeDefSchema) }),
  hot: z.object({
    halfLifeHours: z.number().min(1).max(720),
    windowDays: z.number().int().min(1).max(60),
    weights: z.object({ reaction: z.number(), comment: z.number(), wish: z.number(), share: z.number() }),
  }),
  leaderboard: z.object({ maxMembers: z.number().int().min(5).max(500), defaultVisible: z.number().int().min(1).max(50) }),
  rateLimits: z.object({
    wishPerMinute: z.number().int().min(1),
    postPerHour: z.number().int().min(1),
    commentPerMinute: z.number().int().min(1),
    reportPerDay: z.number().int().min(1),
  }),
  moderation: z.object({ escalateReportCount: z.number().int().min(1) }),
  /** Điểm từ tương tác bài viết (quyết định 26/11/2026): mỗi người khác tương tác lần đầu với bài mang lại `pointsPerInteraction` điểm cho chủ bài, tối đa `dailyCap` điểm/ngày (giờ Việt Nam). */
  postEngagement: z.object({ dailyCap: z.number().int().min(1).max(1000), pointsPerInteraction: z.number().int().min(0).max(100) }),
  /** Giờ bắt đầu thẻ "Hôm nay thế nào rồi?" ở trang chủ; kéo dài tới giờ bắt đầu buổi tối. */
  reflectStartHour: hour,
  /** Số nhiệm vụ hiện trên thẻ "Thử thách tuần" (trang chủ và Phố 3D). */
  challengeCardCount: z.number().int().min(1).max(10),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

/** Phần cài đặt công khai cho frontend. */
export const PublicSettingsSchema = AppSettingsSchema.pick({
  timeWindows: true, campaignMode: true, wishCounterTtlHours: true, storyMaxChars: true, achievementMaxChars: true,
  commentMaxChars: true, wishMessageMaxChars: true, postMaxImages: true, imageMaxMb: true, hashtagMax: true,
  achievementRanges: true, leaderboard: true, reflectStartHour: true, challengeCardCount: true,
});
export type PublicSettings = z.infer<typeof PublicSettingsSchema>;

const M = 1_000_000;
/** Giá trị khởi tạo: mức thành tích theo quyết định C5, còn lại là giá trị mặc định kỹ thuật (admin chỉnh được). */
export const DEFAULT_SETTINGS: AppSettings = {
  timeWindows: { morningStartHour: 6, afternoonStartHour: 11, eveningStartHour: 21 },
  campaignMode: false,
  showDemoData: true,
  wishCounterTtlHours: 24,
  storyMaxChars: 500,
  achievementMaxChars: 500,
  commentMaxChars: 300,
  wishMessageMaxChars: 120,
  postMaxImages: 4,
  imageMaxMb: 5,
  hashtagMax: 5,
  achievementRanges: {
    ownerRevenue: [
      { code: 'r1', minVnd: null, maxVnd: 1 * M },
      { code: 'r2', minVnd: 1 * M, maxVnd: 5 * M },
      { code: 'r3', minVnd: 5 * M, maxVnd: 10 * M },
      { code: 'r4', minVnd: 10 * M, maxVnd: 30 * M },
      { code: 'r5', minVnd: 30 * M, maxVnd: 50 * M },
      { code: 'r6', minVnd: 50 * M, maxVnd: null },
    ],
    saleDeal: [
      { code: 'r1', minVnd: null, maxVnd: 5 * M },
      { code: 'r2', minVnd: 5 * M, maxVnd: 20 * M },
      { code: 'r3', minVnd: 20 * M, maxVnd: 50 * M },
      { code: 'r4', minVnd: 50 * M, maxVnd: 100 * M },
      { code: 'r5', minVnd: 100 * M, maxVnd: 500 * M },
      { code: 'r6', minVnd: 500 * M, maxVnd: null },
    ],
  },
  hot: { halfLifeHours: 24, windowDays: 7, weights: { reaction: 1, comment: 2, wish: 1.5, share: 3 } },
  leaderboard: { maxMembers: 100, defaultVisible: 5 },
  rateLimits: { wishPerMinute: 20, postPerHour: 20, commentPerMinute: 10, reportPerDay: 20 },
  moderation: { escalateReportCount: 3 },
  postEngagement: { dailyCap: 50, pointsPerInteraction: 1 },
  reflectStartHour: 17,
  challengeCardCount: 3,
};
