import {
  AuthSessionSchema, CatalogSchema, DeityTodaySchema, DeityWishResultSchema, HomeSchema, OfflinePackSchema, OkSchema, OtpRequestResultSchema, PlaceWishResultSchema,
  PostWishResultSchema, type DeityWishBody, type OtpRequestBody, type OtpVerifyBody, type PlaceWishBody,
} from '@xin-via/shared';
import { z } from 'zod';
import { hasAuthState, pointsChanged, sessionCleared, sessionStarted } from '../auth-slice';
import { CSRF_HEADER_VALUES, baseApi, unwrap } from '../base';

export const coreApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCatalog: b.query({ query: (_arg: void) => '/catalog', transformResponse: unwrap(CatalogSchema), providesTags: ['Catalog'] }),
    getHome: b.query({ query: (_arg: void) => '/home', transformResponse: unwrap(HomeSchema), providesTags: ['Home'] }),
    getOfflinePack: b.query({ query: (_arg: void) => '/wishes/offline-pack', transformResponse: unwrap(OfflinePackSchema) }),

    requestOtp: b.mutation<z.output<typeof OtpRequestResultSchema>, OtpRequestBody>({
      query: (body) => ({ url: '/auth/otp/request', method: 'POST', body }),
      transformResponse: unwrap(OtpRequestResultSchema),
    }),
    verifyOtp: b.mutation<z.output<typeof AuthSessionSchema>, OtpVerifyBody>({
      query: (body) => ({ url: '/auth/otp/verify', method: 'POST', body }),
      transformResponse: unwrap(AuthSessionSchema),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(sessionStarted(data));
      },
      invalidatesTags: ['Me', 'Stats', 'Missions', 'Place', 'Posts'],
    }),
    /** Khôi phục phiên khi tải trang bằng cookie refresh token. Thất bại = khách. */
    restoreSession: b.mutation<z.output<typeof AuthSessionSchema> | null, void>({
      query: (_arg: void) => ({ url: '/auth/session', method: 'POST', headers: CSRF_HEADER_VALUES }),
      transformResponse: unwrap(AuthSessionSchema.nullable()),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(data ? sessionStarted(data) : sessionCleared());
        } catch (error) {
          /* Mạng chập chờn khi đang đăng nhập thì giữ nguyên phiên; chỉ khi máy chủ trả lời (hoặc chưa có phiên) mới coi là khách. */
          const status = (error as { error?: { status?: unknown } } | null)?.error?.status;
          const offline = status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR';
          const state = getState();
          if (!(offline && hasAuthState(state) && state.auth.status === 'member')) dispatch(sessionCleared());
        }
      },
    }),
    logout: b.mutation<z.output<typeof OkSchema>, void>({
      query: (_arg: void) => ({ url: '/auth/logout', method: 'POST', headers: CSRF_HEADER_VALUES }),
      transformResponse: unwrap(OkSchema),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try { await queryFulfilled; } finally { dispatch(sessionCleared()); dispatch(baseApi.util.resetApiState()); }
      },
    }),

    getDeityToday: b.query({ query: (_arg: void) => '/wishes/deity/today', transformResponse: unwrap(DeityTodaySchema), keepUnusedDataFor: 0 }),
    deityWish: b.mutation<z.output<typeof DeityWishResultSchema>, DeityWishBody>({
      query: (body) => ({ url: '/wishes/deity', method: 'POST', body }),
      transformResponse: unwrap(DeityWishResultSchema),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        if (data.totalPoints !== null) dispatch(pointsChanged(data.totalPoints));
      },
      invalidatesTags: ['Home', 'Stats', 'Leaderboard', 'Missions'],
    }),
    placeWish: b.mutation<z.output<typeof PlaceWishResultSchema>, { placeId: string; body: PlaceWishBody }>({
      query: ({ placeId, body }) => ({ url: `/places/${placeId}/wishes`, method: 'POST', body }),
      transformResponse: unwrap(PlaceWishResultSchema),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        if (data.totalPoints !== null) dispatch(pointsChanged(data.totalPoints));
      },
      invalidatesTags: (_r, _e, { placeId }) => ['Home', 'Stats', 'Leaderboard', 'Missions', { type: 'Place', id: placeId }, 'Places'],
    }),
    postWish: b.mutation<z.output<typeof PostWishResultSchema>, { postId: string; wishTypeId?: string }>({
      query: ({ postId, wishTypeId }) => ({ url: `/posts/${postId}/wishes`, method: 'POST', body: { wishTypeId } }),
      transformResponse: unwrap(PostWishResultSchema),
    }),
  }),
});

export const {
  useGetCatalogQuery, useGetHomeQuery, useGetOfflinePackQuery, useRequestOtpMutation, useVerifyOtpMutation, useRestoreSessionMutation,
  useLogoutMutation, useGetDeityTodayQuery, useDeityWishMutation, usePlaceWishMutation, usePostWishMutation,
} = coreApi;
