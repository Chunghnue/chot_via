import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import {
  maskPhone, type AdminCommentDto, type AdminListQuery, type ReportAction, type AdminReportDto, type AdminStatsDto, type AdminUserDto,
  type AdminUserUpdate, type AppSettings, type AuditLogDto, type PostDto, type ReportTarget,
} from '@chot-via/shared';
import type { RequestContext } from '../../common/access';
import { offsetOf, paged, type ApiPaged } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { iso, userSummary } from '../../common/mappers';
import { SettingsService } from '../../common/settings.service';
import { DB, type Db } from '../../database/database';
import { auditLogs, comments, places, posts, reports, users, wishEvents, wishTypes } from '../../database/schema';
import { LevelsService } from '../gamification/levels.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostsService } from '../posts/posts.service';

const author = { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, memberRole: users.memberRole, jobTitle: users.jobTitle, points: users.points };

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(LevelsService) private readonly levels: LevelsService,
    @Inject(PostsService) private readonly postsService: PostsService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async audit(actorId: string, action: string, objectType: string, objectId: string | null): Promise<void> {
    await this.db.insert(auditLogs).values({ actorId, action, objectType, objectId });
  }

  async stats(): Promise<AdminStatsDto> {
    const week = new Date(Date.now() - 7 * 86_400_000);
    const one = async (q: Promise<{ n: number }[]>): Promise<number> => (await q)[0]?.n ?? 0;
    const [members, newMembers7d, bannedMembers, postsTotal, posts7d, wishesTotal, wishes7d, placesTotal, pendingReports] = await Promise.all([
      one(this.db.select({ n: count() }).from(users)),
      one(this.db.select({ n: count() }).from(users).where(gte(users.createdAt, week))),
      one(this.db.select({ n: count() }).from(users).where(eq(users.status, 'banned'))),
      one(this.db.select({ n: count() }).from(posts)),
      one(this.db.select({ n: count() }).from(posts).where(gte(posts.createdAt, week))),
      one(this.db.select({ n: count() }).from(wishEvents)),
      one(this.db.select({ n: count() }).from(wishEvents).where(gte(wishEvents.createdAt, week))),
      one(this.db.select({ n: count() }).from(places)),
      one(this.db.select({ n: count() }).from(reports).where(eq(reports.state, 'pending'))),
    ]);
    return { members, newMembers7d, bannedMembers, postsTotal, posts7d, wishesTotal, wishes7d, placesTotal, pendingReports };
  }

  /* ---- Báo cáo & kiểm duyệt ---- */
  async reportList(query: AdminListQuery): Promise<ApiPaged<AdminReportDto>> {
    const s = await this.settings.get();
    const rows = await this.db.select({ r: reports, reporter: users.displayName }).from(reports).leftJoin(users, eq(reports.reporterUserId, users.id))
      .where(query.state ? eq(reports.state, query.state) : undefined).orderBy(desc(reports.createdAt)).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    const page = rows.slice(0, query.pageSize);
    const targetIds = [...new Set(page.map((x) => x.r.targetId))];
    const counts = targetIds.length
      ? await this.db.select({ id: reports.targetId, n: count() }).from(reports).where(and(inArray(reports.targetId, targetIds), eq(reports.state, 'pending'))).groupBy(reports.targetId)
      : [];
    const previews = await this.previews(page.map((x) => ({ type: x.r.targetType, id: x.r.targetId })));
    const items = page.map(({ r, reporter }): AdminReportDto => {
      const n = counts.find((c) => c.id === r.targetId)?.n ?? 0;
      return {
        id: r.id, targetType: r.targetType, targetId: r.targetId, reason: r.reason, detail: r.detail, state: r.state, reporterName: reporter, isAuto: r.isAuto,
        targetReportCount: n, escalated: n >= s.moderation.escalateReportCount, preview: previews.get(r.targetId) ?? { text: null, authorName: null, status: null }, createdAt: iso(r.createdAt),
      };
    });
    return paged(items, query.page, query.pageSize);
  }

  private async previews(targets: { type: ReportTarget; id: string }[]): Promise<Map<string, AdminReportDto['preview']>> {
    const map = new Map<string, AdminReportDto['preview']>();
    const ids = (t: ReportTarget): string[] => targets.filter((x) => x.type === t).map((x) => x.id);
    const [p, c, pl] = await Promise.all([
      ids('post').length
        ? this.db
            .select({ id: posts.id, text: posts.body, name: users.displayName, status: posts.status })
            .from(posts)
            .innerJoin(users, eq(posts.authorId, users.id))
            .where(inArray(posts.id, ids('post')))
        : [],
      ids('comment').length
        ? this.db
            .select({ id: comments.id, text: comments.body, name: users.displayName, status: comments.status })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(inArray(comments.id, ids('comment')))
        : [],
      ids('place').length
        ? this.db
            .select({ id: places.id, text: places.title, name: users.displayName, status: places.status })
            .from(places)
            .leftJoin(users, eq(places.ownerId, users.id))
            .where(inArray(places.id, ids('place')))
        : [],
    ]);
    for (const row of [...p, ...c, ...pl]) map.set(row.id, { text: row.text, authorName: row.name, status: row.status });
    return map;
  }

  private async authorOf(type: ReportTarget, id: string): Promise<string | null> {
    if (type === 'post') return (await this.db.select({ a: posts.authorId }).from(posts).where(eq(posts.id, id)))[0]?.a ?? null;
    if (type === 'comment') return (await this.db.select({ a: comments.userId }).from(comments).where(eq(comments.id, id)))[0]?.a ?? null;
    return (await this.db.select({ a: places.ownerId }).from(places).where(eq(places.id, id)))[0]?.a ?? null;
  }

  /** Admin ẩn/gỡ nội dung, khóa tài khoản theo chính sách; mọi báo cáo chờ trên cùng đối tượng được xử lý cùng lúc. */
  async actOnReport(reportId: string, action: ReportAction, actorId: string): Promise<void> {
    const [report] = await this.db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!report) throw new DomainError('COMMON_NOT_FOUND');
    const { targetType: type, targetId: id } = report;
    const removing = action === 'remove' || action === 'ban_author';
    if (action === 'hide' || removing) {
      if (type === 'post') await this.setPostStatus(id, removing ? 'removed' : 'hidden', actorId);
      if (type === 'comment') await this.setCommentStatus(id, 'hidden', actorId);
      if (type === 'place') await this.db.update(places).set({ status: 'hidden' }).where(eq(places.id, id));
    }
    if (action === 'ban_author') {
      const targetAuthor = await this.authorOf(type, id);
      if (targetAuthor) await this.db.update(users).set({ status: 'banned' }).where(eq(users.id, targetAuthor));
    }
    const pending = and(eq(reports.targetType, type), eq(reports.targetId, id), eq(reports.state, 'pending'));
    const toNotify = await this.db.select({ u: reports.reporterUserId }).from(reports).where(pending);
    await this.db.update(reports).set({ state: action === 'dismiss' ? 'dismissed' : 'resolved', resolvedBy: actorId, resolvedAt: new Date() }).where(pending);
    for (const userId of new Set(toNotify.flatMap((x) => (x.u ? [x.u] : [])))) await this.notifications.push(userId, 'report_resolved', { targetType: type });
    await this.audit(actorId, `report.${action}`, type, id);
  }

  /* ---- Bài viết / bình luận ---- */
  async postList(query: AdminListQuery, ctx: RequestContext): Promise<ApiPaged<PostDto>> {
    const where: SQL[] = [];
    if (query.q) where.push(ilike(posts.body, `%${query.q}%`));
    if (query.status === 'published' || query.status === 'hidden' || query.status === 'removed') where.push(eq(posts.status, query.status));
    const rows = await this.db.select({ post: posts, author, wt: wishTypes }).from(posts).innerJoin(users, eq(posts.authorId, users.id)).leftJoin(wishTypes, eq(posts.wishTypeId, wishTypes.id))
      .where(and(...where)).orderBy(desc(posts.createdAt)).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    const dtos = await this.postsService.hydrate(rows.slice(0, query.pageSize), ctx);
    return { code: 'OK', data: dtos, meta: { page: query.page, pageSize: query.pageSize, hasMore: rows.length > query.pageSize } };
  }

  async setPostStatus(id: string, status: 'published' | 'hidden' | 'removed', actorId: string): Promise<void> {
    const [row] = await this.db.update(posts).set({ status }).where(eq(posts.id, id)).returning({ authorId: posts.authorId });
    if (!row) throw new DomainError('POST_NOT_FOUND');
    if (status === 'removed') await this.notifications.push(row.authorId, 'post_removed', { postId: id });
    await this.audit(actorId, `post.${status}`, 'post', id);
  }

  async setPostPinned(id: string, pinned: boolean, actorId: string): Promise<void> {
    const [row] = await this.db.update(posts).set({ pinnedAt: pinned ? new Date() : null }).where(eq(posts.id, id)).returning({ id: posts.id });
    if (!row) throw new DomainError('POST_NOT_FOUND');
    await this.audit(actorId, pinned ? 'post.pin' : 'post.unpin', 'post', id);
  }

  async commentList(query: AdminListQuery): Promise<ApiPaged<AdminCommentDto>> {
    const levels = await this.levels.all();
    const where: SQL[] = [];
    if (query.q) where.push(ilike(comments.body, `%${query.q}%`));
    if (query.status === 'published' || query.status === 'hidden') where.push(eq(comments.status, query.status));
    const rows = await this.db.select({ c: comments, author }).from(comments).innerJoin(users, eq(comments.userId, users.id))
      .where(and(...where)).orderBy(desc(comments.createdAt)).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    return paged(
      rows.map((r): AdminCommentDto => ({
        id: r.c.id,
        postId: r.c.postId,
        body: r.c.body,
        author: userSummary(r.author, levels),
        status: r.c.status,
        createdAt: iso(r.c.createdAt),
      })),
      query.page,
      query.pageSize,
    );
  }

  async setCommentStatus(id: string, status: 'published' | 'hidden', actorId: string): Promise<void> {
    const [prev] = await this.db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!prev) throw new DomainError('COMMENT_NOT_FOUND');
    if (prev.status !== status) {
      await this.db.update(comments).set({ status }).where(eq(comments.id, id));
      const delta = status === 'hidden' ? sql`greatest(${posts.commentCount} - 1, 0)` : sql`${posts.commentCount} + 1`;
      await this.db.update(posts).set({ commentCount: delta }).where(eq(posts.id, prev.postId));
    }
    await this.audit(actorId, `comment.${status}`, 'comment', id);
  }

  /* ---- Người dùng ---- */
  async userList(query: AdminListQuery): Promise<ApiPaged<AdminUserDto>> {
    const where: SQL[] = [];
    if (query.q) where.push(or(ilike(users.displayName, `%${query.q}%`), ilike(users.phone, `%${query.q}%`)) ?? sql`true`);
    if (query.status === 'active' || query.status === 'banned') where.push(eq(users.status, query.status));
    const rows = await this.db.select().from(users).where(and(...where)).orderBy(desc(users.createdAt)).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    const items = rows.map((u): AdminUserDto => ({
      id: u.id, displayName: u.displayName, phoneMasked: u.phone ? maskPhone(u.phone) : null, accountRole: u.accountRole, status: u.status,
      memberRole: u.memberRole, points: u.points, createdAt: iso(u.createdAt),
    }));
    return paged(items, query.page, query.pageSize);
  }

  async updateUser(id: string, input: AdminUserUpdate, actorId: string, actorIsAdmin: boolean): Promise<void> {
    if (id === actorId) throw new DomainError('USER_SELF_ACTION');
    if (input.accountRole && !actorIsAdmin) throw new DomainError('COMMON_FORBIDDEN');
    const [row] = await this.db.update(users).set(input).where(eq(users.id, id)).returning({ id: users.id });
    if (!row) throw new DomainError('USER_NOT_FOUND');
    await this.audit(actorId, 'user.update', 'user', id);
  }

  /* ---- Cài đặt & nhật ký ---- */
  async saveSettings(settings: AppSettings, actorId: string): Promise<AppSettings> {
    const saved = await this.settings.save(settings);
    await this.audit(actorId, 'settings.update', 'settings', null);
    return saved;
  }

  async auditList(page: number, pageSize: number): Promise<ApiPaged<AuditLogDto>> {
    const rows = await this.db.select({ a: auditLogs, actor: users.displayName }).from(auditLogs).leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.createdAt)).limit(pageSize + 1).offset(offsetOf(page, pageSize));
    return paged(
      rows.map((r): AuditLogDto => ({ id: r.a.id, actorName: r.actor, action: r.a.action, objectType: r.a.objectType, objectId: r.a.objectId, createdAt: iso(r.a.createdAt) })),
      page,
      pageSize,
    );
  }
}
