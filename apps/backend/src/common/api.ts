import type { PageMeta, SuccessCode } from '@xin-via/shared';

export interface ApiOk<T> { code: SuccessCode; data: T }
export interface ApiPaged<T> { code: SuccessCode; data: T[]; meta: PageMeta }

export const ok = <T>(code: SuccessCode, data: T): ApiOk<T> => ({ code, data });

/** `rows` phải được truy vấn với pageSize + 1 dòng để biết còn trang sau hay không. */
export function paged<T>(rows: T[], page: number, pageSize: number): ApiPaged<T> {
  return { code: 'OK', data: rows.slice(0, pageSize), meta: { page, pageSize, hasMore: rows.length > pageSize } };
}

export const offsetOf = (page: number, pageSize: number): number => (page - 1) * pageSize;
