import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AppSettingsSchema, DEFAULT_SETTINGS, PublicSettingsSchema, type AppSettings, type PublicSettings } from '@xin-via/shared';
import { DB, type Db } from '../database/database';
import { appSettings } from '../database/schema';

const KEY = 'app';
const TTL_MS = 10_000;

@Injectable()
export class SettingsService {
  private cache: { value: AppSettings; at: number } | null = null;

  constructor(@Inject(DB) private readonly db: Db) {}

  async get(): Promise<AppSettings> {
    if (this.cache && Date.now() - this.cache.at < TTL_MS) return this.cache.value;
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.key, KEY)).limit(1);
    const stored: unknown = row?.value;
    const parsed = AppSettingsSchema.safeParse(typeof stored === 'object' && stored !== null ? { ...DEFAULT_SETTINGS, ...stored } : stored);
    const value = parsed.success ? parsed.data : DEFAULT_SETTINGS;
    this.cache = { value, at: Date.now() };
    return value;
  }

  async getPublic(): Promise<PublicSettings> {
    return PublicSettingsSchema.parse(await this.get());
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    await this.db.insert(appSettings).values({ key: KEY, value: settings })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: settings, updatedAt: new Date() } });
    this.cache = { value: settings, at: Date.now() };
    return settings;
  }
}
