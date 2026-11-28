import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  vnDayStart, vnWeekStart, type AdminPlaceInput, type AdminPlaceUpdate, type AutoReplies, type PlaceDetail, type PlaceInput, type PlaceListQuery,
  type PlaceKind, type PlaceLeaderboard, type PlaceSummary, type PlaceUpdate, type PlaceWishItem, type SceneModelKey,
} from '@xin-via/shared';
import { DomainError } from '../../common/domain-error';
import { slugify } from '../../common/crypto';
import { iso, userSummary } from '../../common/mappers';
import { offsetOf, type ApiPaged, paged } from '../../common/api';
import type { RequestContext } from '../../common/access';
import { requireUser } from '../../common/access';
import { DB, type Db } from '../../database/database';
import {
  placeAutoReplies, placeCategories, placeFollows, placeLikes, places, placeVisits, sceneTemplates, users, wishEvents, wishTypes,
} from '../../database/schema';
import { SettingsService } from '../../common/settings.service';
import { LevelsService } from '../gamification/levels.service';
import { KeywordsService } from '../moderation/keywords.service';

interface PlaceRow { p: typeof places.$inferSelect; categoryName: string; modelKey: SceneModelKey; ownerName: string | null }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toSummary({ p, categoryName, modelKey, ownerName }: PlaceRow): PlaceSummary {
  return {
    id: p.id, slug: p.slug, kind: p.kind, title: p.title, tagline: p.tagline, categoryId: p.categoryId, categoryName, coverUrl: p.coverUrl,
    sceneTemplateId: p.sceneTemplateId, modelKey, isDemo: p.isDemo, ownerName, wishCount: p.wishCount, likeCount: p.likeCount,
    followCount: p.followCount, visitCount: p.visitCount, autoReplyEnabled: p.autoReplyEnabled, sortOrder: p.sortOrder, createdAt: iso(p.createdAt),
  };
}

