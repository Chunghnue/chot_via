import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DEFAULT_HOME_CONFIG, HomeConfigSchema, type HomeConfig, type HomeLayout } from '@chot-via/shared';
import { DB, type Db } from '../../database/database';
import { appSettings, homeActions, homeFooterLinks, sceneTemplates, streetSlots } from '../../database/schema';

const KEY = 'home';

/** Cấu hình & bố cục trang chủ do admin nhập: hero, hàng nút, chân trang, các ô cửa hàng trên phố (ảnh + 3D). */
@Injectable()
export class HomeLayoutService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async getConfig(): Promise<HomeConfig> {
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.key, KEY)).limit(1);
    const stored: unknown = row?.value;
    const saved: Record<string, unknown> = typeof stored === 'object' && stored !== null ? { ...stored } : {};
    const savedCamera = typeof saved['camera'] === 'object' && saved['camera'] !== null ? saved['camera'] : {};
    const parsed = HomeConfigSchema.safeParse({ ...DEFAULT_HOME_CONFIG, ...saved, camera: { ...DEFAULT_HOME_CONFIG.camera, ...savedCamera } });
    return parsed.success ? parsed.data : DEFAULT_HOME_CONFIG;
  }

  async saveConfig(config: HomeConfig): Promise<HomeConfig> {
    await this.db.insert(appSettings).values({ key: KEY, value: config }).onConflictDoUpdate({ target: appSettings.key, set: { value: config, updatedAt: new Date() } });
    return config;
  }

  async layout(): Promise<HomeLayout> {
    const [config, actions, links, slots] = await Promise.all([
      this.getConfig(),
      this.db.select().from(homeActions).where(eq(homeActions.active, true)).orderBy(asc(homeActions.sortOrder)),
      this.db.select().from(homeFooterLinks).where(eq(homeFooterLinks.active, true)).orderBy(asc(homeFooterLinks.groupName), asc(homeFooterLinks.sortOrder)),
      this.db.select({ s: streetSlots, t: sceneTemplates }).from(streetSlots).innerJoin(sceneTemplates, eq(streetSlots.sceneTemplateId, sceneTemplates.id))
        .where(eq(streetSlots.active, true)).orderBy(asc(streetSlots.sortOrder)),
    ]);
    return {
      config,
      actions: actions.map((a) => ({
        code: a.code,
        label: a.label,
        subLabel: a.subLabel,
        iconUrl: a.iconUrl,
        kind: a.kind,
        href: a.href,
        showMobile: a.showMobile,
        showTablet: a.showTablet,
        showDesktop: a.showDesktop,
        sortTablet: a.sortTablet,
        sortDesktop: a.sortDesktop,
      })),
      footerLinks: links.map((l) => ({ groupName: l.groupName, label: l.label, href: l.href })),
      street: slots.map(({ s, t }) => ({
        id: s.id,
        label: s.label,
        placeId: s.placeId,
        modelKey: t.modelKey,
        modelScale: t.modelScale,
        glb: { high: t.glbUrl, lod1: t.glbLod1Url, lod2: t.glbLod2Url },
        region: { x: s.imageX, y: s.imageY, w: s.imageW, h: s.imageH },
        position: { x: s.posX, z: s.posZ, rotationDeg: s.rotationDeg },
      })),
    };
  }
}
