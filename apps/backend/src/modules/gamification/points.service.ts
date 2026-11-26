import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, sql } from 'drizzle-orm';
import { vnDayStart, type PointAction } from '@chot-via/shared';
import { SettingsService } from '../../common/settings.service';
import type { DbOrTx } from '../../database/database';
import { pointLedger, users } from '../../database/schema';

@Injectable()
export class PointsService {
  constructor(@Inject(SettingsService) private readonly settings: SettingsService) {}

  /**
   * +1 điểm cho thành viên khi một hành động vía thành công. Khóa duy nhất theo sự kiện vía
   * đảm bảo không cộng trùng. Trả về tổng điểm mới, hoặc null nếu không cộng (đã ghi trước đó).
   */
  async award(tx: DbOrTx, userId: string, action: PointAction, wishEventId: string): Promise<number | null> {
    const inserted = await tx.insert(pointLedger).values({ userId, action, points: 1, wishEventId }).onConflictDoNothing().returning({ id: pointLedger.id });
    if (inserted.length === 0) return null;
    const [row] = await tx.update(users).set({ points: sql`${users.points} + 1`, pointsUpdatedAt: new Date() }).where(eq(users.id, userId)).returning({ points: users.points });
    return row?.points ?? null;
  }

  /**
   * Điểm thưởng khi hoàn thành nhiệm vụ: mỗi (thành viên, nhiệm vụ, kỳ) chỉ ghi một lần (khóa duy nhất theo `periodKey` = ngày bắt đầu kỳ).
   * Trả về tổng điểm mới, hoặc null nếu kỳ này đã được thưởng.
   */
  async awardMission(tx: DbOrTx, userId: string, missionId: string, periodKey: string, points: number): Promise<number | null> {
    const inserted = await tx.insert(pointLedger).values({ userId, action: 'mission', points, missionId, periodKey }).onConflictDoNothing().returning({ id: pointLedger.id });
    if (inserted.length === 0) return null;
    const [row] = await tx.update(users).set({ points: sql`${users.points} + ${points}`, pointsUpdatedAt: new Date() }).where(eq(users.id, userId)).returning({ points: users.points });
    return row?.points ?? null;
  }

  /**
   * Điểm từ tương tác bài viết (mọi loại: thích, thả tim, haha, 6 biểu tượng gửi vía): chủ bài được `pointsPerInteraction` điểm (mặc định 1) cho mỗi người KHÁC tương tác lần đầu với bài, bất kể loại hay số lần.
   * Chống trùng: khóa duy nhất (bài, người tương tác). Trần `dailyCap` điểm/ngày (Cài đặt hệ thống) giờ Việt Nam cho chủ bài; khi chạm trần vẫn ghi một dòng 0 điểm để lượt này
   * không thể đổi thành điểm vào ngày hôm sau. Khóa dòng người dùng của chủ bài để hai tương tác đồng thời không vượt trần. Trả về tổng điểm mới, hoặc null nếu không cộng.
   */
  async awardPostEngagement(tx: DbOrTx, authorId: string, actorId: string, postId: string): Promise<number | null> {
    if (authorId === actorId) return null;
    await tx.select({ id: users.id }).from(users).where(eq(users.id, authorId)).for('update');
    const [used] = await tx.select({ n: sql<number>`coalesce(sum(${pointLedger.points}), 0)::int` }).from(pointLedger)
      .where(and(eq(pointLedger.userId, authorId), eq(pointLedger.action, 'post_engagement'), gte(pointLedger.createdAt, vnDayStart(new Date()))));
    const { dailyCap, pointsPerInteraction } = (await this.settings.get()).postEngagement;
    const points = Math.max(0, Math.min(pointsPerInteraction, dailyCap - (used?.n ?? 0)));
    const inserted = await tx
      .insert(pointLedger)
      .values({ userId: authorId, action: 'post_engagement', points, sourcePostId: postId, sourceActorId: actorId })
      .onConflictDoNothing()
      .returning({ id: pointLedger.id });
    if (inserted.length === 0 || points === 0) return null;
    const [row] = await tx.update(users).set({ points: sql`${users.points} + ${points}`, pointsUpdatedAt: new Date() }).where(eq(users.id, authorId)).returning({ points: users.points });
    return row?.points ?? null;
  }
}
