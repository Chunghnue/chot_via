import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { DemoPostInput, DemoPostItem, DemoUserInput, DemoUserItem } from '@chot-via/shared';
import { DomainError } from '../../common/domain-error';
import { DB, type Db } from '../../database/database';
import { achievements, postMedia, posts, users } from '../../database/schema';

const HOUR = 3_600_000;

/** Quản lý tài khoản mẫu và bài mẫu (is_demo = true) ngay trong web admin; không đụng tới dữ liệu người dùng thật. */
@Injectable()
export class AdminDemoService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async listUsers(): Promise<DemoUserItem[]> {
    const rows = await this.db.select().from(users).where(eq(users.isDemo, true)).orderBy(asc(users.displayName));
    return rows.map((u) => ({
      id: u.id, displayName: u.displayName, memberRole: u.memberRole, jobTitle: u.jobTitle, province: u.province, avatarUrl: u.avatarUrl, status: u.status, createdAt: u.createdAt.toISOString(),
    }));
  }

  async createUser(body: DemoUserInput): Promise<DemoUserItem> {
    const [row] = await this.db.insert(users).values({ ...body, isDemo: true }).returning();
    if (!row) throw new DomainError('COMMON_NOT_FOUND');
    return { id: row.id, displayName: row.displayName, memberRole: row.memberRole, jobTitle: row.jobTitle, province: row.province, avatarUrl: row.avatarUrl, status: row.status, createdAt: row.createdAt.toISOString() };
  }

  async updateUser(id: string, body: DemoUserInput): Promise<void> {
    const [row] = await this.db.update(users).set(body).where(and(eq(users.id, id), eq(users.isDemo, true))).returning({ id: users.id });
    if (!row) throw new DomainError('COMMON_NOT_FOUND');
  }

  async deleteUser(id: string): Promise<void> {
    const [row] = await this.db.delete(users).where(and(eq(users.id, id), eq(users.isDemo, true))).returning({ id: users.id });
    if (!row) throw new DomainError('COMMON_NOT_FOUND');
  }

  async listPosts(): Promise<DemoPostItem[]> {
    const rows = await this.db.select({ post: posts, authorName: users.displayName }).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(eq(posts.isDemo, true)).orderBy(desc(posts.createdAt));
    const ids = rows.map((r) => r.post.id);
    const media = ids.length ? await this.db.select().from(postMedia).where(inArray(postMedia.postId, ids)).orderBy(asc(postMedia.position)) : [];
    return rows.map(({ post, authorName }): DemoPostItem => ({
      id: post.id, authorId: post.authorId, authorName, type: post.type === 'achievement' ? 'achievement' : 'story', body: post.body, hashtags: post.hashtags,
      imageUrl: media.find((m) => m.postId === post.id)?.url ?? null, pinned: post.pinnedAt !== null,
      reactionCount: post.reactionCount, commentCount: post.commentCount, shareCount: post.shareCount, createdAt: post.createdAt.toISOString(),
    }));
  }

  private async authorRole(authorId: string): Promise<'owner' | 'sale' | null> {
    const [u] = await this.db.select({ role: users.memberRole }).from(users).where(and(eq(users.id, authorId), eq(users.isDemo, true))).limit(1);
    if (!u) throw new DomainError('COMMON_NOT_FOUND');
    return u.role;
  }

  async createPost(body: DemoPostInput): Promise<void> {
    const role = await this.authorRole(body.authorId);
    const [post] = await this.db.insert(posts).values({
      authorId: body.authorId, type: body.type, role: body.type === 'achievement' ? role : null, body: body.body, hashtags: body.hashtags, isDemo: true,
      pinnedAt: body.pinned ? new Date() : null, reactionCount: body.reactionCount, commentCount: body.commentCount, shareCount: body.shareCount,
      createdAt: new Date(Date.now() - body.hoursAgo * HOUR),
    }).returning({ id: posts.id });
    if (!post) return;
    if (body.type === 'achievement') await this.db.insert(achievements).values({ postId: post.id, metricType: role === 'sale' ? 'deal' : 'revenue', displayMode: 'hidden' });
    if (body.imageUrl) await this.db.insert(postMedia).values({ postId: post.id, ownerId: body.authorId, url: body.imageUrl });
  }

  async updatePost(id: string, body: DemoPostInput): Promise<void> {
    const role = await this.authorRole(body.authorId);
    const [post] = await this.db.update(posts).set({
      authorId: body.authorId, type: body.type, role: body.type === 'achievement' ? role : null, body: body.body, hashtags: body.hashtags,
      pinnedAt: body.pinned ? new Date() : null, reactionCount: body.reactionCount, commentCount: body.commentCount, shareCount: body.shareCount,
      createdAt: new Date(Date.now() - body.hoursAgo * HOUR), updatedAt: new Date(),
    }).where(and(eq(posts.id, id), eq(posts.isDemo, true))).returning({ id: posts.id });
    if (!post) throw new DomainError('COMMON_NOT_FOUND');
    await this.db.delete(postMedia).where(eq(postMedia.postId, id));
    if (body.imageUrl) await this.db.insert(postMedia).values({ postId: id, ownerId: body.authorId, url: body.imageUrl });
  }

  async deletePost(id: string): Promise<void> {
    const [post] = await this.db.delete(posts).where(and(eq(posts.id, id), eq(posts.isDemo, true))).returning({ id: posts.id });
    if (!post) throw new DomainError('COMMON_NOT_FOUND');
  }
}
