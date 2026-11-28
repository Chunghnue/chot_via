import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { AuthSessionSchema, envelope, type PageMeta, pagedEnvelope } from '@xin-via/shared';
import type { z } from 'zod';
import { hasAuthState, sessionCleared, sessionStarted } from './auth-slice';
import { parseApiError } from './errors';

const API_BASE = '/api/v1';
const CSRF_HEADERS = { 'x-requested-with': 'xinvia' };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState();
    if (hasAuthState(state) && state.auth.accessToken) headers.set('authorization', `Bearer ${state.auth.accessToken}`);
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null;

/** Làm mới phiên bằng refresh token (cookie httpOnly); mọi request lỗi cùng lúc chỉ chờ một lần làm mới. */
async function refreshSession(api: Parameters<typeof rawBaseQuery>[1], extra: Parameters<typeof rawBaseQuery>[2]): Promise<boolean> {
  const result = await rawBaseQuery({ url: '/auth/refresh', method: 'POST', headers: CSRF_HEADERS }, api, extra);
  const parsed = envelope(AuthSessionSchema).safeParse(result.data);
  if (result.error || !parsed.success) {
    api.dispatch(sessionCleared());
    return false;
  }
  api.dispatch(sessionStarted(parsed.data.data));
  return true;
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401 && parseApiError(result.error).code === 'AUTH_TOKEN_EXPIRED') {
    refreshing ??= refreshSession(api, extra).finally(() => { refreshing = null; });
    if (await refreshing) result = await rawBaseQuery(args, api, extra);
  }
  return result;
};

export const TAG_TYPES = [
  'Catalog', 'Home', 'Places', 'Place', 'Posts', 'Post', 'Comments', 'Me', 'Stats', 'Leaderboard', 'Missions', 'Notifications',
  'Reports', 'AdminCatalog', 'AdminList', 'Settings', 'Shop',
] as const;

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});

export const CSRF_HEADER_VALUES = CSRF_HEADERS;

/** Giải phong bì `{code,data}`: kiểm tra bằng Zod để dữ liệu có kiểu chính xác. */
export const unwrap = <S extends z.ZodTypeAny>(schema: S) => (raw: unknown): z.output<S> => envelope(schema).parse(raw).data;

export interface Paged<T> { items: T[]; meta: PageMeta }
export const unwrapPaged = <S extends z.ZodTypeAny>(schema: S) => (raw: unknown): Paged<z.output<S>> => {
  const parsed = pagedEnvelope(schema).parse(raw);
  return { items: parsed.data, meta: parsed.meta };
};

export type ApiBuilder = Parameters<Parameters<typeof baseApi.injectEndpoints>[0]['endpoints']>[0];
