import { z } from 'zod';
import { SUCCESS_CODES } from './codes';

export const IdSchema = z.string().uuid();
export const IsoDateSchema = z.string().datetime();
export const NullableUrl = z.string().nullable();

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;

export const PageMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  hasMore: z.boolean(),
});
export type PageMeta = z.infer<typeof PageMetaSchema>;

export const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ code: z.enum(SUCCESS_CODES), data });

export const pagedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ code: z.enum(SUCCESS_CODES), data: z.array(item), meta: PageMetaSchema });

export const EmptyDataSchema = z.object({});
export const IdParamSchema = z.object({ id: IdSchema });
export const OkSchema = z.object({ ok: z.literal(true) });

/** Khóa cho phép lọc từ khóa tiếng Việt, tối đa 30 ký tự, không khoảng trắng. */
export const HashtagSchema = z.string().trim().min(2).max(30).regex(/^[\p{L}\p{N}_]+$/u, 'invalid_string');
export const TurnstileTokenSchema = z.string().max(2048).optional();
