import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gt, gte, ilike, or, sql } from 'drizzle-orm';
import {
  maskPhone, POST_ENGAGEMENT_DAILY_CAP, vnDayStart, type LeaderboardDto, type MeDto, type MeStats, type PublicProfile, type UpdateMeBody, type UserSummary,
} from '@chot-via/shared';
import { DomainError } from '../../common/domain-error';
import { iso, levelFor, nextLevelFor, userSummary } from '../../common/mappers';
import { SettingsService } from '../../common/settings.service';
import { DB, type Db } from '../../database/database';
import { pointLedger, posts, userBlocks, userFollows, users } from '../../database/schema';
import { LevelsService } from '../gamification/levels.service';
import { NotificationsService } from '../notifications/notifications.service';

const summaryColumns = { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, memberRole: users.memberRole, jobTitle: users.jobTitle, points: users.points };

@Injectable()
export class UsersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(LevelsService) private readonly levels: LevelsService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async me(userId: string): Promise<MeDto> {
    const [u] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!u) throw new DomainError('USER_NOT_FOUND');
    const levels = await this.levels.all();
    return {
      ...userSummary(u, levels), accountRole: u.accountRole, phoneMasked: u.phone ? maskPhone(u.phone) : null, points: u.points,
      province: u.province, bio: u.bio, createdAt: iso(u.createdAt),
    };
  }

  async updateMe(userId: string, input: UpdateMeBody): Promise<MeDto> {
    await this.db.update(users).set(input).where(eq(users.id, userId));
    return this.me(userId);
  }

  private async counts(userId: string): Promise<{ posts: number; followers: number; following: number }> {
    const [p] = await this.db.select({ n: count() }).from(posts).where(and(eq(posts.authorId, userId), eq(posts.status, 'published')));
    const [f] = await this.db.select({ n: count() }).from(userFollows).where(eq(userFollows.followeeId, userId));
    const [g] = await this.db.select({ n: count() }).from(userFollows).where(eq(userFollows.followerId, userId));
    return { posts: p?.n ?? 0, followers: f?.n ?? 0, following: g?.n ?? 0 };
  }

  async rankOf(points: number, updatedAt: Date, maxMembers: number): Promise<number | null> {
    if (points <= 0) return null;
    const [row] = await this.db.select({ n: count() }).from(users).where(and(
      eq(users.status, 'active'), or(gt(users.points, points), and(eq(users.points, points), sql`${users.pointsUpdatedAt} < ${updatedAt.toISOString()}`)),
    ));
    const rank = (row?.n ?? 0) + 1;
    return rank <= maxMembers ? rank : null;
  }

  async stats(userId: string): Promise<MeStats> {
    const [u] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!u) throw new DomainError('USER_NOT_FOUND');
    const [levels, badges, wishCounts, counts, s] = await Promise.all([
      this.levels.all(), this.levels.badgesFor(userId, u.points), this.levels.wishCounts(userId), this.counts(userId), this.settings.get(),
    ]);
    return {
      points: u.points, level: levelFor(levels, u.points), nextLevel: nextLevelFor(levels, u.points), badges,
      rank: await this.rankOf(u.points, u.pointsUpdatedAt, s.leaderboard.maxMembers), wishCounts, counts,
      engagement: { today: await this.engagementToday(userId), cap: POST_ENGAGEMENT_DAILY_CAP },
    };
  }

  /** Điểm tương tác bài viết đã nhận trong ngày giờ Việt Nam hiện tại (chỉ nguồn `post_engagement`). */
  private async engagementToday(userId: string): Promise<number> {
    const [row] = await this.db.select({ n: sql<number>`coalesce(sum(${pointLedger.points}), 0)::int` }).from(pointLedger)
      .where(and(eq(pointLedger.userId, userId), eq(pointLedger.action, 'post_engagement'), gte(pointLedger.createdAt, vnDayStart(new Date()))));
    return row?.n ?? 0;
  }

  async publicProfile(id: string, viewerId: string | null): Promise<PublicProfile> {
    const [u] = await this.db.select().from(users).where(and(eq(users.id, id), eq(users.status, 'active'))).limit(1);
    if (!u) throw new DomainError('USER_NOT_FOUND');
    const levels = await this.levels.all();
    let viewer: PublicProfile['viewer'] = null;
    if (viewerId) {
      const [f] = await this.db.select({ n: count() }).from(userFollows).where(and(eq(userFollows.followerId, viewerId), eq(userFollows.followeeId, id)));
      const [b] = await this.db.select({ n: count() }).from(userBlocks).where(and(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, id)));
      viewer = { following: (f?.n ?? 0) > 0, blocked: (b?.n ?? 0) > 0 };
    }
    return {
      ...userSummary(u, levels), points: u.points, province: u.province, bio: u.bio, badges: await this.levels.badgesFor(id, u.points),
      counts: await this.counts(id), viewer, createdAt: iso(u.createdAt),
    };
  }

  async setFollow(followerId: string, followeeId: string, on: boolean): Promise<{ following: boolean; followers: number }> {
    if (followerId === followeeId) throw new DomainError('USER_SELF_ACTION');
    const [target] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, followeeId)).limit(1);
    if (!target) throw new DomainError('USER_NOT_FOUND');
    if (on) {
      const ins = await this.db.insert(userFollows).values({ followerId, followeeId }).onConflictDoNothing().returning({ id: userFollows.followerId });
      if (ins.length) {
        const [actor] = await this.db.select({ n: users.displayName }).from(users).where(eq(users.id, followerId));
        await this.notifications.push(followeeId, 'new_follower', { userId: followerId, actorName: actor?.n ?? '' });
      }
    } else {
      await this.db.delete(userFollows).where(and(eq(userFollows.followerId, followerId), eq(userFollows.followeeId, followeeId)));
    }
    const [f] = await this.db.select({ n: count() }).from(userFollows).where(eq(userFollows.followeeId, followeeId));
    return { following: on, followers: f?.n ?? 0 };
  }

  async setBlock(blockerId: string, blockedId: string, on: boolean): Promise<boolean> {
    if (blockerId === blockedId) throw new DomainError('USER_SELF_ACTION');
    if (on) {
      await this.db.insert(userBlocks).values({ blockerId, blockedId }).onConflictDoNothing();
      await this.db.delete(userFollows).where(or(and(eq(userFollows.followerId, blockerId), eq(userFollows.followeeId, blockedId)), and(eq(userFollows.followerId, blockedId), eq(userFollows.followeeId, blockerId))));
    } else {
      await this.db.delete(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
    }
    return on;
  }

  async search(q: string, limit: number): Promise<UserSummary[]> {
    const levels = await this.levels.all();
    const rows = await this.db.select(summaryColumns).from(users).where(and(eq(users.status, 'active'), ilike(users.displayName, `%${q}%`))).orderBy(desc(users.points)).limit(limit);
    return rows.map((r) => userSummary(r, levels));
  }

  /** TOP thành viên theo tổng điểm cộng đồng (tối đa 100, mặc định hiện 5). Không xếp hạng theo doanh thu. */
  async leaderboard(limit: number, viewerId: string | null): Promise<LeaderboardDto> {
    const s = await this.settings.get();
    const size = Math.min(limit, s.leaderboard.maxMembers);
    const levels = await this.levels.all();
    const rows = await this.db.select(summaryColumns).from(users).where(and(eq(users.status, 'active'), gt(users.points, 0), s.showDemoData ? undefined : eq(users.isDemo, false)))
      .orderBy(desc(users.points), asc(users.pointsUpdatedAt)).limit(size);
    const [totalRow] = await this.db.select({ n: count() }).from(users).where(and(eq(users.status, 'active'), gt(users.points, 0), s.showDemoData ? undefined : eq(users.isDemo, false)));
    let me: LeaderboardDto['me'] = null;
    if (viewerId) {
      const [u] = await this.db.select().from(users).where(eq(users.id, viewerId)).limit(1);
      if (u) me = { rank: await this.rankOf(u.points, u.pointsUpdatedAt, s.leaderboard.maxMembers), points: u.points };
    }
    return {
      items: rows.map((r, i) => ({ rank: i + 1, user: userSummary(r, levels), points: r.points })),
      total: Math.min(totalRow?.n ?? 0, s.leaderboard.maxMembers), me,
    };
  }
}
