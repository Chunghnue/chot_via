import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { DeityWishBodySchema, IdParamSchema, PlaceWishBodySchema, type DeityWishBody, type PlaceWishBody } from '@xin-via/shared';
import { Auth, Ctx, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { ZodPipe } from '../../common/zod.pipe';
import { WishesService } from './wishes.service';

@Controller()
export class WishesController {
  constructor(@Inject(WishesService) private readonly wishes: WishesService) {}

  @Get('wishes/offline-pack')
  async offlinePack() {
    return ok('OK', await this.wishes.offlinePack());
  }

  @Get('wishes/deity/today')
  @Auth()
  async deityToday(@Ctx() ctx: RequestContext) {
    return ok('OK', await this.wishes.deityToday(requireUser(ctx).id));
  }

  @Post('wishes/deity')
  async deity(@Ctx() ctx: RequestContext, @Body(new ZodPipe(DeityWishBodySchema)) body: DeityWishBody) {
    return ok('WISH_RECEIVED', await this.wishes.deity(ctx, body));
  }

  @Post('places/:id/wishes')
  async place(@Ctx() ctx: RequestContext, @Param(new ZodPipe(IdParamSchema)) params: { id: string }, @Body(new ZodPipe(PlaceWishBodySchema)) body: PlaceWishBody) {
    return ok('WISH_SENT', await this.wishes.place(ctx, params.id, body));
  }
}