@Injectable()
export class PlacesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(LevelsService) private readonly levels: LevelsService,
    @Inject(KeywordsService) private readonly keywords: KeywordsService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  private select() {
    return this.db.select({ p: places, categoryName: placeCategories.name, modelKey: sceneTemplates.modelKey, ownerName: users.displayName })
      .from(places)
      .innerJoin(placeCategories, eq(places.categoryId, placeCategories.id))
      .innerJoin(sceneTemplates, eq(places.sceneTemplateId, sceneTemplates.id))
      .leftJoin(users, eq(places.ownerId, users.id));
  }

  async list(query: PlaceListQuery, ctx: RequestContext, includeHidden = false): Promise<ApiPaged<PlaceSummary>> {
    const where: SQL[] = [];
    if (!includeHidden) where.push(eq(places.status, 'visible'));
    if (!includeHidden && !(await this.settings.get()).showDemoData) where.push(eq(places.isDemo, false));
    if (query.categoryId) where.push(eq(places.categoryId, query.categoryId));
    if (query.kind) where.push(eq(places.kind, query.kind));
    if (query.search) where.push(or(ilike(places.title, `%${query.search}%`), ilike(places.tagline, `%${query.search}%`)) ?? sql`true`);
    if (query.scope === 'following') {
      const user = requireUser(ctx);
      where.push(inArray(places.id, this.db.select({ id: placeFollows.placeId }).from(placeFollows).where(eq(placeFollows.userId, user.id))));
    }
    const order = query.sort === 'new' ? [desc(places.createdAt)] : query.sort === 'top' ? [desc(places.wishCount), asc(places.sortOrder)] : [asc(places.sortOrder), asc(places.createdAt)];
    const rows = await this.select().where(and(...where)).orderBy(...order).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    return paged(rows.map(toSummary), query.page, query.pageSize);
  }

  /** Danh sách đầy đủ cho admin (kể cả điểm đã ẩn), trả chi tiết để form sửa dùng ngay. */
  async adminList(query: { page: number; pageSize: number; search?: string | undefined }): Promise<ApiPaged<PlaceDetail>> {
    const where = query.search ? or(ilike(places.title, `%${query.search}%`), ilike(places.tagline, `%${query.search}%`)) : undefined;
    const rows = await this.select().where(where).orderBy(asc(places.sortOrder), asc(places.createdAt)).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    const levels = await this.levels.all();
    const ownerIds = [...new Set(rows.flatMap((r) => (r.p.ownerId ? [r.p.ownerId] : [])))];
    const owners = ownerIds.length
      ? await this.db
          .select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, memberRole: users.memberRole, jobTitle: users.jobTitle, points: users.points })
          .from(users)
          .where(inArray(users.id, ownerIds))
      : [];
    const items = rows.map((r): PlaceDetail => {
      const owner = owners.find((o) => o.id === r.p.ownerId);
      return { ...toSummary(r), description: r.p.description, province: r.p.province, owner: owner ? userSummary(owner, levels) : null, status: r.p.status, viewer: null };
    });
    return paged(items, query.page, query.pageSize);
  }

  async random(): Promise<PlaceSummary> {
    const [row] = await this.select().where(eq(places.status, 'visible')).orderBy(sql`random()`).limit(1);
    if (!row) throw new DomainError('PLACE_NOT_FOUND');
    return toSummary(row);
  }

  async heroPlaces(limit: number): Promise<PlaceSummary[]> {
    const showDemo = (await this.settings.get()).showDemoData;
    const rows = await this.select().where(and(eq(places.status, 'visible'), showDemo ? undefined : eq(places.isDemo, false))).orderBy(asc(places.sortOrder), asc(places.createdAt)).limit(limit);
    return rows.map(toSummary);
  }

  /** Xếp hạng theo số vía nhận trong tuần hiện tại (từ thứ Hai 00:00 giờ Việt Nam); không tính điểm nhiệm vụ, không theo doanh thu. */
  async weeklyLeaderboard(kind: PlaceKind, limit: number): Promise<PlaceLeaderboard> {
    const weekStart = vnWeekStart(new Date());
    const showDemo = (await this.settings.get()).showDemoData;
    const counts = await this.db.select({ placeId: wishEvents.targetPlaceId, n: sql<number>`count(*)::int` }).from(wishEvents)
      .where(and(eq(wishEvents.source, 'place'), gte(wishEvents.createdAt, weekStart))).groupBy(wishEvents.targetPlaceId);
    const countOf = new Map(counts.flatMap((c) => (c.placeId ? [[c.placeId, c.n] as const] : [])));
    const ids = [...countOf.keys()];
    if (ids.length === 0) return { weekStartsAt: weekStart.toISOString(), items: [] };
    const rows = await this.select().where(and(inArray(places.id, ids), eq(places.status, 'visible'), eq(places.kind, kind), showDemo ? undefined : eq(places.isDemo, false)));
    const ranked = rows.map((r) => ({ row: r, wishes: countOf.get(r.p.id) ?? 0 })).sort((x, y) => y.wishes - x.wishes || x.row.p.sortOrder - y.row.p.sortOrder).slice(0, limit);
    return { weekStartsAt: weekStart.toISOString(), items: ranked.map((r, i) => ({ rank: i + 1, place: toSummary(r.row), wishes: r.wishes })) };
  }

  async findRow(idOrSlug: string, includeHidden = false): Promise<PlaceRow> {
    const cond = UUID.test(idOrSlug) ? eq(places.id, idOrSlug) : eq(places.slug, idOrSlug);
    const [row] = await this.select().where(includeHidden ? cond : and(cond, eq(places.status, 'visible'))).limit(1);
    if (!row) throw new DomainError('PLACE_NOT_FOUND');
    return row;
  }

  async detail(idOrSlug: string, ctx: RequestContext, includeHidden = false): Promise<PlaceDetail> {
    const row = await this.findRow(idOrSlug, includeHidden);
    const levels = await this.levels.all();
    let owner = null;
    if (row.p.ownerId) {
      const [o] = await this.db
        .select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, memberRole: users.memberRole, jobTitle: users.jobTitle, points: users.points })
        .from(users)
        .where(eq(users.id, row.p.ownerId))
        .limit(1);
      owner = o ? userSummary(o, levels) : null;
    }
    let viewer: PlaceDetail['viewer'] = null;
    if (ctx.user) {
      const [liked] = await this.db.select({ n: sql<number>`1` }).from(placeLikes).where(and(eq(placeLikes.placeId, row.p.id), eq(placeLikes.userId, ctx.user.id))).limit(1);
      const [following] = await this.db.select({ n: sql<number>`1` }).from(placeFollows).where(and(eq(placeFollows.placeId, row.p.id), eq(placeFollows.userId, ctx.user.id))).limit(1);
      viewer = { liked: !!liked, following: !!following, isOwner: row.p.ownerId === ctx.user.id };
    }
    return { ...toSummary(row), description: row.p.description, province: row.p.province, owner, status: row.p.status, viewer };
  }

  async wishesOf(placeId: string, page: number, pageSize: number): Promise<ApiPaged<PlaceWishItem>> {
    const rows = await this.db.select({ e: wishEvents, typeName: wishTypes.name, uName: users.displayName, uAvatar: users.avatarUrl })
      .from(wishEvents).leftJoin(wishTypes, eq(wishEvents.wishTypeId, wishTypes.id)).leftJoin(users, eq(wishEvents.actorUserId, users.id))
      .where(and(eq(wishEvents.targetPlaceId, placeId), eq(wishEvents.source, 'place'))).orderBy(desc(wishEvents.createdAt))
      .limit(pageSize + 1).offset(offsetOf(page, pageSize));
    const items = rows.map((r): PlaceWishItem => ({
      id: r.e.id, createdAt: iso(r.e.createdAt), wishTypeName: r.typeName ?? '', message: r.e.message,
      sender: r.uName ? { displayName: r.uName, avatarUrl: r.uAvatar } : null,
    }));
    return paged(items, page, pageSize);
  }

  /** Ghi nhận lượt ghé (tổng hợp, mỗi người/điểm/ngày một lần) — không công khai danh tính khách. */
  async visit(idOrSlug: string, ctx: RequestContext): Promise<void> {
    const row = await this.findRow(idOrSlug);
    const since = vnDayStart(new Date());
    const actor = ctx.user ? eq(placeVisits.userId, ctx.user.id) : eq(placeVisits.guestHash, ctx.guestHash);
    const [seen] = await this.db.select({ id: placeVisits.id }).from(placeVisits)
      .where(and(eq(placeVisits.placeId, row.p.id), actor, sql`${placeVisits.createdAt} >= ${since.toISOString()}`)).limit(1);
    if (seen) return;
    await this.db.transaction(async (tx) => {
      await tx.insert(placeVisits).values({ placeId: row.p.id, userId: ctx.user?.id ?? null, guestHash: ctx.user ? null : ctx.guestHash });
      await tx.update(places).set({ visitCount: sql`${places.visitCount} + 1` }).where(eq(places.id, row.p.id));
    });
  }

  async toggleLike(placeId: string, userId: string, on: boolean): Promise<{ liked: boolean; likes: number }> {
    await this.findRow(placeId);
    await this.db.transaction(async (tx) => {
      if (on) {
        const ins = await tx.insert(placeLikes).values({ placeId, userId }).onConflictDoNothing().returning({ id: placeLikes.placeId });
        if (ins.length) await tx.update(places).set({ likeCount: sql`${places.likeCount} + 1` }).where(eq(places.id, placeId));
      } else {
        const del = await tx.delete(placeLikes).where(and(eq(placeLikes.placeId, placeId), eq(placeLikes.userId, userId))).returning({ id: placeLikes.placeId });
        if (del.length) await tx.update(places).set({ likeCount: sql`greatest(${places.likeCount} - 1, 0)` }).where(eq(places.id, placeId));
      }
    });
    const [p] = await this.db.select({ n: places.likeCount }).from(places).where(eq(places.id, placeId));
    return { liked: on, likes: p?.n ?? 0 };
  }

  async toggleFollow(placeId: string, userId: string, on: boolean): Promise<{ following: boolean; followers: number }> {
    await this.findRow(placeId);
    await this.db.transaction(async (tx) => {
      if (on) {
        const ins = await tx.insert(placeFollows).values({ placeId, userId }).onConflictDoNothing().returning({ id: placeFollows.placeId });
        if (ins.length) await tx.update(places).set({ followCount: sql`${places.followCount} + 1` }).where(eq(places.id, placeId));
      } else {
        const del = await tx.delete(placeFollows).where(and(eq(placeFollows.placeId, placeId), eq(placeFollows.userId, userId))).returning({ id: placeFollows.placeId });
        if (del.length) await tx.update(places).set({ followCount: sql`greatest(${places.followCount} - 1, 0)` }).where(eq(places.id, placeId));
      }
    });
    const [p] = await this.db.select({ n: places.followCount }).from(places).where(eq(places.id, placeId));
    return { following: on, followers: p?.n ?? 0 };
  }

  mine(userId: string): Promise<PlaceSummary[]> {
    return this.select().where(eq(places.ownerId, userId)).orderBy(desc(places.createdAt)).then((rows) => rows.map(toSummary));
  }

  private async assertTemplate(categoryId: string, sceneTemplateId: string, kind: PlaceInput['kind']): Promise<void> {
    const [cat] = await this.db.select().from(placeCategories).where(and(eq(placeCategories.id, categoryId), eq(placeCategories.active, true))).limit(1);
    const [tpl] = await this.db.select().from(sceneTemplates).where(and(eq(sceneTemplates.id, sceneTemplateId), eq(sceneTemplates.active, true))).limit(1);
    if (!cat || !tpl || cat.kind !== kind || tpl.kind !== kind) throw new DomainError('PLACE_TEMPLATE_INVALID');
  }

  private async assertContent(...texts: (string | null | undefined)[]): Promise<void> {
    if ((await this.keywords.check(...texts)) === 'block') throw new DomainError('PLACE_CONTENT_BLOCKED');
  }

  private newSlug(title: string): string {
    return `${slugify(title) || 'diem'}-${randomBytes(3).toString('hex')}`;
  }

  /** Thành viên tạo cửa hàng/văn phòng 3D từ mẫu dựng sẵn (P1, DEC-05). */
  async createByMember(userId: string, input: PlaceInput, ctx: RequestContext): Promise<PlaceDetail> {
    await this.assertTemplate(input.categoryId, input.sceneTemplateId, input.kind);
    await this.assertContent(input.title, input.tagline, input.description);
    const [row] = await this.db.insert(places).values({
      slug: this.newSlug(input.title), ownerId: userId, kind: input.kind, title: input.title, tagline: input.tagline ?? null,
      description: input.description ?? null, province: input.province ?? null, categoryId: input.categoryId,
      sceneTemplateId: input.sceneTemplateId, autoReplyEnabled: input.autoReplyEnabled, sortOrder: 1000,
    }).returning({ id: places.id });
    return this.detail(row?.id ?? '', ctx, true);
  }

  async updateByOwner(userId: string, placeId: string, input: PlaceUpdate, ctx: RequestContext): Promise<PlaceDetail> {
    const row = await this.findRow(placeId, true);
    if (row.p.ownerId !== userId) throw new DomainError('PLACE_NOT_OWNER');
    const kind = input.kind ?? row.p.kind;
    if (input.categoryId || input.sceneTemplateId || input.kind) {
      await this.assertTemplate(input.categoryId ?? row.p.categoryId, input.sceneTemplateId ?? row.p.sceneTemplateId, kind);
    }
    await this.assertContent(input.title, input.tagline, input.description);
    await this.db.update(places).set({ ...input, updatedAt: new Date() }).where(eq(places.id, placeId));
    return this.detail(placeId, ctx, true);
  }

  async removeByOwner(userId: string, placeId: string): Promise<void> {
    const row = await this.findRow(placeId, true);
    if (row.p.ownerId !== userId) throw new DomainError('PLACE_NOT_OWNER');
    await this.db.delete(places).where(eq(places.id, placeId));
  }

  async autoRepliesOf(userId: string, placeId: string): Promise<AutoReplies> {
    const row = await this.findRow(placeId, true);
    if (row.p.ownerId !== userId) throw new DomainError('PLACE_NOT_OWNER');
    const rows = await this.db.select().from(placeAutoReplies).where(eq(placeAutoReplies.placeId, placeId));
    return { replies: rows.map((r) => ({ wishTypeId: r.wishTypeId, text: r.text })) };
  }

  async setAutoReplies(userId: string, placeId: string, input: AutoReplies): Promise<AutoReplies> {
    const row = await this.findRow(placeId, true);
    if (row.p.ownerId !== userId) throw new DomainError('PLACE_NOT_OWNER');
    await this.assertContent(...input.replies.map((r) => r.text));
    await this.db.transaction(async (tx) => {
      await tx.delete(placeAutoReplies).where(eq(placeAutoReplies.placeId, placeId));
      if (input.replies.length) await tx.insert(placeAutoReplies).values(input.replies.map((r) => ({ placeId, wishTypeId: r.wishTypeId, text: r.text })));
    });
    return input;
  }

  /* ---- Admin ---- */
  async adminCreate(input: AdminPlaceInput, ctx: RequestContext): Promise<PlaceDetail> {
    await this.assertTemplate(input.categoryId, input.sceneTemplateId, input.kind);
    const [row] = await this.db.insert(places).values({
      slug: this.newSlug(input.title), ownerId: input.ownerId ?? null, kind: input.kind, title: input.title, tagline: input.tagline ?? null,
      description: input.description ?? null, province: input.province ?? null, categoryId: input.categoryId, sceneTemplateId: input.sceneTemplateId,
      autoReplyEnabled: input.autoReplyEnabled, isDemo: input.isDemo, status: input.status, sortOrder: input.sortOrder, coverUrl: input.coverUrl ?? null,
    }).returning({ id: places.id });
    return this.detail(row?.id ?? '', ctx, true);
  }

  async adminUpdate(placeId: string, input: AdminPlaceUpdate, ctx: RequestContext): Promise<PlaceDetail> {
    const row = await this.findRow(placeId, true);
    if (input.categoryId || input.sceneTemplateId || input.kind) {
      await this.assertTemplate(input.categoryId ?? row.p.categoryId, input.sceneTemplateId ?? row.p.sceneTemplateId, input.kind ?? row.p.kind);
    }
    await this.db.update(places).set({ ...input, updatedAt: new Date() }).where(eq(places.id, placeId));
    return this.detail(placeId, ctx, true);
  }

  async adminDelete(placeId: string): Promise<void> {
    await this.findRow(placeId, true);
    await this.db.delete(places).where(eq(places.id, placeId));
  }
}
