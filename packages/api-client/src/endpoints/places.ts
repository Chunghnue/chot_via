import {
  AutoRepliesSchema, LikeResultSchema, PlaceLeaderboardSchema, FollowResultSchema, OkSchema, PlaceDetailSchema, PlaceSummarySchema, PlaceWishItemSchema,
  type AutoReplies, type PlaceInput, type PlaceListQuery, type PlaceUpdate, type PlaceRankQuery,
} from '@xin-via/shared';
import { z } from 'zod';
import { baseApi, unwrap, unwrapPaged, type Paged } from '../base';

type PlaceListArgs = Partial<Omit<PlaceListQuery, 'page' | 'pageSize'>> & { page?: number; pageSize?: number };

export const placesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPlaces: b.query({
      query: (args: PlaceListArgs) => ({ url: '/places', params: args }),
      transformResponse: unwrapPaged(PlaceSummarySchema),
      providesTags: ['Places'],
    }),
    getPlaceLeaderboard: b.query({
      query: (args: Partial<PlaceRankQuery>) => ({ url: '/places/leaderboard', params: args }),
      transformResponse: unwrap(PlaceLeaderboardSchema),
      providesTags: ['Places'],
    }),
    getRandomPlace: b.query({ query: (_arg: void) => '/places/random', transformResponse: unwrap(PlaceSummarySchema), keepUnusedDataFor: 0 }),
    getMyPlaces: b.query({ query: (_arg: void) => '/places/mine', transformResponse: unwrap(z.array(PlaceSummarySchema)), providesTags: ['Places'] }),
    getPlace: b.query<z.output<typeof PlaceDetailSchema>, string>({
      query: (idOrSlug: string) => `/places/${idOrSlug}`,
      transformResponse: unwrap(PlaceDetailSchema),
      providesTags: (r) => [{ type: 'Place', id: r?.id }],
    }),
    getPlaceWishes: b.query<Paged<z.output<typeof PlaceWishItemSchema>>, { placeId: string; page?: number }>({
      query: ({ placeId, page }: { placeId: string; page?: number }) => ({ url: `/places/${placeId}/wishes`, params: { page: page ?? 1, pageSize: 10 } }),
      transformResponse: unwrapPaged(PlaceWishItemSchema),
      providesTags: (_r, _e, { placeId }) => [{ type: 'Place', id: placeId }],
    }),
    visitPlace: b.mutation<z.output<typeof OkSchema>, string>({
      query: (idOrSlug) => ({ url: `/places/${idOrSlug}/visits`, method: 'POST' }),
      transformResponse: unwrap(OkSchema),
      invalidatesTags: ['Missions'],
    }),
    likePlace: b.mutation<z.output<typeof LikeResultSchema>, { id: string; on: boolean }>({
      query: ({ id, on }) => ({ url: `/places/${id}/like`, method: on ? 'PUT' : 'DELETE' }),
      transformResponse: unwrap(LikeResultSchema),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Place', id }],
    }),
    followPlace: b.mutation<z.output<typeof FollowResultSchema>, { id: string; on: boolean }>({
      query: ({ id, on }) => ({ url: `/places/${id}/follow`, method: on ? 'PUT' : 'DELETE' }),
      transformResponse: unwrap(FollowResultSchema),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Place', id }, 'Places'],
    }),
    createPlace: b.mutation<z.output<typeof PlaceDetailSchema>, PlaceInput>({
      query: (body) => ({ url: '/places', method: 'POST', body }),
      transformResponse: unwrap(PlaceDetailSchema),
      invalidatesTags: ['Places', 'Home'],
    }),
    updatePlace: b.mutation<z.output<typeof PlaceDetailSchema>, { id: string; body: PlaceUpdate }>({
      query: ({ id, body }) => ({ url: `/places/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap(PlaceDetailSchema),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Place', id }, 'Places', 'Home'],
    }),
    deletePlace: b.mutation<z.output<typeof OkSchema>, string>({
      query: (id) => ({ url: `/places/${id}`, method: 'DELETE' }),
      transformResponse: unwrap(OkSchema),
      invalidatesTags: ['Places', 'Home'],
    }),
    getAutoReplies: b.query<AutoReplies, string>({
      query: (placeId: string) => `/places/${placeId}/auto-replies`,
      transformResponse: unwrap(AutoRepliesSchema),
      providesTags: (_r, _e, id) => [{ type: 'Place', id: `auto-${id}` }],
    }),
    setAutoReplies: b.mutation<AutoReplies, { id: string; body: AutoReplies }>({
      query: ({ id, body }) => ({ url: `/places/${id}/auto-replies`, method: 'PUT', body }),
      transformResponse: unwrap(AutoRepliesSchema),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Place', id: `auto-${id}` }],
    }),
  }),
});

export const {
  useGetPlacesQuery, useGetPlaceLeaderboardQuery, useLazyGetRandomPlaceQuery, useGetMyPlacesQuery, useGetPlaceQuery, useGetPlaceWishesQuery, useVisitPlaceMutation,
  useLikePlaceMutation, useFollowPlaceMutation, useCreatePlaceMutation, useUpdatePlaceMutation, useDeletePlaceMutation,
  useGetAutoRepliesQuery, useSetAutoRepliesMutation,
} = placesApi;
