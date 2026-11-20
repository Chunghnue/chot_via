import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { MyReportDto, ReportBody } from '@chot-via/shared';
import type { RequestContext } from '../../common/access';
import { DomainError } from '../../common/domain-error';
import { iso } from '../../common/mappers';
import { RateLimitService } from '../../common/rate-limit.service';
import { SettingsService } from '../../common/settings.service';
import { TurnstileService } from '../../common/turnstile.service';
import { DB, type Db } from '../../database/database';
import { comments, places, posts, reports } from '../../database/schema';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
    @Inject(TurnstileService) private readonly turnstile: TurnstileService,
  ) {}

  private async targetExists(type: ReportBody['targetType'], id: string): Promise<boolean> {
    if (type === 'post') return (await this.db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1)).length > 0;
    if (type === 'comment') return (await this.db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1)).length > 0;
    return (await this.db.select({ id: places.id }).from(places).where(eq(places.id, id)).limit(1)).length > 0;
  }

  /** C10: khách cũng được báo cáo; mỗi người chỉ báo cáo một lần/đối tượng và bị giới hạn theo ngày để chống báo cáo hàng loạt. */
  async create(ctx: RequestContext, body: ReportBody): Promise<void> {
    await this.turnstile.assertHuman(body.turnstileToken, ctx.ip, false);
    const { rateLimits } = await this.settings.get();
    await this.rate.assert(`report:${ctx.actorKey}`, rateLimits.reportPerDay, 86_400);
    if (!(await this.targetExists(body.targetType, body.targetId))) throw new DomainError('REPORT_TARGET_NOT_FOUND');
    const inserted = await this.db.insert(reports).values({
      targetType: body.targetType, targetId: body.targetId, reason: body.reason, detail: body.detail ?? null,
      reporterUserId: ctx.user?.id ?? null, reporterKey: ctx.actorKey,
    }).onConflictDoNothing().returning({ id: reports.id });
    if (inserted.length === 0) throw new DomainError('REPORT_DUPLICATE');
  }

  /** Từ khóa nhạy cảm mức "review": nội dung vẫn đăng (đăng trước, kiểm duyệt sau) nhưng vào hàng chờ. */
  async autoFlag(targetType: ReportBody['targetType'], targetId: string): Promise<void> {
    await this.db.insert(reports).values({ targetType, targetId, reason: 'inappropriate', reporterKey: 'auto:keyword', isAuto: true }).onConflictDoNothing();
  }

  async mine(userId: string): Promise<MyReportDto[]> {
    const rows = await this.db.select().from(reports).where(and(eq(reports.reporterUserId, userId), eq(reports.isAuto, false))).orderBy(desc(reports.createdAt)).limit(100);
    return rows.map((r) => ({ id: r.id, targetType: r.targetType, reason: r.reason, state: r.state, createdAt: iso(r.createdAt) }));
  }
}
