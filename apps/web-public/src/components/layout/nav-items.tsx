import { Briefcase, Flame, Home, MessageCircle, Trophy, Users, Store, Handshake, CalendarDays, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem { key: string; href: string; icon: ReactNode; /** Nhãn đầy đủ dùng khi màn đủ rộng (thiết kế desktop ghi "Bảng xếp hạng"). */ fullLabelKey?: NavItem['labelKey']; labelKey: 'home' | 'street' | 'streetFull' | 'feed' | 'events' | 'leaderboard' | 'profile' | 'story' | 'brag' | 'community' | 'eventsShort' | 'leaderboardShort' }

const icon = 'size-5';
export const TOP_NAV: NavItem[] = [
  { key: 'home', href: '/', icon: <Home className={icon} />, labelKey: 'home' },
  { key: 'street', href: '/pho-3d', icon: <Store className={icon} />, labelKey: 'street' },
  { key: 'feed', href: '/bang-tin', icon: <MessageCircle className={icon} />, labelKey: 'feed' },
  { key: 'leaderboard', href: '/bang-xep-hang', icon: <Trophy className={icon} />, labelKey: 'leaderboardShort', fullLabelKey: 'leaderboard' },
  { key: 'events', href: '/su-kien', icon: <CalendarDays className={icon} />, labelKey: 'eventsShort' },
];

/** Menu trái (desktop): giữ các mục theo thiết kế sau khi bỏ "Khám phá". Kể khổ/Khoe là bộ lọc của cùng một bảng tin. */
export const SIDE_NAV: NavItem[] = [
  { key: 'home', href: '/', icon: <Home className={icon} />, labelKey: 'home' },
  { key: 'street', href: '/pho-3d', icon: <Store className={icon} />, labelKey: 'streetFull' },
  { key: 'story', href: '/bang-tin?type=story', icon: <Flame className={icon} />, labelKey: 'story' },
  { key: 'brag', href: '/bang-tin?type=brag', icon: <Handshake className={icon} />, labelKey: 'brag' },
  { key: 'events', href: '/su-kien', icon: <Briefcase className={icon} />, labelKey: 'events' },
  { key: 'leaderboard', href: '/bang-xep-hang', icon: <Trophy className={icon} />, labelKey: 'leaderboard' },
  { key: 'community', href: '/bang-tin', icon: <Users className={icon} />, labelKey: 'community' },
];

export const PROFILE_ICON = <UserRound className={icon} />;
