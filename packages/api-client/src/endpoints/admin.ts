import {
  AdminCommentSchema,
  AdminPlaceSchema,
  AdminReportSchema,
  AdminStatsSchema,
  AdminUserSchema,
  AppSettingsSchema,
  AuditLogSchema,
  BadgeInputSchema,
  BadgeItemSchema,
  FooterLinkInputSchema,
  FooterLinkItemSchema,
  HomeActionInputSchema,
  HomeActionItemSchema,
  HomeConfigSchema,
  StreetSlotInputSchema,
  StreetSlotItemSchema,
  type HomeConfig,
  ChallengeInputSchema,
  ChallengeItemSchema,
  EventInputSchema,
  DemoPostItemSchema,
  DemoUserItemSchema,
  EventItemSchema,
  HotTopicInputSchema,
  HotTopicItemSchema,
  KeywordInputSchema,
  KeywordItemSchema,
  LevelInputSchema,
  LevelItemSchema,
  MissionInputSchema,
  MissionItemSchema,
  OkSchema,
  PlaceCategoryInputSchema,
  PlaceCategoryItemSchema,
  PostSchema,
  SceneTemplateInputSchema,
  SceneTemplateItemSchema,
  WishStickerInputSchema,
  WishStickerItemSchema,
  WishTemplateInputSchema,
  WishTemplateItemSchema,
  WishTypeInputSchema,
  WishTypeItemSchema,
  type AdminListQuery,
  type AdminPlaceInput,
  type AdminPlaceUpdate,
  type AdminResourceKey,
  type AdminUserUpdate,
  type AppSettings,
  type DemoPostInput,
  type DemoUserInput,
  type ReportAction,
} from '@chot-via/shared';
import { z } from 'zod';
import { baseApi, unwrap, unwrapPaged, type ApiBuilder } from '../base';

type ListArgs = Partial<Omit<AdminListQuery, 'page' | 'pageSize'>> & { page?: number; pageSize?: number };

