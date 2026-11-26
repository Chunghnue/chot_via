import { Controller, Get, Inject } from '@nestjs/common';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { and, asc, count, countDistinct, desc, eq, gte, lte } from 'drizzle-orm';
import {
  vnDayStart, vnWeekStart, type ActivityItem, type ChallengeDto, type EventDto, type MissionAction, type MissionDto,
} from '@chot-via/shared';
import { Ctx, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { iso } from '../../common/mappers';
import { DB, type Db } from '../../database/database';
import { PointsService } from './points.service';
import { challenges, comments, events, missions, placeVisits, places, posts, reactions, users, wishEvents } from '../../database/schema';

@Controller()
export class GamificationController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(PointsService) private readonly points: PointsService,
  ) {}

  /** Tiến độ nhiệm vụ. Khách thấy danh sách, progress = null. Thành viên hoàn thành nhiệm vụ có điểm thưởng thì được cộng đúng một lần mỗi kỳ (ghi nhận khi xem danh sách; chạy lại không cộng trùng). */
  private async progress(action: MissionAction, since: Date, userId: string | null): Promise<number> {
    const mine = (col: PgColumn, value: string | null) => (value ? eq(col, value) : undefined);
    switch (action) {
      case 'deity_wish': {
        const [r] = await this.db
          .select({ n: count() })
          .from(wishEvents)
          .where(and(eq(wishEvents.source, 'deity'), gte(wishEvents.createdAt, since), mine(wishEvents.actorUserId, userId)));
        return r?.n ?? 0;
      }
      case 'place_wish': {
        const [r] = await this.db
          .select({ n: count() })
          .from(wishEvents)
          .where(and(eq(wishEvents.source, 'place'), gte(wishEvents.createdAt, since), mine(wishEvents.actorUserId, userId)));
        return r?.n ?? 0;
      }
      case 'visit_place': {
        const [r] = await this.db
          .select({ n: countDistinct(placeVisits.placeId) })
          .from(placeVisits)
          .where(and(gte(placeVisits.createdAt, since), mine(placeVisits.userId, userId)));
        return r?.n ?? 0;
      }
      case 'publish_post': {
        const [r] = await this.db
          .select({ n: count() })
          .from(posts)
          .where(and(eq(posts.status, 'published'), gte(posts.createdAt, since), mine(posts.authorId, userId)));
        return r?.n ?? 0;
      }
      case 'react_post': {
        const [r] = await this.db
          .select({ n: count() })
          .from(reactions)
          .where(and(gte(reactions.createdAt, since), mine(reactions.userId, userId)));
        return r?.n ?? 0;
      }
      case 'comment_post': {
        const [r] = await this.db
          .select({ n: count() })
          .from(comments)
          .where(and(gte(comments.createdAt, since), mine(comments.userId, userId)));
        return r?.n ?? 0;
      }
    }
  }

  @Get('missions')
  async missionList(@Ctx() ctx: RequestContext) {
    const rows = await this.db.select().from(missions).where(eq(missions.active, true)).orderBy(asc(missions.sortOrder));
    const now = new Date();
    const items: MissionDto[] = [];
    for (const m of rows) {
      const since = m.period === 'daily' ? vnDayStart(now) : vnWeekStart(now);
      const progress = ctx.user ? Math.min(await this.progress(m.action, since, ctx.user.id), m.target) : null;
      const completed = progress !== null && progress >= m.target;
      if (ctx.user && completed && m.rewardPoints > 0) {
        const userId = ctx.user.id;
        await this.db.transaction((tx) => this.points.awardMission(tx, userId, m.id, since.toISOString(), m.rewardPoints));
      }
      items.push({
        id: m.id,
        code: m.code,
        name: m.name,
        description: m.description,
        period: m.period,
        action: m.action,
        target: m.target,
        rewardPoints: m.rewardPoints,
        progress,
        completed,
      });
    }
    return ok('OK', items);
  }

  @Get('challenges/current')
  async currentChallenge(@Ctx() ctx: RequestContext) {
    const now = new Date();
    const [c] = await this.db
      .select()
      .from(challenges)
      .where(and(eq(challenges.active, true), lte(challenges.startsAt, now), gte(challenges.endsAt, now)))
      .orderBy(desc(challenges.startsAt))
      .limit(1);
    if (!c) return ok('OK', null);
    const userId = c.scope === 'personal' ? (ctx.user?.id ?? null) : null;
    const hasProgress = c.scope === 'community' || ctx.user !== null;
    const progress = hasProgress ? Math.min(await this.progress(c.action, c.startsAt, userId), c.target) : null;
    const dto: ChallengeDto = { id: c.id, name: c.name, description: c.description, action: c.action, target: c.target, scope: c.scope, progress, endsAt: iso(c.endsAt) };
    return ok('OK', dto);
  }

  @Get('events')
  async eventList() {
    const rows = await this.db
      .select()
      .from(events)
      .where(and(eq(events.active, true), gte(events.endsAt, new Date())))
      .orderBy(asc(events.startsAt));
    const items: EventDto[] = rows.map((e) => ({ id: e.id, title: e.title, description: e.description, coverUrl: e.coverUrl, startsAt: iso(e.startsAt), endsAt: iso(e.endsAt) }));
    return ok('OK', items);
  }

  /** Hoạt động mới (cột phải): không lộ danh tính khách. */
  @Get('activity')
  async activity() {
    const wishRows = await this.db
      .select({ e: wishEvents, title: places.title, slug: places.slug, actor: users.displayName })
      .from(wishEvents)
      .innerJoin(places, eq(wishEvents.targetPlaceId, places.id))
      .leftJoin(users, eq(wishEvents.actorUserId, users.id))
      .where(and(eq(wishEvents.source, 'place'), eq(places.status, 'visible')))
      .orderBy(desc(wishEvents.createdAt))
      .limit(8);
    const postRows = await this.db
      .select({ p: posts, actor: users.displayName })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.createdAt))
      .limit(8);
    const items: ActivityItem[] = [
      ...wishRows.map((r): ActivityItem => ({ kind: 'place_wished', id: r.e.id, createdAt: iso(r.e.createdAt), actorName: r.actor, placeTitle: r.title, placeSlug: r.slug })),
      ...postRows.map((r): ActivityItem => ({ kind: 'post_published', id: r.p.id, createdAt: iso(r.p.createdAt), actorName: r.actor, postId: r.p.id, postType: r.p.type })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
    return ok('OK', items);
  }
}
