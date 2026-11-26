import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { PollDto, ReactionCountsDto, ReactionType, WishCountDto } from '@chot-via/shared';
import type { RequestContext } from '../../common/access';
import { DomainError } from '../../common/domain-error';
import { RateLimitService } from '../../common/rate-limit.service';
import { SettingsService } from '../../common/settings.service';
import { DB, type Db } from '../../database/database';
import { pollVotes, posts, postShares, reactions, savedPosts, users, wishEvents, wishTypes } from '../../database/schema';
import { PointsService } from '../gamification/points.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostsService } from './posts.service';

/** Tương tác với bài viết: cảm xúc, lưu, chia sẻ, gửi vía, bình chọn. Chủ bài được điểm khi người khác tương tác lần đầu (xem `PointsService.awardPostEngagement`). */
@Injectable()
export class PostInteractionsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(PointsService) private readonly points: PointsService,
    @Inject(PostsService) private readonly postsService: PostsService,
  ) {}

  async setReaction(userId: string, postId: string, type: ReactionType | null): Promise<{ reactions: number; mine: ReactionType | null; reactionCounts: ReactionCountsDto }> {
    const post = await this.postsService.assertPublished(postId);
    let fresh = false;
    await this.db.transaction(async (tx) => {
      if (type) {
        const prev = await tx.select({ t: reactions.type }).from(reactions).where(and(eq(reactions.postId, postId), eq(reactions.userId, userId))).limit(1);
        await tx.insert(reactions).values({ postId, userId, type }).onConflictDoUpdate({ target: [reactions.postId, reactions.userId], set: { type } });
        await this.points.awardPostEngagement(tx, post.authorId, userId, postId);
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
    const kinds = await this.db.select({ type: reactions.type, n: sql<number>`count(*)::int` }).from(reactions).where(eq(reactions.postId, postId)).groupBy(reactions.type);
    const of = (k: ReactionType): number => kinds.find((x) => x.type === k)?.n ?? 0;
    return { reactions: after?.n ?? 0, mine: type, reactionCounts: { like: of('like'), love: of('love'), haha: of('haha') } };
  }

  async setSaved(userId: string, postId: string, on: boolean): Promise<boolean> {
    await this.postsService.assertPublished(postId);
    if (on) await this.db.insert(savedPosts).values({ userId, postId }).onConflictDoNothing();
    else await this.db.delete(savedPosts).where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
    return on;
  }

  /** Chia sẻ: mỗi người/khách chỉ tính một lần cho mỗi bài (tương tác hợp lệ). */
  async share(ctx: RequestContext, postId: string): Promise<number> {
    await this.postsService.assertPublished(postId);
    const ins = await this.db.insert(postShares).values({ postId, actorKey: ctx.actorKey }).onConflictDoNothing().returning({ id: postShares.postId });
    if (ins.length) await this.db.update(posts).set({ shareCount: sql`${posts.shareCount} + 1` }).where(eq(posts.id, postId));
    const [after] = await this.db.select({ n: posts.shareCount }).from(posts).where(eq(posts.id, postId));
    return after?.n ?? 0;
  }

  /** Gửi vía động viên cho bài viết: mỗi người gửi mỗi loại vía một lần cho mỗi bài (bấm lại loại đã gửi thì không đổi); chủ bài được +1 điểm khi người KHÁC (thành viên) tương tác lần đầu với bài (xem `awardPostEngagement`). */
  async wishPost(ctx: RequestContext, postId: string, wishTypeId: string | undefined): Promise<{ wishes: number; wishBreakdown: WishCountDto[] }> {
    const s = await this.settings.get();
    await this.rate.assert(`wish:${ctx.actorKey}`, s.rateLimits.wishPerMinute, 60);
    const post = await this.postsService.assertPublished(postId);
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
        if (ctx.user) await this.points.awardPostEngagement(tx, post.authorId, ctx.user.id, postId);
      });
    }
    const dto = await this.postsService.getOne(postId, ctx);
    return { wishes: dto.counts.wishes, wishBreakdown: dto.wishBreakdown };
  }

  async votePoll(userId: string, postId: string, optionId: string, ctx: RequestContext): Promise<PollDto> {
    const post = await this.postsService.assertPublished(postId);
    if (!post.poll?.options.some((o) => o.id === optionId)) throw new DomainError('POLL_INVALID');
    await this.db.insert(pollVotes).values({ postId, userId, optionId }).onConflictDoNothing();
    const dto = await this.postsService.getOne(postId, ctx);
    if (!dto.poll) throw new DomainError('POLL_INVALID');
    return dto.poll;
  }
}
