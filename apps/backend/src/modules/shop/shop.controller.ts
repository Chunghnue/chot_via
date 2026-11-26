import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { ShopCatalogSchema, type ShopCatalog } from '@chot-via/shared';
import { Ctx, Roles, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { ZodPipe } from '../../common/zod.pipe';
import { AdminService } from '../admin/admin.service';
import { ShopService } from './shop.service';

/** Bảng giá và vật phẩm: công khai để đọc, chỉ admin được sửa. */
@Controller()
export class ShopController {
  constructor(
    @Inject(ShopService) private readonly shop: ShopService,
    @Inject(AdminService) private readonly admin: AdminService,
  ) {}

  @Get('shop')
  async publicShop() {
    return ok('OK', await this.shop.getPublic());
  }

  @Get('admin/shop')
  @Roles('admin')
  async adminShop() {
    return ok('OK', await this.shop.get());
  }

  @Put('admin/shop')
  @Roles('admin')
  async saveShop(@Ctx() ctx: RequestContext, @Body(new ZodPipe(ShopCatalogSchema)) body: ShopCatalog) {
    const user = requireUser(ctx);
    if (user.accountRole !== 'admin') throw new DomainError('COMMON_FORBIDDEN');
    const saved = await this.shop.save(body);
    await this.admin.audit(user.id, 'shop.update', 'settings', null);
    return ok('UPDATED', saved);
  }
}
