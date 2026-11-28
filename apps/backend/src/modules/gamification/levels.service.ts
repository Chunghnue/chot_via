import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql, and, inArray } from 'drizzle-orm';
import type { BadgeDto, LevelDto } from '@xin-via/shared';
import { DB, type Db } from '../../database/database';
import { badges, levels, pointLedger } from '../../database/schema';

const TTL_MS = 30_000;

@Injectable()
export class LevelsService {
  private cache: { value: LevelDto[]; at: number } | null = null;

  constructor(@Inject(DB) private readonly db: Db) {}

  /** Danh sách cấp độ sắp theo điểm tăng dần. */
  async all(): Promise<LevelDto[]> {
    if (this.cache && Date.now() - this.cache.at < TTL_MS) return this.cache.value;
    const rows = await this.db.select().from(levels).orderBy(asc(levels.minPoints));
    this.cache = { value: rows, at: Date.now() };
    return rows;
  }

  invalidate(): void {
    this.cache = null;
  }

  /** Huy hiệu đã đạt (điều kiện cấu hình bởi admin). */
  async badgesFor(userId: string, points: number): Promise<BadgeDto[]> {
    const [active, counts] = await Promise.all([
      this.db.select().from(badges).where(eq(badges.active, true)),
      this.wishCounts(userId),
    ]);
    const value = { total_points: points, deity_wishes: counts.deity, place_wishes: counts.place };
    return active.filter((b) => value[b.conditionType] >= b.threshold).map((b) => ({
      id: b.id, code: b.code, name: b.name, description: b.description, iconKey: b.iconKey, conditionType: b.conditionType, threshold: b.threshold,
    }));
  }

  async wishCounts(userId: string): Promise<{ deity: number; place: number }> {
    const rows = await this.db.select({ action: pointLedger.action, count: sql<number>`count(*)::int` })
      .from(pointLedger).where(and(eq(pointLedger.userId, userId), inArray(pointLedger.action, ['deity_wish', 'place_wish_store', 'place_wish_sale'])))
      .groupBy(pointLedger.action);
    let deity = 0;
    let place = 0;
    for (const row of rows) {
      if (row.action === 'deity_wish') deity += row.count;
      else place += row.count;
    }
    return { deity, place };
  }
}
