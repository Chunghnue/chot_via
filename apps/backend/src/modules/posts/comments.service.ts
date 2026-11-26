import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, and, sql } from 'drizzle-orm';
import type { CommentDto, LevelDto } from '@chot-via/shared';
import type { RequestContext } from '../../common/access';
import { offsetOf, paged, type ApiPaged } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { iso, userSummary } from '../../common/mappers';
import { RateLimitService } from '../../common/rate-limit.service';
import { SettingsService } from '../../common/settings.service';
import { DB, type Db } from '../../database/database';
import { comments, posts, users } from '../../database/schema';
import { LevelsService } from '../gamification/levels.service';
import { KeywordsService } from '../moderation/keywords.service';
import { ReportsService } from '../moderation/reports.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostsService, authorColumns } from './posts.service';

/** Bình luận bài viết: danh sách và thêm mới (kiểm tra từ khóa chặn, giới hạn tốc độ, thông báo cho chủ bài). */
@Injectable()
export class CommentsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
    @Inject(LevelsService) private readonly levels: LevelsService,
    @Inject(KeywordsService) private readonly keywords: KeywordsService,
    @Inject(ReportsService) private readonly reports: ReportsService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(PostsService) private readonly postsService: PostsService,
  ) {}

  async comments(postId: string, ctx: RequestContext, page: number, pageSize: number): Promise<ApiPaged<CommentDto>> {
    await this.postsService.assertPublished(postId);
    const levels: LevelDto[] = await this.levels.all();
    const rows = await this.db.select({ c: comments, author: authorColumns }).from(comments).innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.postId, postId), eq(comments.status, 'published'))).orderBy(asc(comments.createdAt)).limit(pageSize + 1).offset(offsetOf(page, pageSize));
    const items = rows.map((r): CommentDto => ({ id: r.c.id, body: r.c.body, author: userSummary(r.author, levels), createdAt: iso(r.c.createdAt), isOwn: r.c.userId === ctx.user?.id }));
    return paged(items, page, pageSize);
  }

  async addComment(userId: string, postId: string, text: string, ctx: RequestContext): Promise<CommentDto> {
    const s = await this.settings.get();
    await this.rate.assert(`comment:${userId}`, s.rateLimits.commentPerMinute, 60);
    const post = await this.postsService.assertPublished(postId);
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
