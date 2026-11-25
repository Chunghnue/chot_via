import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { PointAction } from '@chot-via/shared';
import type { DbOrTx } from '../../database/database';
import { pointLedger, users } from '../../database/schema';

@Injectable()
export class PointsService {
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
}
