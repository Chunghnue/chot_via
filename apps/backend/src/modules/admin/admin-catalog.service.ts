import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import {
  ADMIN_RESOURCES, BadgeItemSchema, ChallengeItemSchema, EventItemSchema, HotTopicItemSchema, KeywordItemSchema, LevelItemSchema, MissionItemSchema,
  PlaceCategoryItemSchema, SceneTemplateItemSchema, HomeActionItemSchema, FooterLinkItemSchema, StreetSlotItemSchema, WishStickerItemSchema, WishTemplateItemSchema, WishTypeItemSchema, type AdminResourceKey,
} from '@chot-via/shared';
import { DomainError } from '../../common/domain-error';
import { DB, type Db } from '../../database/database';
import {
  badges, challenges, events, homeActions, homeFooterLinks, streetSlots, hotTopics, levels, missions, placeCategories, sceneTemplates, sensitiveKeywords, wishStickers, wishTemplates, wishTypes,
} from '../../database/schema';
import { LevelsService } from '../gamification/levels.service';
import { KeywordsService } from '../moderation/keywords.service';

type Table = PgTable & { id: PgColumn };

/** Mã lỗi Postgres nằm ở `cause` khi Drizzle bọc lỗi truy vấn. */
function pgCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < 4 && typeof current === 'object' && current !== null; i += 1) {
    if ('code' in current && typeof current.code === 'string') return current.code;
    current = 'cause' in current ? current.cause : undefined;
  }
  return undefined;
}

function serialize(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]));
}

type Shape = z.ZodType<Record<string, unknown>, z.ZodTypeDef, unknown>;
interface Entry { table: Table; input: Shape; item: Shape; order: SQL[] }

@Injectable()
export class AdminCatalogService {
  private readonly registry: Record<AdminResourceKey, Entry>;

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(LevelsService) private readonly levelsService: LevelsService,
    @Inject(KeywordsService) private readonly keywords: KeywordsService,
  ) {
    this.registry = {
      'wish-types': { table: wishTypes, input: ADMIN_RESOURCES['wish-types'], item: WishTypeItemSchema, order: [asc(wishTypes.sortOrder)] },
      'wish-stickers': { table: wishStickers, input: ADMIN_RESOURCES['wish-stickers'], item: WishStickerItemSchema, order: [asc(wishStickers.sortOrder)] },
      'wish-templates': { table: wishTemplates, input: ADMIN_RESOURCES['wish-templates'], item: WishTemplateItemSchema, order: [asc(wishTemplates.source), asc(wishTemplates.text)] },
      'place-categories': { table: placeCategories, input: ADMIN_RESOURCES['place-categories'], item: PlaceCategoryItemSchema, order: [asc(placeCategories.sortOrder)] },
      'scene-templates': { table: sceneTemplates, input: ADMIN_RESOURCES['scene-templates'], item: SceneTemplateItemSchema, order: [asc(sceneTemplates.name)] },
      'hot-topics': { table: hotTopics, input: ADMIN_RESOURCES['hot-topics'], item: HotTopicItemSchema, order: [asc(hotTopics.sortOrder)] },
      keywords: { table: sensitiveKeywords, input: ADMIN_RESOURCES.keywords, item: KeywordItemSchema, order: [asc(sensitiveKeywords.keyword)] },
      missions: { table: missions, input: ADMIN_RESOURCES.missions, item: MissionItemSchema, order: [asc(missions.sortOrder)] },
      challenges: { table: challenges, input: ADMIN_RESOURCES.challenges, item: ChallengeItemSchema, order: [asc(challenges.startsAt)] },
      events: { table: events, input: ADMIN_RESOURCES.events, item: EventItemSchema, order: [asc(events.startsAt)] },
      levels: { table: levels, input: ADMIN_RESOURCES.levels, item: LevelItemSchema, order: [asc(levels.level)] },
      'home-actions': { table: homeActions, input: ADMIN_RESOURCES['home-actions'], item: HomeActionItemSchema, order: [asc(homeActions.sortOrder)] },
      'footer-links': { table: homeFooterLinks, input: ADMIN_RESOURCES['footer-links'], item: FooterLinkItemSchema, order: [asc(homeFooterLinks.groupName), asc(homeFooterLinks.sortOrder)] },
      'street-slots': { table: streetSlots, input: ADMIN_RESOURCES['street-slots'], item: StreetSlotItemSchema, order: [asc(streetSlots.sortOrder)] },
      badges: { table: badges, input: ADMIN_RESOURCES.badges, item: BadgeItemSchema, order: [asc(badges.threshold)] },
    };
  }

  private entry(key: AdminResourceKey): Entry {
    return this.registry[key];
  }

  private afterWrite(key: AdminResourceKey): void {
    if (key === 'levels') this.levelsService.invalidate();
    if (key === 'keywords') this.keywords.invalidate();
  }

  private async guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      const code = pgCode(error);
      if (code === '23505') throw new DomainError('RESOURCE_DUPLICATE');
      if (code === '23503') throw new DomainError('RESOURCE_IN_USE');
      throw error;
    }
  }

  async list(key: AdminResourceKey): Promise<unknown[]> {
    const { table, item, order } = this.entry(key);
    const rows = await this.db.select().from(table).orderBy(...order);
    return rows.map((row) => item.parse(serialize(row)));
  }

  async create(key: AdminResourceKey, body: unknown): Promise<unknown> {
    const { table, input, item } = this.entry(key);
    const values = input.parse(body);
    const [row] = await this.guard(() => this.db.insert(table).values(this.toRow(key, values)).returning());
    this.afterWrite(key);
    return item.parse(serialize(row ?? {}));
  }

  async update(key: AdminResourceKey, id: string, body: unknown): Promise<unknown> {
    const { table, input, item } = this.entry(key);
    const values = input.parse(body);
    const [row] = await this.guard(() => this.db.update(table).set(this.toRow(key, values)).where(eq(table.id, id)).returning());
    if (!row) throw new DomainError('COMMON_NOT_FOUND');
    this.afterWrite(key);
    return item.parse(serialize(row));
  }

  async remove(key: AdminResourceKey, id: string): Promise<void> {
    const { table } = this.entry(key);
    const rows = await this.guard(() => this.db.delete(table).where(eq(table.id, id)).returning({ id: table.id }));
    if (rows.length === 0) throw new DomainError('COMMON_NOT_FOUND');
    this.afterWrite(key);
  }

  /** Chuyển chuỗi ISO của thời điểm thành Date trước khi ghi DB. */
  private toRow(key: AdminResourceKey, values: Record<string, unknown>): Record<string, unknown> {
    if (key !== 'challenges' && key !== 'events') return values;
    const out: Record<string, unknown> = { ...values };
    for (const field of ['startsAt', 'endsAt']) {
      const v = out[field];
      if (typeof v === 'string') out[field] = new Date(v);
    }
    return out;
  }
}
