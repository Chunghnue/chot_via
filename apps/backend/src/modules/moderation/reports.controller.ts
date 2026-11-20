import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ReportBodySchema, type ReportBody } from '@chot-via/shared';
import { Auth, Ctx, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { ZodPipe } from '../../common/zod.pipe';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Post('reports')
  async create(@Ctx() ctx: RequestContext, @Body(new ZodPipe(ReportBodySchema)) body: ReportBody) {
    await this.reports.create(ctx, body);
    return ok('REPORT_RECEIVED', { ok: true as const });
  }

  @Get('me/reports')
  @Auth()
  async mine(@Ctx() ctx: RequestContext) {
    return ok('OK', await this.reports.mine(requireUser(ctx).id));
  }
}
