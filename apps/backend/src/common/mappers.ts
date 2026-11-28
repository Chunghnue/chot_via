import type { LevelDto, UserSummary, MemberRole } from '@xin-via/shared';

export interface UserRow { id: string; displayName: string; avatarUrl: string | null; memberRole: MemberRole | null; jobTitle: string | null; points: number }

/** Cấp độ cao nhất mà tổng điểm đạt tới (ngưỡng do admin cấu hình, không có mặc định). */
export function levelFor(levels: LevelDto[], points: number): LevelDto | null {
  let current: LevelDto | null = null;
  for (const level of levels) if (level.minPoints <= points) current = level;
  return current;
}

export function nextLevelFor(levels: LevelDto[], points: number): LevelDto | null {
  return levels.find((level) => level.minPoints > points) ?? null;
}

export function userSummary(user: UserRow, levels: LevelDto[]): UserSummary {
  return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, memberRole: user.memberRole, jobTitle: user.jobTitle, level: levelFor(levels, user.points) };
}

export const iso = (date: Date): string => date.toISOString();
