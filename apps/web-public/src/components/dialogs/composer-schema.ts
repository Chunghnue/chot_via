import { DISPLAY_MODES, MEMBER_ROLES, METRIC_TYPES, STORY_STICKERS, type AppSettings, type PublicSettings } from '@chot-via/shared';
import { z } from 'zod';
import { COMPOSER_KINDS, type ComposerDraft } from '@/features/composer/composerSlice';

export type Settings = PublicSettings | AppSettings;

/** Kiểm tra bản nháp bài đăng theo cài đặt (giới hạn ký tự, khoảng giá trị, số tiền, lựa chọn bình chọn). */
export function buildSchema(s: Settings) {
  return z.object({
    kind: z.enum(COMPOSER_KINDS),
    body: z.string(),
    sticker: z.enum(STORY_STICKERS).nullable(),
    hashtags: z.array(z.string()),
    location: z.string(),
    media: z.array(z.object({ id: z.string(), url: z.string() })),
    pollEnabled: z.boolean(),
    pollOptions: z.array(z.string()),
    role: z.enum(MEMBER_ROLES),
    metricType: z.enum(METRIC_TYPES),
    displayMode: z.enum(DISPLAY_MODES),
    rangeCode: z.string().nullable(),
    amount: z.string(),
    wishTypeId: z.string().nullable(),
  }).superRefine((v, ctx) => {
    const issue = (path: string, message: string): void => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    const max = v.kind === 'brag' ? s.achievementMaxChars : s.storyMaxChars;
    const length = v.body.trim().length;
    if (length === 0) issue('body', 'required');
    if (length > max) issue('body', 'too_big');
    if (v.kind === 'brag' && v.displayMode === 'range' && !v.rangeCode) issue('rangeCode', 'required');
    if (v.kind === 'brag' && v.displayMode === 'exact' && !(Number(v.amount) > 0)) issue('amount', 'required');
    if (v.kind === 'story' && v.pollEnabled && v.pollOptions.filter((o) => o.trim()).length < 2) issue('pollOptions', 'required');
  });
}

/** Đổi bản nháp thành nội dung gửi API (đúng theo loại bài; cắt khoảng trắng, bỏ số tiền khi không hiện số cụ thể). */
export function toCandidate(v: ComposerDraft): unknown {
  const body = v.body.trim();
  const location = v.location.trim() || null;
  const common = { body, location, hashtags: v.hashtags, mediaIds: v.media.map((m) => m.id) };
  if (v.kind === 'story') {
    const poll = v.pollEnabled ? { options: v.pollOptions.map((o) => o.trim()).filter(Boolean) } : null;
    return { type: 'story', ...common, sticker: v.sticker, poll };
  }
  if (v.kind === 'wish') return { type: 'wish_share', ...common, wishTypeId: v.wishTypeId };
  return {
    type: 'achievement', ...common, role: v.role, metricType: v.metricType, displayMode: v.displayMode,
    rangeCode: v.displayMode === 'range' ? v.rangeCode : null, amount: v.displayMode === 'exact' ? Number(v.amount) : null,
  };
}

/** Các mức giá trị "Chỉ hiện khoảng" theo vai trò (chủ quán: doanh thu, sale: deal). */
export function rangesFor(role: ComposerDraft['role'], settings: Settings) {
  return role === 'owner' ? settings.achievementRanges.ownerRevenue : settings.achievementRanges.saleDeal;
}
