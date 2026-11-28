import {
  ActivityItemSchema, BlockResultSchema, ChallengeSchema, EventSchema, FollowResultSchema, LeaderboardSchema, MeSchema, MeStatsSchema,
  MissionSchema, MyReportSchema, NotificationListSchema, OkSchema, PublicProfileSchema, PageMetaSchema, envelope, type MarkNotificationsReadBody, type ReportBody, type UpdateMeBody,
} from '@xin-via/shared';
import { z } from 'zod';
import { userUpdated } from '../auth-slice';
import { baseApi, unwrap } from '../base';

const NotificationsEnvelope = envelope(NotificationListSchema).extend({ meta: PageMetaSchema });

export const communityApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMe: b.query({ query: (_arg: void) => '/me', transformResponse: unwrap(MeSchema), providesTags: ['Me'] }),
    updateMe: b.mutation<z.output<typeof MeSchema>, UpdateMeBody>({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      transformResponse: unwrap(MeSchema),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(userUpdated(data));
      },
      invalidatesTags: ['Me', 'Stats'],
    }),
    getMeStats: b.query({ query: (_arg: void) => '/me/stats', transformResponse: unwrap(MeStatsSchema), providesTags: ['Stats'] }),
    getProfile: b.query<z.output<typeof PublicProfileSchema>, string>({
      query: (id: string) => `/users/${id}`,
      transformResponse: unwrap(PublicProfileSchema),
      providesTags: (_r, _e, id) => [{ type: 'Me', id }],
    }),
    followUser: b.mutation<z.output<typeof FollowResultSchema>, { id: string; on: boolean }>({
      query: ({ id, on }: { id: string; on: boolean }) => ({ url: `/users/${id}/follow`, method: on ? 'PUT' : 'DELETE' }),
      transformResponse: unwrap(FollowResultSchema),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Me', id }, 'Posts'],
    }),
    blockUser: b.mutation<z.output<typeof BlockResultSchema>, { id: string; on: boolean }>({
      query: ({ id, on }: { id: string; on: boolean }) => ({ url: `/users/${id}/block`, method: on ? 'PUT' : 'DELETE' }),
      transformResponse: unwrap(BlockResultSchema),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Me', id }, 'Posts'],
    }),
    getLeaderboard: b.query({ query: (limit: number) => ({ url: '/leaderboard', params: { limit } }), transformResponse: unwrap(LeaderboardSchema), providesTags: ['Leaderboard'] }),
    getNotifications: b.query({
      query: (page: number) => ({ url: '/me/notifications', params: { page, pageSize: 20 } }),
      transformResponse: (raw: unknown) => {
        const parsed = NotificationsEnvelope.parse(raw);
        return { items: parsed.data.items, unread: parsed.data.unread, meta: parsed.meta };
      },
      providesTags: ['Notifications'],
    }),
    markNotificationsRead: b.mutation<z.output<typeof OkSchema>, MarkNotificationsReadBody | void>({
      query: (arg: MarkNotificationsReadBody | void) => ({ url: '/me/notifications/read', method: 'POST', body: arg && arg.ids ? { ids: arg.ids } : {} }),
      transformResponse: unwrap(OkSchema),
      invalidatesTags: ['Notifications'],
    }),
    getMyReports: b.query({ query: (_arg: void) => '/me/reports', transformResponse: unwrap(z.array(MyReportSchema)), providesTags: ['Reports'] }),
    createReport: b.mutation<z.output<typeof OkSchema>, ReportBody>({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      transformResponse: unwrap(OkSchema),
      invalidatesTags: ['Reports'],
    }),
    getMissions: b.query({ query: (_arg: void) => '/missions', transformResponse: unwrap(z.array(MissionSchema)), providesTags: ['Missions'] }),
    getChallenge: b.query({ query: (_arg: void) => '/challenges/current', transformResponse: unwrap(ChallengeSchema.nullable()), providesTags: ['Missions'] }),
    getEvents: b.query({ query: (_arg: void) => '/events', transformResponse: unwrap(z.array(EventSchema)) }),
    getActivity: b.query({ query: (_arg: void) => '/activity', transformResponse: unwrap(z.array(ActivityItemSchema)), providesTags: ['Home'] }),
  }),
});

export const {
  useGetMeQuery, useUpdateMeMutation, useGetMeStatsQuery, useGetProfileQuery, useFollowUserMutation, useBlockUserMutation, useGetLeaderboardQuery,
  useGetNotificationsQuery, useMarkNotificationsReadMutation, useGetMyReportsQuery, useCreateReportMutation, useGetMissionsQuery,
  useGetChallengeQuery, useGetEventsQuery, useGetActivityQuery,
} = communityApi;
