import { z } from 'zod';
import { ICON_KEYS, PLACE_KINDS, SCENE_MODEL_KEYS } from '../enums';
import { IdSchema } from '../common';
import { PublicSettingsSchema } from '../settings';

export const WishTypeSchema = z.object({ id: IdSchema, code: z.string(), name: z.string(), iconKey: z.enum(ICON_KEYS), sortOrder: z.number().int() });
export type WishTypeDto = z.infer<typeof WishTypeSchema>;
export const WishStickerSchema = z.object({ id: IdSchema, code: z.string(), name: z.string(), iconKey: z.enum(ICON_KEYS) });
export type WishStickerDto = z.infer<typeof WishStickerSchema>;
export const PlaceCategorySchema = z.object({ id: IdSchema, code: z.string(), name: z.string(), iconKey: z.enum(ICON_KEYS), kind: z.enum(PLACE_KINDS), sortOrder: z.number().int() });
export type PlaceCategoryDto = z.infer<typeof PlaceCategorySchema>;
export const SceneTemplateSchema = z.object({ id: IdSchema, name: z.string(), kind: z.enum(PLACE_KINDS), modelKey: z.enum(SCENE_MODEL_KEYS), thumbnailUrl: z.string().nullable() });
export type SceneTemplateDto = z.infer<typeof SceneTemplateSchema>;

export const CatalogSchema = z.object({
  wishTypes: z.array(WishTypeSchema),
  stickers: z.array(WishStickerSchema),
  categories: z.array(PlaceCategorySchema),
  sceneTemplates: z.array(SceneTemplateSchema),
  settings: PublicSettingsSchema,
  authProviders: z.object({ google: z.boolean(), facebook: z.boolean(), apple: z.boolean() }),
  /** Chỉ có giá trị ở môi trường dev khi SMS_PROVIDER=dev (gợi ý mã OTP cố định). */
  devOtpHint: z.string().nullable(),
});
export type CatalogDto = z.infer<typeof CatalogSchema>;
