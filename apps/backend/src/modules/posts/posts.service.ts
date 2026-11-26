import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, notInArray, or, sql, type SQL } from 'drizzle-orm';
import {
  HashtagCountSchema, HotTopicSchema, RANGE_METRICS, StoryAuthorRankSchema, STORY_STICKERS, metricAllowedForRole, type AppSettings, type CommentDto, type CreatePostBody, type HashtagCount, type HotTopicDto, type StoryAuthorRank,
  type LevelDto, type PollDto, type WishCountDto, type PostDto, type PostListQuery, type RangeDef, type ReactionType,
} from '@chot-via/shared';
import { z } from 'zod';
import type { RequestContext } from '../../common/access';
import { offsetOf, paged, type ApiPaged } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { iso, userSummary, type UserRow } from '../../common/mappers';
import { RateLimitService } from '../../common/rate-limit.service';
import { SettingsService } from '../../common/settings.service';
import { DB, type Db } from '../../database/database';
import {
  achievements, comments, hotTopics, placeFollows, places, pollVotes, postMedia, posts, postShares, reactions, savedPosts, userBlocks, userFollows,
  users, wishEvents, wishTypes,
} from '../../database/schema';
import { LevelsService } from '../gamification/levels.service';
import { KeywordsService } from '../moderation/keywords.service';
import { ReportsService } from '../moderation/reports.service';
import { NotificationsService } from '../notifications/notifications.service';

interface PostRow { post: typeof posts.$inferSelect; author: UserRow; wt: typeof wishTypes.$inferSelect | null }

const authorColumns = { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, memberRole: users.memberRole, jobTitle: users.jobTitle, points: users.points };
const RawCountSchema = z.array(z.object({ tag: z.string(), count: z.coerce.number() }));

