import { Controller, Get, Inject } from '@nestjs/common';
import { and, asc, count, eq, gte, inArray } from 'drizzle-orm';
import { vnDayStart, type CatalogDto, type HomeDto } from '@xin-via/shared';
import { ok } from '../../common/api';
import { SettingsService } from '../../common/settings.service';
import { env } from '../../config/env';
import { DB, type Db } from '../../database/database';
import { placeCategories, posts, sceneTemplates, users, wishEvents, wishStickers, wishTypes } from '../../database/schema';
import { OAuthService } from '../auth/oauth.service';
import { PlacesService } from '../places/places.service';
import { HomeLayoutService } from './home-layout.service';

@Controller()
export class CatalogController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(OAuthService) private readonly oauth: OAuthService,
    @Inject(PlacesService) private readonly places: PlacesService,
    @Inject(HomeLayoutService) private readonly homeLayout: HomeLayoutService,
  ) {}

  /** Danh mục dùng chung cho cả hai web: loại vía, sticker, ngành nghề, mẫu 3D, cài đặt công khai. */
  @Get('catalog')
  async catalog() {
    const [types, stickers, categories, templates, settings] = await Promise.all([
      this.db.select().from(wishTypes).where(eq(wishTypes.active, true)).orderBy(asc(wishTypes.sortOrder)),
      this.db.select().from(wishStickers).where(eq(wishStickers.active, true)).orderBy(asc(wishStickers.sortOrder)),
      this.db.select().from(placeCategories).where(eq(placeCategories.active, true)).orderBy(asc(placeCategories.sortOrder)),
      this.db.select().from(sceneTemplates).where(eq(sceneTemplates.active, true)),
      this.settings.getPublic(),
    ]);
    const data: CatalogDto = {
      wishTypes: types.map((t) => ({ id: t.id, code: t.code, name: t.name, iconKey: t.iconKey, sortOrder: t.sortOrder })),
      stickers: stickers.map((t) => ({ id: t.id, code: t.code, name: t.name, iconKey: t.iconKey })),
      categories: categories.map((c) => ({ id: c.id, code: c.code, name: c.name, iconKey: c.iconKey, kind: c.kind, sortOrder: c.sortOrder })),
      sceneTemplates: templates.map((t) => ({ id: t.id, name: t.name, kind: t.kind, modelKey: t.modelKey, thumbnailUrl: t.thumbnailUrl })),
      settings,
      authProviders: { google: this.oauth.isEnabled('google'), facebook: this.oauth.isEnabled('facebook'), apple: this.oauth.isEnabled('apple') },
      devOtpHint: env.SMS_PROVIDER === 'dev' && env.NODE_ENV !== 'production' ? env.DEV_FIXED_OTP : null,
    };
    return ok('OK', data);
  }

  @Get('home')
  async home() {
    const [members] = await this.db.select({ n: count() }).from(users).where(eq(users.status, 'active'));
    const [today] = await this.db.select({ n: count() }).from(posts).where(and(eq(posts.status, 'published'), gte(posts.createdAt, vnDayStart(new Date()))));
    const [wishes] = await this.db.select({ n: count() }).from(wishEvents).where(inArray(wishEvents.source, ['deity', 'place']));
    const data: HomeDto = {
      heroPlaces: await this.places.heroPlaces(16),
      stats: { members: members?.n ?? 0, postsToday: today?.n ?? 0, wishesTotal: wishes?.n ?? 0 },
      layout: await this.homeLayout.layout(),
    };
    return ok('OK', data);
  }
}
