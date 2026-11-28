import type { DisplayMode, MemberRole, PostType, TimeBucket } from '@xin-via/shared';

/** Sự kiện đo lường (SRS mục 16). Chỉ gửi thuộc tính đã khai báo: không có số điện thoại, nội dung Kể khổ hay số tiền. */
export interface AnalyticsEvents {
  home_view: { member: boolean; device: 'mobile' | 'tablet' | 'desktop' };
  wish_open: { target: 'deity' | 'place'; time_bucket: TimeBucket; entrypoint: string };
  wish_received: { target: 'deity' | 'place'; member: boolean; offline: boolean };
  place_visit: { place_id: string; mode: '2d' | '3d' };
  wish_sent_place: { place_id: string; auto_reply: boolean };
  story_compose: { draft_length: number; login_gate_seen: boolean };
  achievement_compose: { role: MemberRole; display_mode: DisplayMode; login_gate_seen: boolean };
  post_published: { post_type: PostType; role: MemberRole | null };
  signup_after_action: { trigger_action: string; completed: boolean };
  feed_engagement: { post_type: PostType; action: 'reaction' | 'comment' | 'share' | 'wish' };
}

type Posthog = typeof import('posthog-js').default;
let client: Posthog | null = null;

/** PostHog Cloud (EU): không cookie (persistence memory), không tự động bắt sự kiện, không ghi hình màn hình. */
export async function initAnalytics(): Promise<void> {
  const key = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
  if (!key || client) return;
  const { default: posthog } = await import('posthog-js');
  posthog.init(key, {
    api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://eu.i.posthog.com',
    persistence: 'memory', autocapture: false, capture_pageview: false, disable_session_recording: true,
    person_profiles: 'identified_only', ip: false,
  });
  client = posthog;
}

export function track<K extends keyof AnalyticsEvents>(event: K, props: AnalyticsEvents[K]): void {
  client?.capture(event, props);
}

export function deviceClass(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth;
  return w < 768 ? 'mobile' : w < 1280 ? 'tablet' : 'desktop';
}