@Injectable()
export class PostsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
    @Inject(LevelsService) private readonly levels: LevelsService,
    @Inject(KeywordsService) private readonly keywords: KeywordsService,
    @Inject(ReportsService) private readonly reports: ReportsService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  private select() {
    return this.db.select({ post: posts, author: authorColumns, wt: wishTypes }).from(posts)
      .innerJoin(users, eq(posts.authorId, users.id)).leftJoin(wishTypes, eq(posts.wishTypeId, wishTypes.id));
  }

  /** Điểm "Đang được quan tâm": tương tác có trọng số, giảm dần theo thời gian (nửa đời cấu hình được). */
  private hotScore(s: AppSettings): SQL {
    const w = s.hot.weights;
    const n = (v: number): SQL => sql.raw(String(v));
    return sql`((${posts.reactionCount} * ${n(w.reaction)} + ${posts.commentCount} * ${n(w.comment)} + ${posts.wishCount} * ${n(w.wish)} + ${posts.shareCount} * ${n(w.share)})
      * power(0.5, extract(epoch from (now() - ${posts.createdAt})) / 3600.0 / ${n(s.hot.halfLifeHours)}))`;
  }

  private buildWhere(query: PostListQuery, ctx: RequestContext, s: AppSettings): SQL[] {
    const where: SQL[] = [eq(posts.status, 'published')];
    if (!s.showDemoData) where.push(eq(posts.isDemo, false));
    if (query.type === 'story') where.push(eq(posts.type, 'story'));
    if (query.type === 'brag') where.push(eq(posts.type, 'achievement'));
    if (query.type === 'revenue') where.push(eq(posts.type, 'achievement'), eq(posts.role, 'owner'));
    if (query.type === 'deal') where.push(eq(posts.type, 'achievement'), eq(posts.role, 'sale'));
    if (query.type === 'wish') where.push(eq(posts.type, 'wish_share'));
    if (query.role) where.push(eq(posts.role, query.role));
    if (query.hashtag) where.push(sql`${posts.hashtags} @> ARRAY[${query.hashtag.toLowerCase()}]::text[]`);
    if (query.q) where.push(ilike(posts.body, `%${query.q}%`));
    if (query.authorId) where.push(eq(posts.authorId, query.authorId));
    if (query.has === 'photo') where.push(sql`exists (select 1 from post_media pm where pm.post_id = ${posts.id})`);
    if (query.has === 'poll') where.push(sql`${posts.poll} is not null`);
    if (query.sort === 'hot') where.push(sql`${posts.createdAt} > now() - make_interval(days => ${s.hot.windowDays})`);
    if (ctx.user) {
      where.push(notInArray(posts.authorId, this.db.select({ id: userBlocks.blockedId }).from(userBlocks).where(eq(userBlocks.blockerId, ctx.user.id))));
    }
    if (query.sort === 'following') {
      if (!ctx.user) throw new DomainError('AUTH_REQUIRED');
      const followedUsers = this.db.select({ id: userFollows.followeeId }).from(userFollows).where(eq(userFollows.followerId, ctx.user.id));
      const followedOwners = this.db.select({ id: places.ownerId }).from(places).innerJoin(placeFollows, eq(placeFollows.placeId, places.id)).where(eq(placeFollows.userId, ctx.user.id));
      where.push(or(inArray(posts.authorId, followedUsers), inArray(posts.authorId, followedOwners)) ?? sql`false`);
    }
    return where;
  }

  async list(query: PostListQuery, ctx: RequestContext, includeAllStatuses = false): Promise<ApiPaged<PostDto>> {
    const s = await this.settings.get();
    const where = this.buildWhere(query, ctx, s);
    if (includeAllStatuses) where.shift();
    const base = query.sort === 'hot' ? [desc(this.hotScore(s)), desc(posts.createdAt)] : [desc(posts.createdAt)];
    const order = query.pinned === 'first' ? [sql`(${posts.pinnedAt} is not null) desc`, ...base] : base;
    const rows = await this.select().where(and(...where)).orderBy(...order).limit(query.pageSize + 1).offset(offsetOf(query.page, query.pageSize));
    const dtos = await this.hydrate(rows.slice(0, query.pageSize), ctx);
    return { code: 'OK', data: dtos, meta: { page: query.page, pageSize: query.pageSize, hasMore: rows.length > query.pageSize } };
  }

  async saved(userId: string, ctx: RequestContext, page: number, pageSize: number): Promise<ApiPaged<PostDto>> {
    const rows = await this.select().innerJoin(savedPosts, eq(savedPosts.postId, posts.id))
      .where(and(eq(savedPosts.userId, userId), eq(posts.status, 'published'))).orderBy(desc(savedPosts.createdAt))
      .limit(pageSize + 1).offset(offsetOf(page, pageSize));
    const dtos = await this.hydrate(rows.slice(0, pageSize).map((r) => ({ post: r.post, author: r.author, wt: r.wt })), ctx);
    return { code: 'OK', data: dtos, meta: { page, pageSize, hasMore: rows.length > pageSize } };
  }

  async getOne(id: string, ctx: RequestContext): Promise<PostDto> {
    const [row] = await this.select().where(and(eq(posts.id, id), eq(posts.status, 'published'))).limit(1);
    if (!row) throw new DomainError('POST_NOT_FOUND');
    const [dto] = await this.hydrate([row], ctx);
    if (!dto) throw new DomainError('POST_NOT_FOUND');
    return dto;
  }

  async search(q: string, ctx: RequestContext, limit: number): Promise<PostDto[]> {
    const rows = await this.select().where(and(eq(posts.status, 'published'), ilike(posts.body, `%${q}%`))).orderBy(desc(posts.createdAt)).limit(limit);
    return this.hydrate(rows, ctx);
  }

  async hotHashtags(limit: number, windowDays: number): Promise<HashtagCount[]> {
    const rows = await this.db.execute(sql`select tag, count(*)::int as count from posts, unnest(hashtags) as tag
      where status = 'published' and created_at > now() - make_interval(days => ${windowDays}) group by tag order by count desc, tag asc limit ${limit}`);
    return RawCountSchema.parse(Array.from(rows)).map((r) => HashtagCountSchema.parse({ tag: r.tag, count: r.count }));
  }

  /** Chủ đề hot do quản trị viên cấu hình (khối "Chủ đề hot" của trang Kể khổ). */
  async hotTopics(): Promise<HotTopicDto[]> {
    const rows = await this.db.select().from(hotTopics).where(eq(hotTopics.active, true)).orderBy(asc(hotTopics.sortOrder));
    return rows.map((r) => HotTopicSchema.parse({ id: r.id, title: r.title, hashtag: r.hashtag }));
  }

  /** Bình chọn vui: bài Kể khổ có bình chọn mới nhất. */
  async featuredPoll(ctx: RequestContext): Promise<PostDto | null> {
    const showDemo = (await this.settings.get()).showDemoData;
    const [row] = await this.select().where(and(eq(posts.status, 'published'), eq(posts.type, 'story'), sql`${posts.poll} is not null`, showDemo ? undefined : eq(posts.isDemo, false))).orderBy(desc(posts.createdAt)).limit(1);
    if (!row) return null;
    const [dto] = await this.hydrate([row], ctx);
    return dto ?? null;
  }

  /** Top Kể Khổ tuần: tác giả bài Kể khổ nhận nhiều cảm xúc nhất trong 7 ngày gần nhất. */
  async topStoryAuthors(limit: number): Promise<StoryAuthorRank[]> {
    const rows = await this.db.select({ author: authorColumns, hearts: sql<number>`sum(${posts.reactionCount})::int` }).from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.status, 'published'), eq(posts.type, 'story'), sql`${posts.createdAt} > now() - interval '7 days'`, (await this.settings.get()).showDemoData ? undefined : eq(posts.isDemo, false)))
      .groupBy(users.id).orderBy(sql`sum(${posts.reactionCount}) desc`, asc(users.displayName)).limit(limit);
    const levels = await this.levels.all();
    return rows.map((r, i) => StoryAuthorRankSchema.parse({ rank: i + 1, user: userSummary(r.author, levels), hearts: r.hearts }));
  }

  /** Chuyển các dòng truy vấn thành DTO, gom truy vấn phụ (media, thành tích, tương tác của người xem). */
  async hydrate(rows: PostRow[], ctx: RequestContext): Promise<PostDto[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.post.id);
    const levels = await this.levels.all();
    const [media, achs, voteCounts] = await Promise.all([
      this.db.select().from(postMedia).where(inArray(postMedia.postId, ids)).orderBy(asc(postMedia.position)),
      this.db.select().from(achievements).where(inArray(achievements.postId, ids)),
      this.db.select({ postId: pollVotes.postId, optionId: pollVotes.optionId, n: sql<number>`count(*)::int` }).from(pollVotes).where(inArray(pollVotes.postId, ids)).groupBy(pollVotes.postId, pollVotes.optionId),
    ]);
    const mine = ctx.user ? await this.viewerState(ctx.user.id, ids) : null;
    const [wishRows, myWishRows, commentRows, allTypes] = await Promise.all([
      this.db.select({ postId: wishEvents.targetPostId, typeId: wishEvents.wishTypeId, n: sql<number>`count(*)::int` }).from(wishEvents)
        .where(and(eq(wishEvents.source, 'post'), inArray(wishEvents.targetPostId, ids), isNotNull(wishEvents.wishTypeId))).groupBy(wishEvents.targetPostId, wishEvents.wishTypeId),
      this.db.select({ postId: wishEvents.targetPostId, typeId: wishEvents.wishTypeId }).from(wishEvents)
        .where(and(eq(wishEvents.source, 'post'), inArray(wishEvents.targetPostId, ids), isNotNull(wishEvents.wishTypeId), ctx.user ? eq(wishEvents.actorUserId, ctx.user.id) : eq(wishEvents.guestHash, ctx.guestHash))),
      this.db.select({ postId: comments.postId, n: sql<number>`count(*)::int` }).from(comments).where(and(inArray(comments.postId, ids), eq(comments.status, 'published'))).groupBy(comments.postId),
      this.db.select().from(wishTypes).where(eq(wishTypes.active, true)).orderBy(asc(wishTypes.sortOrder)),
    ]);
    const wishCounts = new Map(wishRows.map((r) => [`${r.postId}|${r.typeId}`, r.n]));
    const myWishes = new Set(myWishRows.map((r) => `${r.postId}|${r.typeId}`));
    const commentCounts = new Map(commentRows.map((r) => [r.postId, r.n]));

    return rows.map(({ post, author, wt }): PostDto => {
      const ach = achs.find((a) => a.postId === post.id);
      return {
        id: post.id, type: post.type, role: post.role, body: post.body, status: post.status, pinned: post.pinnedAt !== null,
        sticker: this.asSticker(post.sticker), location: post.location, hashtags: post.hashtags,
        wishType: wt ? { id: wt.id, code: wt.code, name: wt.name, iconKey: wt.iconKey, sortOrder: wt.sortOrder } : null,
        media: media.filter((m) => m.postId === post.id).map((m) => ({ id: m.id, url: m.url, width: m.width, height: m.height })),
        achievement: ach ? {
          metricType: ach.metricType, displayMode: ach.displayMode, rangeCode: ach.displayMode === 'range' ? ach.rangeCode : null,
          amount: ach.displayMode === 'exact' ? ach.amount : null, verification: 'self_declared',
        } : null,
        poll: this.pollOf(post, voteCounts, mine?.votes.get(post.id) ?? null),
        author: userSummary(author, levels),
        counts: { reactions: post.reactionCount, comments: commentCounts.get(post.id) ?? 0, wishes: allTypes.reduce((sum, t) => sum + (wishCounts.get(`${post.id}|${t.id}`) ?? 0), 0), shares: post.shareCount },
        wishBreakdown: allTypes.map((t) => ({ wishTypeId: t.id, code: t.code, name: t.name, iconKey: t.iconKey, sortOrder: t.sortOrder, count: wishCounts.get(`${post.id}|${t.id}`) ?? 0, mine: myWishes.has(`${post.id}|${t.id}`) })),
        viewer: mine ? {
          reaction: mine.reactions.get(post.id) ?? null, saved: mine.saved.has(post.id), wished: mine.wished.has(post.id), isOwn: post.authorId === ctx.user?.id,
        } : null,
        createdAt: iso(post.createdAt),
      };
    });
  }

  private asSticker(value: string | null): PostDto['sticker'] {
    const parsed = z.enum(STORY_STICKERS).safeParse(value);
    return parsed.success ? parsed.data : null;
  }

  private pollOf(post: typeof posts.$inferSelect, counts: { postId: string; optionId: string; n: number }[], myVote: string | null): PollDto | null {
    if (!post.poll) return null;
    const options = post.poll.options.map((o) => ({ id: o.id, text: o.text, votes: counts.find((c) => c.postId === post.id && c.optionId === o.id)?.n ?? 0 }));
    return { options, totalVotes: options.reduce((sum, o) => sum + o.votes, 0), myVoteId: myVote };
  }

  private async viewerState(userId: string, ids: string[]): Promise<{ reactions: Map<string, ReactionType>; saved: Set<string>; wished: Set<string>; votes: Map<string, string> }> {
    const [r, s, w, v] = await Promise.all([
      this.db.select({ postId: reactions.postId, type: reactions.type }).from(reactions).where(and(eq(reactions.userId, userId), inArray(reactions.postId, ids))),
      this.db.select({ postId: savedPosts.postId }).from(savedPosts).where(and(eq(savedPosts.userId, userId), inArray(savedPosts.postId, ids))),
      this.db.select({ postId: wishEvents.targetPostId }).from(wishEvents).where(and(eq(wishEvents.actorUserId, userId), eq(wishEvents.source, 'post'), inArray(wishEvents.targetPostId, ids))),
      this.db.select({ postId: pollVotes.postId, optionId: pollVotes.optionId }).from(pollVotes).where(and(eq(pollVotes.userId, userId), inArray(pollVotes.postId, ids))),
    ]);
    return {
      reactions: new Map(r.map((x) => [x.postId, x.type])),
      saved: new Set(s.map((x) => x.postId)),
      wished: new Set(w.flatMap((x) => (x.postId ? [x.postId] : []))),
      votes: new Map(v.map((x) => [x.postId, x.optionId])),
    };
  }

  private rangesFor(role: 'owner' | 'sale', s: AppSettings): RangeDef[] {
    return role === 'owner' ? s.achievementRanges.ownerRevenue : s.achievementRanges.saleDeal;
  }

  /** FR-07/FR-08/FR-10: tạo bài (đã đăng nhập). Đăng trước, kiểm duyệt sau; lọc từ khóa tự động. */
  async create(userId: string, body: CreatePostBody, ctx: RequestContext): Promise<PostDto> {
    const s = await this.settings.get();
    await this.rate.assert(`post:${userId}`, s.rateLimits.postPerHour, 3600);
    const text = body.body.trim();
    if (!text) throw new DomainError('POST_BODY_EMPTY');
    const max = body.type === 'achievement' ? s.achievementMaxChars : s.storyMaxChars;
    if (text.length > max) throw new DomainError('POST_BODY_TOO_LONG', { max });
    if (body.mediaIds.length > s.postMaxImages) throw new DomainError('POST_MEDIA_TOO_MANY', { max: s.postMaxImages });
    const hashtags = [...new Set(body.hashtags.map((h) => h.toLowerCase()))].slice(0, s.hashtagMax);

    const verdict = await this.keywords.check(text, body.location, ...hashtags, ...(body.type === 'story' ? (body.poll?.options ?? []) : []));
    if (verdict === 'block') throw new DomainError('POST_CONTENT_BLOCKED');

    const mediaRows = body.mediaIds.length
      ? await this.db.select().from(postMedia).where(and(inArray(postMedia.id, body.mediaIds), eq(postMedia.ownerId, userId)))
      : [];
    if (mediaRows.length !== body.mediaIds.length || mediaRows.some((m) => m.postId !== null)) throw new DomainError('POST_MEDIA_INVALID');

    let achievement: typeof achievements.$inferInsert | null = null;
    let role: 'owner' | 'sale' | null = null;
    let poll: { options: { id: string; text: string }[] } | null = null;
    let wishTypeId: string | null = null;
    if (body.type === 'achievement') {
      role = body.role;
      if (!metricAllowedForRole(body.role, body.metricType)) throw new DomainError('POST_ROLE_METRIC_MISMATCH');
      achievement = { postId: '', metricType: body.metricType, displayMode: body.displayMode, rangeCode: null, amount: null };
      if (body.displayMode === 'range') {
        const valid = RANGE_METRICS.includes(body.metricType) && this.rangesFor(body.role, s).some((r) => r.code === body.rangeCode);
        if (!valid || !body.rangeCode) throw new DomainError('POST_RANGE_INVALID');
        achievement.rangeCode = body.rangeCode;
      }
      if (body.displayMode === 'exact') {
        if (!body.amount) throw new DomainError('POST_AMOUNT_REQUIRED');
        achievement.amount = body.amount;
      }
    }
    if (body.type === 'story' && body.poll) poll = { options: body.poll.options.map((t, i) => ({ id: `o${i + 1}`, text: t.trim() })) };
    if (body.type === 'wish_share' && body.wishTypeId) {
      const [t] = await this.db.select({ id: wishTypes.id }).from(wishTypes).where(and(eq(wishTypes.id, body.wishTypeId), eq(wishTypes.active, true))).limit(1);
      if (!t) throw new DomainError('WISH_TYPE_INVALID');
      wishTypeId = t.id;
    }

    const postId = await this.db.transaction(async (tx) => {
      const [row] = await tx.insert(posts).values({
        authorId: userId, type: body.type, role, body: text, sticker: body.type === 'story' ? (body.sticker ?? null) : null,
        location: body.location?.trim() || null, hashtags, poll, wishTypeId,
      }).returning({ id: posts.id });
      const id = row?.id ?? '';
      if (achievement) await tx.insert(achievements).values({ ...achievement, postId: id });
      for (const [position, m] of body.mediaIds.entries()) await tx.update(postMedia).set({ postId: id, position }).where(eq(postMedia.id, m));
      return id;
    });
    if (verdict === 'review') await this.reports.autoFlag('post', postId);
    return this.getOne(postId, ctx);
  }

  async remove(userId: string, postId: string): Promise<void> {
    const [row] = await this.db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!row) throw new DomainError('POST_NOT_FOUND');
    if (row.authorId !== userId) throw new DomainError('POST_NOT_OWNER');
    await this.db.delete(posts).where(eq(posts.id, postId));
  }

  private async assertPublished(postId: string): Promise<typeof posts.$inferSelect> {
    const [row] = await this.db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.status, 'published'))).limit(1);
    if (!row) throw new DomainError('POST_NOT_FOUND');
    return row;
  }

  async setReaction(userId: string, postId: string, type: ReactionType | null): Promise<{ reactions: number; mine: ReactionType | null }> {
    const post = await this.assertPublished(postId);
    let fresh = false;
    await this.db.transaction(async (tx) => {
      if (type) {
        const prev = await tx.select({ t: reactions.type }).from(reactions).where(and(eq(reactions.postId, postId), eq(reactions.userId, userId))).limit(1);
        await tx.insert(reactions).values({ postId, userId, type }).onConflictDoUpdate({ target: [reactions.postId, reactions.userId], set: { type } });
        if (prev.length === 0) {
          fresh = true;
          await tx.update(posts).set({ reactionCount: sql`${posts.reactionCount} + 1` }).where(eq(posts.id, postId));
        }
      } else {
        const del = await tx.delete(reactions).where(and(eq(reactions.postId, postId), eq(reactions.userId, userId))).returning({ id: reactions.postId });
        if (del.length) await tx.update(posts).set({ reactionCount: sql`greatest(${posts.reactionCount} - 1, 0)` }).where(eq(posts.id, postId));
      }
    });
    if (fresh && post.authorId !== userId) {
      const [actor] = await this.db.select({ n: users.displayName }).from(users).where(eq(users.id, userId));
      await this.notifications.push(post.authorId, 'post_reacted', { postId, actorName: actor?.n ?? '' });
    }
    const [after] = await this.db.select({ n: posts.reactionCount }).from(posts).where(eq(posts.id, postId));
    return { reactions: after?.n ?? 0, mine: type };
  }

  async setSaved(userId: string, postId: string, on: boolean): Promise<boolean> {
    await this.assertPublished(postId);
    if (on) await this.db.insert(savedPosts).values({ userId, postId }).onConflictDoNothing();
    else await this.db.delete(savedPosts).where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
    return on;
  }

  /** Chia sẻ: mỗi người/khách chỉ tính một lần cho mỗi bài (tương tác hợp lệ). */
  async share(ctx: RequestContext, postId: string): Promise<number> {
    await this.assertPublished(postId);
    const ins = await this.db.insert(postShares).values({ postId, actorKey: ctx.actorKey }).onConflictDoNothing().returning({ id: postShares.postId });
    if (ins.length) await this.db.update(posts).set({ shareCount: sql`${posts.shareCount} + 1` }).where(eq(posts.id, postId));
    const [after] = await this.db.select({ n: posts.shareCount }).from(posts).where(eq(posts.id, postId));
    return after?.n ?? 0;
  }

  /** Gửi vía động viên cho bài viết: mỗi người gửi mỗi loại vía một lần cho mỗi bài (bấm lại loại đã gửi thì không đổi); không cộng điểm (chỉ 3 nguồn điểm đã chốt). */
  async wishPost(ctx: RequestContext, postId: string, wishTypeId: string | undefined): Promise<{ wishes: number; wishBreakdown: WishCountDto[] }> {
    const s = await this.settings.get();
    await this.rate.assert(`wish:${ctx.actorKey}`, s.rateLimits.wishPerMinute, 60);
    await this.assertPublished(postId);
    if (wishTypeId) {
      const [t] = await this.db.select({ id: wishTypes.id }).from(wishTypes).where(and(eq(wishTypes.id, wishTypeId), eq(wishTypes.active, true))).limit(1);
      if (!t) throw new DomainError('WISH_TYPE_INVALID');
    }
    const actor = ctx.user ? eq(wishEvents.actorUserId, ctx.user.id) : eq(wishEvents.guestHash, ctx.guestHash);
    const sameType = wishTypeId ? eq(wishEvents.wishTypeId, wishTypeId) : isNull(wishEvents.wishTypeId);
    const [seen] = await this.db.select({ id: wishEvents.id }).from(wishEvents).where(and(eq(wishEvents.source, 'post'), eq(wishEvents.targetPostId, postId), actor, sameType)).limit(1);
    if (!seen) {
      await this.db.transaction(async (tx) => {
        await tx.insert(wishEvents).values({ source: 'post', actorUserId: ctx.user?.id ?? null, guestHash: ctx.user ? null : ctx.guestHash, targetPostId: postId, wishTypeId: wishTypeId ?? null });
        await tx.update(posts).set({ wishCount: sql`${posts.wishCount} + 1` }).where(eq(posts.id, postId));
      });
    }
    const dto = await this.getOne(postId, ctx);
    return { wishes: dto.counts.wishes, wishBreakdown: dto.wishBreakdown };
  }

  async votePoll(userId: string, postId: string, optionId: string, ctx: RequestContext): Promise<PollDto> {
    const post = await this.assertPublished(postId);
    if (!post.poll?.options.some((o) => o.id === optionId)) throw new DomainError('POLL_INVALID');
    await this.db.insert(pollVotes).values({ postId, userId, optionId }).onConflictDoNothing();
    const dto = await this.getOne(postId, ctx);
    if (!dto.poll) throw new DomainError('POLL_INVALID');
    return dto.poll;
  }

  /* ---- Bình luận ---- */
  async comments(postId: string, ctx: RequestContext, page: number, pageSize: number): Promise<ApiPaged<CommentDto>> {
    await this.assertPublished(postId);
    const levels: LevelDto[] = await this.levels.all();
    const rows = await this.db.select({ c: comments, author: authorColumns }).from(comments).innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.postId, postId), eq(comments.status, 'published'))).orderBy(asc(comments.createdAt)).limit(pageSize + 1).offset(offsetOf(page, pageSize));
    const items = rows.map((r): CommentDto => ({ id: r.c.id, body: r.c.body, author: userSummary(r.author, levels), createdAt: iso(r.c.createdAt), isOwn: r.c.userId === ctx.user?.id }));
    return paged(items, page, pageSize);
  }

  async addComment(userId: string, postId: string, text: string, ctx: RequestContext): Promise<CommentDto> {
    const s = await this.settings.get();
    await this.rate.assert(`comment:${userId}`, s.rateLimits.commentPerMinute, 60);
    const post = await this.assertPublished(postId);
    const body = text.trim();
    if (body.length > s.commentMaxChars) throw new DomainError('COMMENT_TOO_LONG', { max: s.commentMaxChars });
    const verdict = await this.keywords.check(body);
    if (verdict === 'block') throw new DomainError('COMMENT_CONTENT_BLOCKED');
    const commentId = await this.db.transaction(async (tx) => {
      const [row] = await tx.insert(comments).values({ postId, userId, body }).returning({ id: comments.id });
      await tx.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, postId));
      return row?.id ?? '';
    });
    if (verdict === 'review') await this.reports.autoFlag('comment', commentId);
    if (post.authorId !== userId) {
      const [actor] = await this.db.select({ n: users.displayName }).from(users).where(eq(users.id, userId));
      await this.notifications.push(post.authorId, 'post_commented', { postId, actorName: actor?.n ?? '' });
    }
    const [author] = await this.db.select(authorColumns).from(users).where(eq(users.id, userId));
    if (!author) throw new DomainError('USER_NOT_FOUND');
    const created = await this.db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    return { id: commentId, body, author: userSummary(author, await this.levels.all()), createdAt: iso(created[0]?.createdAt ?? new Date()), isOwn: ctx.user?.id === userId };
  }
}
