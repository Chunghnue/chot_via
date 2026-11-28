import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import {
  getTimeBucket, resolveWishTitleCode, vnDayStart, type AnimationKey, type DeityToday, type DeityWishBody, type DeityWishResult, type OfflinePack, type PlaceWishBody,
  type PlaceWishResult, type WishText,
} from '@xin-via/shared';
import { DomainError } from '../../common/domain-error';
import type { RequestContext } from '../../common/access';
import { RateLimitService } from '../../common/rate-limit.service';
import { SettingsService } from '../../common/settings.service';
import { TurnstileService } from '../../common/turnstile.service';
import { DB, type Db } from '../../database/database';
import { placeAutoReplies, places, users, wishEvents, wishStickers, wishTemplates, wishTypes } from '../../database/schema';
import { PointsService } from '../gamification/points.service';
import { KeywordsService } from '../moderation/keywords.service';
import { NotificationsService } from '../notifications/notifications.service';

function pick<T extends { id: string }>(list: T[], excludeId?: string): T | undefined {
  const pool = excludeId && list.length > 1 ? list.filter((item) => item.id !== excludeId) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

@Injectable()
export class WishesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
    @Inject(TurnstileService) private readonly turnstile: TurnstileService,
    @Inject(PointsService) private readonly points: PointsService,
    @Inject(KeywordsService) private readonly keywords: KeywordsService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  private async throttle(ctx: RequestContext): Promise<void> {
    const { rateLimits } = await this.settings.get();
    await this.rate.assert(`wish:${ctx.actorKey}`, rateLimits.wishPerMinute, 60);
    await this.rate.assert(`wish-ip:${ctx.ip}`, rateLimits.wishPerMinute * 3, 60);
  }

  async offlinePack(): Promise<OfflinePack> {
    const rows = await this.db.select().from(wishTemplates).where(and(eq(wishTemplates.active, true), eq(wishTemplates.source, 'offline')));
    return { texts: rows.map((r): WishText => ({ templateId: r.id, text: r.text, animationKey: r.animationKey })) };
  }

  /** Các lần xin vía Thần Tài hôm nay của thành viên (tiêu đề tính lại theo thứ tự và giờ Việt Nam), để các thiết bị cùng thấy một trạng thái. */
  async deityToday(userId: string): Promise<DeityToday> {
    const settings = await this.settings.get();
    const rows = await this.db.select({ at: wishEvents.createdAt }).from(wishEvents)
      .where(and(eq(wishEvents.source, 'deity'), eq(wishEvents.actorUserId, userId), gte(wishEvents.createdAt, vnDayStart(new Date())))).orderBy(asc(wishEvents.createdAt));
    return rows.map((r, i) => ({
      at: r.at.toISOString(),
      titleCode: resolveWishTitleCode({ sequence: i + 1, bucket: getTimeBucket(r.at, settings.timeWindows), campaignMode: settings.campaignMode }),
    }));
  }

  /** FR-02/FR-03: xin vía Thần Tài tức thì cho khách; thành viên được +1 điểm. */
  async deity(ctx: RequestContext, body: DeityWishBody): Promise<DeityWishResult> {
    await this.turnstile.assertHuman(body.turnstileToken, ctx.ip, false);
    await this.throttle(ctx);
    const settings = await this.settings.get();
    const now = new Date();
    const bucket = getTimeBucket(now, settings.timeWindows);
    const titleCode = resolveWishTitleCode({ sequence: body.sequence, bucket, campaignMode: settings.campaignMode });

    const candidates = await this.db.select().from(wishTemplates).where(and(
      eq(wishTemplates.source, 'deity'), eq(wishTemplates.active, true), or(isNull(wishTemplates.timeBucket), eq(wishTemplates.timeBucket, bucket)),
    ));
    const chosen = pick(candidates, body.lastTemplateId);
    if (!chosen) throw new DomainError('WISH_TEMPLATE_MISSING');

    const user = ctx.user;
    const total = await this.db.transaction(async (tx) => {
      const [event] = await tx.insert(wishEvents).values({ source: 'deity', actorUserId: user?.id ?? null, guestHash: user ? null : ctx.guestHash }).returning({ id: wishEvents.id });
      return user && event ? this.points.award(tx, user.id, 'deity_wish', event.id) : null;
    });
    return {
      wish: { templateId: chosen.id, text: chosen.text, animationKey: chosen.animationKey },
      titleCode, timeBucket: bucket, pointsAwarded: total === null ? 0 : 1, totalPoints: total,
    };
  }

  private async resolveReply(place: typeof places.$inferSelect, wishTypeId: string): Promise<{ kind: 'auto' | 'system'; text: string; animationKey: AnimationKey }> {
    if (place.autoReplyEnabled) {
      const [custom] = await this.db.select().from(placeAutoReplies).where(and(eq(placeAutoReplies.placeId, place.id), eq(placeAutoReplies.wishTypeId, wishTypeId))).limit(1);
      if (custom) return { kind: 'auto', text: custom.text, animationKey: 'sparkle' };
      const role = place.kind === 'sale_office' ? 'sale' : 'owner';
      const defaults = await this.db.select().from(wishTemplates).where(and(
        eq(wishTemplates.source, 'auto_reply'), eq(wishTemplates.active, true), eq(wishTemplates.wishTypeId, wishTypeId),
        or(isNull(wishTemplates.roleTarget), eq(wishTemplates.roleTarget, role)),
      ));
      const found = pick(defaults);
      if (found) return { kind: 'auto', text: found.text, animationKey: found.animationKey };
    }
    const thanks = pick(await this.db.select().from(wishTemplates).where(and(eq(wishTemplates.source, 'system_thanks'), eq(wishTemplates.active, true))));
    if (!thanks) throw new DomainError('WISH_TEMPLATE_MISSING');
    return { kind: 'system', text: thanks.text, animationKey: thanks.animationKey };
  }

  /** FR-04/FR-05: gửi vía tới cửa hàng/sale; phản hồi luôn mang nhãn nguồn (tự động hoặc hệ thống). */
  async place(ctx: RequestContext, placeId: string, body: PlaceWishBody): Promise<PlaceWishResult> {
    await this.turnstile.assertHuman(body.turnstileToken, ctx.ip, false);
    await this.throttle(ctx);
    const settings = await this.settings.get();
    const [place] = await this.db.select().from(places).where(and(eq(places.id, placeId), eq(places.status, 'visible'))).limit(1);
    if (!place) throw new DomainError('PLACE_NOT_FOUND');
    const [type] = await this.db.select().from(wishTypes).where(and(eq(wishTypes.id, body.wishTypeId), eq(wishTypes.active, true))).limit(1);
    if (!type) throw new DomainError('WISH_TYPE_INVALID');
    if (body.stickerId) {
      const [sticker] = await this.db.select({ id: wishStickers.id }).from(wishStickers).where(and(eq(wishStickers.id, body.stickerId), eq(wishStickers.active, true))).limit(1);
      if (!sticker) throw new DomainError('WISH_TYPE_INVALID');
    }
    const message = body.message?.trim() || null;
    if (message && message.length > settings.wishMessageMaxChars) throw new DomainError('WISH_MESSAGE_TOO_LONG', { max: settings.wishMessageMaxChars });
    if ((await this.keywords.check(message)) === 'block') throw new DomainError('WISH_CONTENT_BLOCKED');

    const reply = await this.resolveReply(place, type.id);
    const user = ctx.user;
    const { eventId, total } = await this.db.transaction(async (tx) => {
      const [event] = await tx.insert(wishEvents).values({
        source: 'place', actorUserId: user?.id ?? null, guestHash: user ? null : ctx.guestHash, targetPlaceId: place.id, wishTypeId: type.id,
        stickerId: body.stickerId ?? null, message, replyKind: reply.kind, replyText: reply.text,
      }).returning({ id: wishEvents.id });
      const id = event?.id ?? '';
      await tx.update(places).set({ wishCount: sql`${places.wishCount} + 1` }).where(eq(places.id, place.id));
      const action = place.kind === 'sale_office' ? 'place_wish_sale' : 'place_wish_store';
      return { eventId: id, total: user ? await this.points.award(tx, user.id, action, id) : null };
    });

    if (place.ownerId && place.ownerId !== user?.id) {
      let senderName: string | null = null;
      if (user) senderName = (await this.db.select({ n: users.displayName }).from(users).where(eq(users.id, user.id)).limit(1))[0]?.n ?? null;
      await this.notifications.push(place.ownerId, 'place_wished', { placeTitle: place.title, placeSlug: place.slug, wishTypeName: type.name, senderName });
    }
    return { eventId, placeTitle: place.title, reply, pointsAwarded: total === null ? 0 : 1, totalPoints: total };
  }
}
