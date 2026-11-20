import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  AutoRepliesSchema, IdParamSchema, PageQuerySchema, PlaceInputSchema, PlaceListQuerySchema, PlaceRankQuerySchema, PlaceSlugParamSchema, PlaceUpdateSchema,
  type AutoReplies, type PlaceInput, type PlaceListQuery, type PlaceRankQuery, type PlaceUpdate,
} from '@chot-via/shared';
import { Auth, Ctx, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { ZodPipe } from '../../common/zod.pipe';
import { PlacesService } from './places.service';

const IdParam = new ZodPipe(IdParamSchema);

@Controller('places')
export class PlacesController {
  constructor(@Inject(PlacesService) private readonly places: PlacesService) {}

  @Get()
  list(@Ctx() ctx: RequestContext, @Query(new ZodPipe(PlaceListQuerySchema)) query: PlaceListQuery) {
    return this.places.list(query, ctx);
  }

  @Get('leaderboard')
  async leaderboard(@Query(new ZodPipe(PlaceRankQuerySchema)) query: PlaceRankQuery) {
    return ok('OK', await this.places.weeklyLeaderboard(query.kind, query.limit));
  }

  @Get('random')
  async random() {
    return ok('OK', await this.places.random());
  }

  @Get('mine')
  @Auth()
  async mine(@Ctx() ctx: RequestContext) {
    return ok('OK', await this.places.mine(requireUser(ctx).id));
  }

  @Post()
  @Auth()
  async create(@Ctx() ctx: RequestContext, @Body(new ZodPipe(PlaceInputSchema)) body: PlaceInput) {
    return ok('PLACE_CREATED', await this.places.createByMember(requireUser(ctx).id, body, ctx));
  }

  @Get(':idOrSlug')
  async detail(@Ctx() ctx: RequestContext, @Param(new ZodPipe(PlaceSlugParamSchema)) params: { idOrSlug: string }) {
    return ok('OK', await this.places.detail(params.idOrSlug, ctx));
  }

  @Patch(':id')
  @Auth()
  async update(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(PlaceUpdateSchema)) body: PlaceUpdate) {
    return ok('PLACE_UPDATED', await this.places.updateByOwner(requireUser(ctx).id, params.id, body, ctx));
  }

  @Delete(':id')
  @Auth()
  async remove(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    await this.places.removeByOwner(requireUser(ctx).id, params.id);
    return ok('DELETED', { ok: true as const });
  }

  @Get(':id/auto-replies')
  @Auth()
  async autoReplies(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.places.autoRepliesOf(requireUser(ctx).id, params.id));
  }

  @Put(':id/auto-replies')
  @Auth()
  async setAutoReplies(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(AutoRepliesSchema)) body: AutoReplies) {
    return ok('UPDATED', await this.places.setAutoReplies(requireUser(ctx).id, params.id, body));
  }

  @Get(':id/wishes')
  wishes(@Param(IdParam) params: { id: string }, @Query(new ZodPipe(PageQuerySchema)) query: { page: number; pageSize: number }) {
    return this.places.wishesOf(params.id, query.page, query.pageSize);
  }

  @Post(':idOrSlug/visits')
  async visit(@Ctx() ctx: RequestContext, @Param(new ZodPipe(PlaceSlugParamSchema)) params: { idOrSlug: string }) {
    await this.places.visit(params.idOrSlug, ctx);
    return ok('OK', { ok: true as const });
  }

  @Put(':id/like')
  @Auth()
  async like(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.places.toggleLike(params.id, requireUser(ctx).id, true));
  }

  @Delete(':id/like')
  @Auth()
  async unlike(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.places.toggleLike(params.id, requireUser(ctx).id, false));
  }

  @Put(':id/follow')
  @Auth()
  async follow(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.places.toggleFollow(params.id, requireUser(ctx).id, true));
  }

  @Delete(':id/follow')
  @Auth()
  async unfollow(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.places.toggleFollow(params.id, requireUser(ctx).id, false));
  }
}
