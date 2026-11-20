import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { NotificationSchema, type NotificationDto, type NotificationType } from '@chot-via/shared';
import { DB, type Db, type DbOrTx } from '../../database/database';
import { notifications } from '../../database/schema';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async push(userId: string, type: NotificationType, params: Record<string, string | null>, tx?: DbOrTx): Promise<void> {
    await (tx ?? this.db).insert(notifications).values({ userId, type, params });
  }

  async list(userId: string, page: number, pageSize: number): Promise<{ items: NotificationDto[]; hasMore: boolean; unread: number }> {
    const rows = await this.db.select().from(notifications).where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)).limit(pageSize + 1).offset((page - 1) * pageSize);
    const [unread] = await this.db.select({ n: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    const items: NotificationDto[] = [];
    for (const row of rows.slice(0, pageSize)) {
      const parsed = NotificationSchema.safeParse({ id: row.id, type: row.type, params: row.params, readAt: row.readAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() });
      if (parsed.success) items.push(parsed.data);
    }
    return { items, hasMore: rows.length > pageSize, unread: unread?.n ?? 0 };
  }

  /** Không truyền `ids` thì đánh dấu tất cả; luôn giới hạn trong thông báo của chính người dùng. */
  async markRead(userId: string, ids?: string[]): Promise<void> {
    const own = and(eq(notifications.userId, userId), isNull(notifications.readAt));
    await this.db.update(notifications).set({ readAt: new Date() }).where(ids ? and(own, inArray(notifications.id, ids)) : own);
  }
}