/** CRUD dùng chung cho danh mục cấu hình: một khai báo, đủ 4 thao tác có kiểu theo schema của từng tài nguyên. */
function crud<I extends z.ZodTypeAny, P extends z.ZodTypeAny>(b: ApiBuilder, resource: AdminResourceKey, item: I, _input: P) {
  const tag = [{ type: 'AdminCatalog' as const, id: resource }];
  return {
    list: b.query<z.output<I>[], void>({ query: (_arg: void) => `/admin/catalog/${resource}`, transformResponse: unwrap(z.array(item)), providesTags: tag }),
    create: b.mutation<z.output<I>, z.output<P>>({
      query: (body) => ({ url: `/admin/catalog/${resource}`, method: 'POST', body }), transformResponse: unwrap(item), invalidatesTags: tag,
    }),
    update: b.mutation<z.output<I>, { id: string; body: z.output<P> }>({
      query: ({ id, body }) => ({ url: `/admin/catalog/${resource}/${id}`, method: 'PUT', body }), transformResponse: unwrap(item), invalidatesTags: tag,
    }),
    remove: b.mutation<z.output<typeof OkSchema>, string>({
      query: (id) => ({ url: `/admin/catalog/${resource}/${id}`, method: 'DELETE' }), transformResponse: unwrap(OkSchema), invalidatesTags: tag,
    }),
  };
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (b) => {
    const wishTypes = crud(b, 'wish-types', WishTypeItemSchema, WishTypeInputSchema);
    const wishStickers = crud(b, 'wish-stickers', WishStickerItemSchema, WishStickerInputSchema);
    const wishTemplates = crud(b, 'wish-templates', WishTemplateItemSchema, WishTemplateInputSchema);
    const placeCategories = crud(b, 'place-categories', PlaceCategoryItemSchema, PlaceCategoryInputSchema);
    const sceneTemplates = crud(b, 'scene-templates', SceneTemplateItemSchema, SceneTemplateInputSchema);
    const keywords = crud(b, 'keywords', KeywordItemSchema, KeywordInputSchema);
    const hotTopics = crud(b, 'hot-topics', HotTopicItemSchema, HotTopicInputSchema);
    const missions = crud(b, 'missions', MissionItemSchema, MissionInputSchema);
    const challenges = crud(b, 'challenges', ChallengeItemSchema, ChallengeInputSchema);
    const events = crud(b, 'events', EventItemSchema, EventInputSchema);
    const levels = crud(b, 'levels', LevelItemSchema, LevelInputSchema);
    const badges = crud(b, 'badges', BadgeItemSchema, BadgeInputSchema);
    const homeActions = crud(b, 'home-actions', HomeActionItemSchema, HomeActionInputSchema);
    const footerLinks = crud(b, 'footer-links', FooterLinkItemSchema, FooterLinkInputSchema);
    const streetSlots = crud(b, 'street-slots', StreetSlotItemSchema, StreetSlotInputSchema);
    return {
      wishTypesList: wishTypes.list,
      wishTypesCreate: wishTypes.create,
      wishTypesUpdate: wishTypes.update,
      wishTypesRemove: wishTypes.remove,
      wishStickersList: wishStickers.list,
      wishStickersCreate: wishStickers.create,
      wishStickersUpdate: wishStickers.update,
      wishStickersRemove: wishStickers.remove,
      wishTemplatesList: wishTemplates.list,
      wishTemplatesCreate: wishTemplates.create,
      wishTemplatesUpdate: wishTemplates.update,
      wishTemplatesRemove: wishTemplates.remove,
      placeCategoriesList: placeCategories.list,
      placeCategoriesCreate: placeCategories.create,
      placeCategoriesUpdate: placeCategories.update,
      placeCategoriesRemove: placeCategories.remove,
      sceneTemplatesList: sceneTemplates.list,
      sceneTemplatesCreate: sceneTemplates.create,
      sceneTemplatesUpdate: sceneTemplates.update,
      sceneTemplatesRemove: sceneTemplates.remove,
      hotTopicsList: hotTopics.list,
      hotTopicsCreate: hotTopics.create,
      hotTopicsUpdate: hotTopics.update,
      hotTopicsRemove: hotTopics.remove,
      keywordsList: keywords.list,
      keywordsCreate: keywords.create,
      keywordsUpdate: keywords.update,
      keywordsRemove: keywords.remove,
      missionsList: missions.list,
      missionsCreate: missions.create,
      missionsUpdate: missions.update,
      missionsRemove: missions.remove,
      challengesList: challenges.list,
      challengesCreate: challenges.create,
      challengesUpdate: challenges.update,
      challengesRemove: challenges.remove,
      eventsList: events.list,
      eventsCreate: events.create,
      eventsUpdate: events.update,
      eventsRemove: events.remove,
      levelsList: levels.list,
      levelsCreate: levels.create,
      levelsUpdate: levels.update,
      levelsRemove: levels.remove,
      homeActionsList: homeActions.list,
      homeActionsCreate: homeActions.create,
      homeActionsUpdate: homeActions.update,
      homeActionsRemove: homeActions.remove,
      footerLinksList: footerLinks.list,
      footerLinksCreate: footerLinks.create,
      footerLinksUpdate: footerLinks.update,
      footerLinksRemove: footerLinks.remove,
      streetSlotsList: streetSlots.list,
      streetSlotsCreate: streetSlots.create,
      streetSlotsUpdate: streetSlots.update,
      streetSlotsRemove: streetSlots.remove,
      adminHomeConfig: b.query({ query: (_arg: void) => '/admin/home-config', transformResponse: unwrap(HomeConfigSchema), providesTags: ['Settings'] }),
      adminHomeConfigSave: b.mutation<HomeConfig, HomeConfig>({
        query: (body) => ({ url: '/admin/home-config', method: 'PUT', body }),
        transformResponse: unwrap(HomeConfigSchema),
        invalidatesTags: ['Settings', 'Home'],
      }),
      adminAssetUpload: b.mutation<{ url: string }, File>({
        query: (file) => {
          const form = new FormData();
          form.append('file', file);
          return { url: '/admin/assets', method: 'POST', body: form };
        },
        transformResponse: unwrap(z.object({ url: z.string() })),
      }),
      badgesList: badges.list,
      badgesCreate: badges.create,
      badgesUpdate: badges.update,
      badgesRemove: badges.remove,

      demoUsersList: b.query({ query: (_arg: void) => '/admin/demo/users', transformResponse: unwrap(z.array(DemoUserItemSchema)), providesTags: ['AdminList'] }),
      demoUserCreate: b.mutation<unknown, DemoUserInput>({ query: (body) => ({ url: '/admin/demo/users', method: 'POST', body }), invalidatesTags: ['AdminList'] }),
      demoUserUpdate: b.mutation<unknown, { id: string; body: DemoUserInput }>({
        query: ({ id, body }) => ({ url: `/admin/demo/users/${id}`, method: 'PUT', body }),
        invalidatesTags: ['AdminList'],
      }),
      demoUserDelete: b.mutation<unknown, string>({ query: (id) => ({ url: `/admin/demo/users/${id}`, method: 'DELETE' }), invalidatesTags: ['AdminList'] }),
      demoPostsList: b.query({ query: (_arg: void) => '/admin/demo/posts', transformResponse: unwrap(z.array(DemoPostItemSchema)), providesTags: ['AdminList'] }),
      demoPostCreate: b.mutation<unknown, DemoPostInput>({ query: (body) => ({ url: '/admin/demo/posts', method: 'POST', body }), invalidatesTags: ['AdminList', 'Posts'] }),
      demoPostUpdate: b.mutation<unknown, { id: string; body: DemoPostInput }>({
        query: ({ id, body }) => ({ url: `/admin/demo/posts/${id}`, method: 'PUT', body }),
        invalidatesTags: ['AdminList', 'Posts'],
      }),
      demoPostDelete: b.mutation<unknown, string>({ query: (id) => ({ url: `/admin/demo/posts/${id}`, method: 'DELETE' }), invalidatesTags: ['AdminList', 'Posts'] }),
      adminStats: b.query({ query: (_arg: void) => '/admin/stats', transformResponse: unwrap(AdminStatsSchema), providesTags: ['AdminList'] }),
      adminReports: b.query({ query: (a: ListArgs) => ({ url: '/admin/reports', params: a }), transformResponse: unwrapPaged(AdminReportSchema), providesTags: ['AdminList'] }),
      adminReportAct: b.mutation<z.output<typeof OkSchema>, { id: string; action: ReportAction }>({
        query: ({ id, action }) => ({ url: `/admin/reports/${id}`, method: 'PATCH', body: { action } }),
        transformResponse: unwrap(OkSchema),
        invalidatesTags: ['AdminList'],
      }),
      adminPosts: b.query({ query: (a: ListArgs) => ({ url: '/admin/posts', params: a }), transformResponse: unwrapPaged(PostSchema), providesTags: ['AdminList'] }),
      adminPostStatus: b.mutation<z.output<typeof OkSchema>, { id: string; status: 'published' | 'hidden' | 'removed' }>({
        query: ({ id, status }) => ({ url: `/admin/posts/${id}`, method: 'PATCH', body: { status } }),
        transformResponse: unwrap(OkSchema),
        invalidatesTags: ['AdminList'],
      }),
      adminPostPin: b.mutation<z.output<typeof OkSchema>, { id: string; pinned: boolean }>({
        query: ({ id, pinned }) => ({ url: `/admin/posts/${id}`, method: 'PATCH', body: { pinned } }),
        transformResponse: unwrap(OkSchema),
        invalidatesTags: ['AdminList', 'Posts'],
      }),
      adminComments: b.query({ query: (a: ListArgs) => ({ url: '/admin/comments', params: a }), transformResponse: unwrapPaged(AdminCommentSchema), providesTags: ['AdminList'] }),
      adminCommentStatus: b.mutation<z.output<typeof OkSchema>, { id: string; status: 'published' | 'hidden' }>({
        query: ({ id, status }) => ({ url: `/admin/comments/${id}`, method: 'PATCH', body: { status } }),
        transformResponse: unwrap(OkSchema),
        invalidatesTags: ['AdminList'],
      }),
      adminPlaces: b.query({
        query: (a: { page?: number; pageSize?: number; search?: string }) => ({ url: '/admin/places', params: a }),
        transformResponse: unwrapPaged(AdminPlaceSchema),
        providesTags: ['AdminList'],
      }),
      adminPlaceCreate: b.mutation<z.output<typeof AdminPlaceSchema>, AdminPlaceInput>({
        query: (body) => ({ url: '/admin/places', method: 'POST', body }),
        transformResponse: unwrap(AdminPlaceSchema),
        invalidatesTags: ['AdminList', 'Places', 'Home'],
      }),
      adminPlaceUpdate: b.mutation<z.output<typeof AdminPlaceSchema>, { id: string; body: AdminPlaceUpdate }>({
        query: ({ id, body }) => ({ url: `/admin/places/${id}`, method: 'PATCH', body }),
        transformResponse: unwrap(AdminPlaceSchema),
        invalidatesTags: ['AdminList', 'Places', 'Home'],
      }),
      adminPlaceDelete: b.mutation<z.output<typeof OkSchema>, string>({
        query: (id) => ({ url: `/admin/places/${id}`, method: 'DELETE' }),
        transformResponse: unwrap(OkSchema),
        invalidatesTags: ['AdminList', 'Places', 'Home'],
      }),
      adminUsers: b.query({ query: (a: ListArgs) => ({ url: '/admin/users', params: a }), transformResponse: unwrapPaged(AdminUserSchema), providesTags: ['AdminList'] }),
      adminUserUpdate: b.mutation<z.output<typeof OkSchema>, { id: string; body: AdminUserUpdate }>({
        query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body }),
        transformResponse: unwrap(OkSchema),
        invalidatesTags: ['AdminList'],
      }),
      adminSettings: b.query({ query: (_arg: void) => '/admin/settings', transformResponse: unwrap(AppSettingsSchema), providesTags: ['Settings'] }),
      adminSettingsSave: b.mutation<AppSettings, AppSettings>({
        query: (body) => ({ url: '/admin/settings', method: 'PUT', body }),
        transformResponse: unwrap(AppSettingsSchema),
        invalidatesTags: ['Settings', 'Catalog'],
      }),
      adminAudit: b.query({ query: (page: number) => ({ url: '/admin/audit-logs', params: { page, pageSize: 30 } }), transformResponse: unwrapPaged(AuditLogSchema) }),
    };
  },
});

export const {
  useDemoUsersListQuery,
  useDemoUserCreateMutation,
  useDemoUserUpdateMutation,
  useDemoUserDeleteMutation,
  useDemoPostsListQuery,
  useDemoPostCreateMutation,
  useDemoPostUpdateMutation,
  useDemoPostDeleteMutation,
  useAdminStatsQuery,
  useAdminReportsQuery,
  useAdminReportActMutation,
  useAdminPostsQuery,
  useAdminPostStatusMutation,
  useAdminPostPinMutation,
  useAdminCommentsQuery,
  useAdminCommentStatusMutation,
  useAdminPlacesQuery,
  useAdminPlaceCreateMutation,
  useAdminPlaceUpdateMutation,
  useAdminPlaceDeleteMutation,
  useAdminHomeConfigQuery,
  useAdminHomeConfigSaveMutation,
  useAdminAssetUploadMutation,
  useAdminUsersQuery,
  useAdminUserUpdateMutation,
  useAdminSettingsQuery,
  useAdminSettingsSaveMutation,
  useAdminAuditQuery,
} = adminApi;
