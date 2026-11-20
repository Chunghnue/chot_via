import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { IdParamSchema, LeaderboardQuerySchema, MarkNotificationsReadBodySchema, NotificationQuerySchema, UpdateMeBodySchema, type MarkNotificationsReadBody, type UpdateMeBody } from '@chot-via/shared';
import { Auth, Ctx, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { ZodPipe } from '../../common/zod.pipe';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from './users.service';

const IdParam = new ZodPipe(IdParamSchema);

@Controller()
export class UsersController {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  @Get('me')
  @Auth()
  async me(@Ctx() ctx: RequestContext) {
    return ok('OK', await this.users.me(requireUser(ctx).id));
  }

  @Patch('me')
  @Auth()
  async update(@Ctx() ctx: RequestContext, @Body(new ZodPipe(UpdateMeBodySchema)) body: UpdateMeBody) {
    return ok('PROFILE_UPDATED', await this.users.updateMe(requireUser(ctx).id, body));
  }

  @Get('me/stats')
  @Auth()
  async stats(@Ctx() ctx: RequestContext) {
    return ok('OK', await this.users.stats(requireUser(ctx).id));
  }

  @Get('me/notifications')
  @Auth()
  async notificationList(@Ctx() ctx: RequestContext, @Query(new ZodPipe(NotificationQuerySchema)) query: { page: number; pageSize: number }) {
    const result = await this.notifications.list(requireUser(ctx).id, query.page, query.pageSize);
    return { code: 'OK' as const, data: { items: result.items, unread: result.unread }, meta: { page: query.page, pageSize: query.pageSize, hasMore: result.hasMore } };
  }

  @Post('me/notifications/read')
  @Auth()
  async markRead(@Ctx() ctx: RequestContext, @Body(new ZodPipe(MarkNotificationsReadBodySchema)) body: MarkNotificationsReadBody) {
    await this.notifications.markRead(requireUser(ctx).id, body.ids);
    return ok('OK', { ok: true as const });
  }

  @Get('leaderboard')
  async leaderboard(@Ctx() ctx: RequestContext, @Query(new ZodPipe(LeaderboardQuerySchema)) query: { limit: number }) {
    return ok('OK', await this.users.leaderboard(query.limit, ctx.user?.id ?? null));
  }

  @Get('users/:id')
  async profile(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.users.publicProfile(params.id, ctx.user?.id ?? null));
  }

  @Put('users/:id/follow')
  @Auth()
  async follow(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.users.setFollow(requireUser(ctx).id, params.id, true));
  }

  @Delete('users/:id/follow')
  @Auth()
  async unfollow(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.users.setFollow(requireUser(ctx).id, params.id, false));
  }

  @Put('users/:id/block')
  @Auth()
  async block(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', { blocked: await this.users.setBlock(requireUser(ctx).id, params.id, true) });
  }

  @Delete('users/:id/block')
  @Auth()
  async unblock(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', { blocked: await this.users.setBlock(requireUser(ctx).id, params.id, false) });
  }
}
