import { ApiErrorBodySchema, isErrorCode, type ErrorCode } from '@chot-via/shared';

export interface ApiErrorInfo {
  /** NETWORK = mất mạng/không kết nối được máy chủ; UNKNOWN = phản hồi không đúng khuôn. */
  code: ErrorCode | 'NETWORK' | 'UNKNOWN';
  params: Record<string, string | number>;
  details: { field: string; rule: string; params: Record<string, string | number> }[];
}

/** Chuyển lỗi của RTK Query thành thông tin có kiểu; frontend tự ánh xạ `code` sang câu chữ i18n. */
export function parseApiError(error: unknown): ApiErrorInfo {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && error.status === 'FETCH_ERROR') return { code: 'NETWORK', params: {}, details: [] };
    if ('data' in error) {
      const parsed = ApiErrorBodySchema.safeParse(error.data);
      if (parsed.success) {
        const { code, params, details } = parsed.data.error;
        return {
          code: isErrorCode(code) ? code : 'UNKNOWN', params: params ?? {},
          details: (details ?? []).map((d) => ({ field: d.field, rule: d.rule, params: d.params ?? {} })),
        };
      }
    }
  }
  return { code: 'UNKNOWN', params: {}, details: [] };
}
