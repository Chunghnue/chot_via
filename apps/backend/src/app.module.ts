import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AccessGuard } from './common/access';
import { AllExceptionsFilter } from './common/exception.filter';
import { RateLimitService } from './common/rate-limit.service';
import { SettingsService } from './common/settings.service';
import { TokenService } from './common/token.service';
import { TurnstileService } from './common/turnstile.service';
import { DB, createDb } from './database/database';
import { AdminCatalogService } from './modules/admin/admin-catalog.service';
import { AdminDemoService } from './modules/admin/admin-demo.service';
import { AdminController } from './modules/admin/admin.controller';
import { AdminService } from './modules/admin/admin.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { OAuthService } from './modules/auth/oauth.service';
import { SMS, createSmsProvider } from './modules/auth/sms';
import { CatalogController } from './modules/catalog/catalog.controller';
import { HomeLayoutService } from './modules/catalog/home-layout.service';
import { GamificationController } from './modules/gamification/gamification.controller';
import { LevelsService } from './modules/gamification/levels.service';
import { PointsService } from './modules/gamification/points.service';
import { MediaController } from './modules/media/media.controller';
import { StorageService } from './modules/media/storage.service';
import { KeywordsService } from './modules/moderation/keywords.service';
import { ReportsController } from './modules/moderation/reports.controller';
import { ReportsService } from './modules/moderation/reports.service';
import { NotificationsService } from './modules/notifications/notifications.service';
import { PlacesController } from './modules/places/places.controller';
import { PlacesService } from './modules/places/places.service';
import { PostsController } from './modules/posts/posts.controller';
import { CommentsService } from './modules/posts/comments.service';
import { PostInteractionsService } from './modules/posts/post-interactions.service';
import { PostsService } from './modules/posts/posts.service';
import { ShopController } from './modules/shop/shop.controller';
import { ShopService } from './modules/shop/shop.service';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { WishesController } from './modules/wishes/wishes.controller';
import { WishesService } from './modules/wishes/wishes.service';

@Module({
  controllers: [
    AuthController, CatalogController, WishesController, PlacesController, PostsController, UsersController,
    ReportsController, MediaController, GamificationController, AdminController, ShopController,
  ],
  providers: [
    { provide: DB, useFactory: () => createDb().db },
    { provide: SMS, useFactory: createSmsProvider },
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    SettingsService, TokenService, RateLimitService, TurnstileService, LevelsService, PointsService, KeywordsService,
    NotificationsService, ReportsService, WishesService, PlacesService, PostsService, PostInteractionsService, CommentsService, ShopService, UsersService, AuthService, OAuthService,
    StorageService, HomeLayoutService, AdminService, AdminCatalogService, AdminDemoService,
  ],
})
export class AppModule {}
