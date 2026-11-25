import { adminApi } from '@chot-via/api-client';
import {
  ANIMATION_KEYS, BADGE_CONDITIONS, BadgeInputSchema, ChallengeInputSchema, CHALLENGE_SCOPES, EventInputSchema, HotTopicInputSchema, ICON_KEYS, KEYWORD_ACTIONS, KeywordInputSchema,
  LevelInputSchema, MEMBER_ROLES, MISSION_ACTIONS, MISSION_PERIODS, MissionInputSchema, PLACE_KINDS, PlaceCategoryInputSchema, SCENE_MODEL_KEYS,
  SceneTemplateInputSchema, FooterLinkInputSchema, HomeActionInputSchema, StreetSlotInputSchema, HOME_ACTION_KINDS, TIME_BUCKETS, WISH_TEMPLATE_SOURCES, WishStickerInputSchema, WishTemplateInputSchema, WishTypeInputSchema,
  type AdminResourceKey,
} from '@chot-via/shared';
import { AppIcon, Badge, useFormatters } from '@chot-via/ui';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslations } from 'use-intl';
import { ActiveBadge, ResourcePage, type SelectOption } from '../components/resource-page';

const {
  useWishTypesListQuery, useWishTypesCreateMutation, useWishTypesUpdateMutation, useWishTypesRemoveMutation,
  useWishStickersListQuery, useWishStickersCreateMutation, useWishStickersUpdateMutation, useWishStickersRemoveMutation,
  useWishTemplatesListQuery, useWishTemplatesCreateMutation, useWishTemplatesUpdateMutation, useWishTemplatesRemoveMutation,
  usePlaceCategoriesListQuery, usePlaceCategoriesCreateMutation, usePlaceCategoriesUpdateMutation, usePlaceCategoriesRemoveMutation,
  useSceneTemplatesListQuery, useSceneTemplatesCreateMutation, useSceneTemplatesUpdateMutation, useSceneTemplatesRemoveMutation,
  useHotTopicsListQuery, useHotTopicsCreateMutation, useHotTopicsUpdateMutation, useHotTopicsRemoveMutation,
  useKeywordsListQuery, useKeywordsCreateMutation, useKeywordsUpdateMutation, useKeywordsRemoveMutation,
  useMissionsListQuery, useMissionsCreateMutation, useMissionsUpdateMutation, useMissionsRemoveMutation,
  useChallengesListQuery, useChallengesCreateMutation, useChallengesUpdateMutation, useChallengesRemoveMutation,
  useEventsListQuery, useEventsCreateMutation, useEventsUpdateMutation, useEventsRemoveMutation,
  useLevelsListQuery, useLevelsCreateMutation, useLevelsUpdateMutation, useLevelsRemoveMutation,
  useBadgesListQuery, useBadgesCreateMutation, useBadgesUpdateMutation, useBadgesRemoveMutation,
  useHomeActionsListQuery, useHomeActionsCreateMutation, useHomeActionsUpdateMutation, useHomeActionsRemoveMutation,
  useFooterLinksListQuery, useFooterLinksCreateMutation, useFooterLinksUpdateMutation, useFooterLinksRemoveMutation,
  useStreetSlotsListQuery, useStreetSlotsCreateMutation, useStreetSlotsUpdateMutation, useStreetSlotsRemoveMutation,
  useAdminPlacesQuery,
} = adminApi;

const options = <T extends string>(values: readonly T[], label: (v: T) => string): SelectOption[] => values.map((v) => ({ value: v, label: label(v) }));

function WishTypesPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const iconOptions = options(ICON_KEYS, (k) => k);
  return <ResourcePage config={{
    title: t('nav.wishTypes'), note: t('resources.hint'), schema: WishTypeInputSchema, defaults: { code: '', name: '', iconKey: 'fire', sortOrder: 0, active: true },
    toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'code', label: tf('code'), kind: 'text' }, { name: 'name', label: tf('name'), kind: 'text' }, { name: 'iconKey', label: tf('iconKey'), kind: 'select', options: iconOptions },
      { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('iconKey'), cell: (i) => <AppIcon iconKey={i.iconKey} className="text-2xl" /> }, { header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('code'), cell: (i) => i.code },
      { header: tf('sortOrder'), cell: (i) => i.sortOrder }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useWishTypesListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useWishTypesCreateMutation, useUpdate: useWishTypesUpdateMutation, useRemove: useWishTypesRemoveMutation,
  }} />;
}

function WishStickersPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  return <ResourcePage config={{
    title: t('nav.wishStickers'), schema: WishStickerInputSchema, defaults: { code: '', name: '', iconKey: 'gold', sortOrder: 0, active: true },
    toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'code', label: tf('code'), kind: 'text' }, { name: 'name', label: tf('name'), kind: 'text' }, { name: 'iconKey', label: tf('iconKey'), kind: 'select', options: options(ICON_KEYS, (k) => k) },
      { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('iconKey'), cell: (i) => <AppIcon iconKey={i.iconKey} className="text-2xl" /> }, { header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('code'), cell: (i) => i.code }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useWishStickersListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useWishStickersCreateMutation, useUpdate: useWishStickersUpdateMutation, useRemove: useWishStickersRemoveMutation,
  }} />;
}

function WishTemplatesPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  const { data: types } = useWishTypesListQuery();
  const typeOptions: SelectOption[] = [{ value: '', label: to('timeBucket.any') }, ...(types ?? []).map((x) => ({ value: x.id, label: x.name }))];
  return <ResourcePage config={{
    title: t('nav.wishTemplates'), note: t('resources.hint'), schema: WishTemplateInputSchema,
    defaults: { source: 'deity', timeBucket: null, wishTypeId: null, roleTarget: null, text: '', animationKey: 'sparkle', active: true },
    toInput: ({ id: _id, ...rest }) => rest,
    fields: [
      { name: 'source', label: tf('source'), kind: 'select', options: options(WISH_TEMPLATE_SOURCES, (s) => to(`templateSource.${s}`)) },
      { name: 'timeBucket', label: tf('timeBucket'), kind: 'nullableSelect', options: [{ value: '', label: to('timeBucket.any') }, ...options(TIME_BUCKETS, (b) => to(`timeBucket.${b}`))] },
      { name: 'wishTypeId', label: tf('wishTypeId'), kind: 'nullableSelect', options: typeOptions },
      { name: 'roleTarget', label: tf('roleTarget'), kind: 'nullableSelect', options: [{ value: '', label: to('role.any') }, ...options(MEMBER_ROLES, (r) => to(`role.${r}`))] },
      { name: 'text', label: tf('text'), kind: 'textarea' },
      { name: 'animationKey', label: tf('animationKey'), kind: 'select', options: options(ANIMATION_KEYS, (a) => to(`animation.${a}`)) },
      { name: 'active', label: tf('active'), kind: 'switch' },
    ],
    columns: [{ header: tf('source'), cell: (i) => <Badge>{to(`templateSource.${i.source}`)}</Badge> }, { header: tf('timeBucket'), cell: (i) => (i.timeBucket ? to(`timeBucket.${i.timeBucket}`) : to('timeBucket.any')) },
      { header: tf('wishTypeId'), cell: (i) => types?.find((x) => x.id === i.wishTypeId)?.name ?? '—' }, { header: tf('text'), cell: (i) => <span className="line-clamp-2 max-w-md">{i.text}</span> }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useWishTemplatesListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useWishTemplatesCreateMutation, useUpdate: useWishTemplatesUpdateMutation, useRemove: useWishTemplatesRemoveMutation,
  }} />;
}

function PlaceCategoriesPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  return <ResourcePage config={{
    title: t('nav.placeCategories'), schema: PlaceCategoryInputSchema, defaults: { code: '', name: '', iconKey: 'store', kind: 'store', sortOrder: 0, active: true },
    toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'code', label: tf('code'), kind: 'text' }, { name: 'name', label: tf('name'), kind: 'text' }, { name: 'iconKey', label: tf('iconKey'), kind: 'select', options: options(ICON_KEYS, (k) => k) },
      { name: 'kind', label: tf('kind'), kind: 'select', options: options(PLACE_KINDS, (k) => to(`placeKind.${k}`)) }, { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('iconKey'), cell: (i) => <AppIcon iconKey={i.iconKey} className="text-2xl" /> }, { header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('kind'), cell: (i) => to(`placeKind.${i.kind}`) }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = usePlaceCategoriesListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: usePlaceCategoriesCreateMutation, useUpdate: usePlaceCategoriesUpdateMutation, useRemove: usePlaceCategoriesRemoveMutation,
  }} />;
}

function SceneTemplatesPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  return <ResourcePage config={{
    title: t('nav.sceneTemplates'), schema: SceneTemplateInputSchema, defaults: { name: '', kind: 'store', modelKey: 'generic', thumbnailUrl: null, glbUrl: null, glbLod1Url: null, glbLod2Url: null, modelScale: 1, active: true },
    toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'name', label: tf('name'), kind: 'text' }, { name: 'kind', label: tf('kind'), kind: 'select', options: options(PLACE_KINDS, (k) => to(`placeKind.${k}`)) },
      { name: 'modelKey', label: tf('modelKey'), kind: 'select', options: options(SCENE_MODEL_KEYS, (k) => k) }, { name: 'thumbnailUrl', label: tf('thumbnailUrl'), kind: 'nullableText' },
      { name: 'glbUrl', label: tf('glbUrl'), kind: 'asset' }, { name: 'glbLod1Url', label: tf('glbLod1Url'), kind: 'asset' }, { name: 'glbLod2Url', label: tf('glbLod2Url'), kind: 'asset' },
      { name: 'modelScale', label: tf('modelScale'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('kind'), cell: (i) => to(`placeKind.${i.kind}`) }, { header: tf('modelKey'), cell: (i) => i.modelKey }, { header: tf('glbUrl'), cell: (i) => (i.glbUrl ? '✓' : '—') }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useSceneTemplatesListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useSceneTemplatesCreateMutation, useUpdate: useSceneTemplatesUpdateMutation, useRemove: useSceneTemplatesRemoveMutation,
  }} />;
}

function KeywordsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  return <ResourcePage config={{
    title: t('nav.keywords'), note: t('resources.keywordsNote'), schema: KeywordInputSchema, defaults: { keyword: '', action: 'block' }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'keyword', label: tf('keyword'), kind: 'text' }, { name: 'action', label: tf('action'), kind: 'select', options: options(KEYWORD_ACTIONS, (a) => to(`keywordAction.${a}`)) }],
    columns: [{ header: tf('keyword'), cell: (i) => <b>{i.keyword}</b> }, { header: tf('action'), cell: (i) => <Badge tone={i.action === 'block' ? 'danger' : 'warning'}>{to(`keywordAction.${i.action}`)}</Badge> }],
    useList: () => { const q = useKeywordsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useKeywordsCreateMutation, useUpdate: useKeywordsUpdateMutation, useRemove: useKeywordsRemoveMutation,
  }} />;
}

function HotTopicsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  return <ResourcePage config={{
    title: t('nav.hotTopics'), note: t('resources.hotTopicsNote'), schema: HotTopicInputSchema, defaults: { title: '', hashtag: null, sortOrder: 0, active: true },
    toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'title', label: tf('title'), kind: 'text' }, { name: 'hashtag', label: tf('hashtag'), kind: 'text' }, { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('sortOrder'), cell: (i) => i.sortOrder }, { header: tf('title'), cell: (i) => <b>{i.title}</b> }, { header: tf('hashtag'), cell: (i) => (i.hashtag ? `#${i.hashtag}` : '—') }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useHotTopicsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useHotTopicsCreateMutation, useUpdate: useHotTopicsUpdateMutation, useRemove: useHotTopicsRemoveMutation,
  }} />;
}

function MissionsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  return <ResourcePage config={{
    title: t('nav.missions'), note: t('resources.missionsNote'), schema: MissionInputSchema,
    defaults: { code: '', name: '', description: '', period: 'daily', action: 'deity_wish', target: 1, rewardPoints: 0, sortOrder: 0, active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'code', label: tf('code'), kind: 'text' }, { name: 'name', label: tf('name'), kind: 'text' }, { name: 'description', label: tf('description'), kind: 'textarea' },
      { name: 'period', label: tf('period'), kind: 'select', options: options(MISSION_PERIODS, (p) => to(`period.${p}`)) }, { name: 'action', label: tf('action'), kind: 'select', options: options(MISSION_ACTIONS, (a) => to(`missionAction.${a}`)) },
      { name: 'target', label: tf('target'), kind: 'number' }, { name: 'rewardPoints', label: tf('rewardPoints'), kind: 'number' }, { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('action'), cell: (i) => to(`missionAction.${i.action}`) }, { header: tf('period'), cell: (i) => to(`period.${i.period}`) }, { header: tf('target'), cell: (i) => i.target }, { header: tf('rewardPoints'), cell: (i) => `+${i.rewardPoints}` }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useMissionsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useMissionsCreateMutation, useUpdate: useMissionsUpdateMutation, useRemove: useMissionsRemoveMutation,
  }} />;
}

function ChallengesPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  const f = useFormatters();
  const now = new Date();
  return <ResourcePage config={{
    title: t('nav.challenges'), note: t('resources.missionsNote'), schema: ChallengeInputSchema,
    defaults: { name: '', description: '', action: 'place_wish', target: 10, scope: 'personal', startsAt: now.toISOString(), endsAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(), active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'name', label: tf('name'), kind: 'text' }, { name: 'description', label: tf('description'), kind: 'textarea' }, { name: 'action', label: tf('action'), kind: 'select', options: options(MISSION_ACTIONS, (a) => to(`missionAction.${a}`)) },
      { name: 'target', label: tf('target'), kind: 'number' }, { name: 'scope', label: tf('scope'), kind: 'select', options: options(CHALLENGE_SCOPES, (s) => to(`scope.${s}`)) },
      { name: 'startsAt', label: tf('startsAt'), kind: 'datetime' }, { name: 'endsAt', label: tf('endsAt'), kind: 'datetime' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('action'), cell: (i) => to(`missionAction.${i.action}`) }, { header: tf('target'), cell: (i) => i.target }, { header: tf('scope'), cell: (i) => to(`scope.${i.scope}`) },
      { header: tf('endsAt'), cell: (i) => f.date(i.endsAt) }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useChallengesListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useChallengesCreateMutation, useUpdate: useChallengesUpdateMutation, useRemove: useChallengesRemoveMutation,
  }} />;
}

function EventsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const f = useFormatters();
  const now = new Date();
  return <ResourcePage config={{
    title: t('nav.events'), schema: EventInputSchema,
    defaults: { title: '', description: '', coverUrl: null, startsAt: now.toISOString(), endsAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(), active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'title', label: tf('title'), kind: 'text' }, { name: 'description', label: tf('description'), kind: 'textarea' }, { name: 'coverUrl', label: tf('coverUrl'), kind: 'nullableText' },
      { name: 'startsAt', label: tf('startsAt'), kind: 'datetime' }, { name: 'endsAt', label: tf('endsAt'), kind: 'datetime' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('title'), cell: (i) => <b>{i.title}</b> }, { header: tf('startsAt'), cell: (i) => f.date(i.startsAt) }, { header: tf('endsAt'), cell: (i) => f.date(i.endsAt) }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useEventsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useEventsCreateMutation, useUpdate: useEventsUpdateMutation, useRemove: useEventsRemoveMutation,
  }} />;
}

function LevelsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  return <ResourcePage config={{
    title: t('nav.levels'), note: `${t('resources.levelsNote')} ${t('resources.pending')}`, schema: LevelInputSchema, defaults: { level: 1, name: '', minPoints: 0 }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'level', label: tf('level'), kind: 'number' }, { name: 'name', label: tf('name'), kind: 'text' }, { name: 'minPoints', label: tf('minPoints'), kind: 'number' }],
    columns: [{ header: tf('level'), cell: (i) => i.level }, { header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('minPoints'), cell: (i) => i.minPoints }],
    useList: () => { const q = useLevelsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useLevelsCreateMutation, useUpdate: useLevelsUpdateMutation, useRemove: useLevelsRemoveMutation,
  }} />;
}

function BadgesPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  return <ResourcePage config={{
    title: t('nav.badges'), note: `${t('resources.badgesNote')} ${t('resources.pending')}`, schema: BadgeInputSchema,
    defaults: { code: '', name: '', description: '', iconKey: 'crown', conditionType: 'total_points', threshold: 10, active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'code', label: tf('code'), kind: 'text' }, { name: 'name', label: tf('name'), kind: 'text' }, { name: 'description', label: tf('description'), kind: 'textarea' },
      { name: 'iconKey', label: tf('iconKey'), kind: 'select', options: options(ICON_KEYS, (k) => k) }, { name: 'conditionType', label: tf('conditionType'), kind: 'select', options: options(BADGE_CONDITIONS, (c) => to(`badgeCondition.${c}`)) },
      { name: 'threshold', label: tf('threshold'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('iconKey'), cell: (i) => <AppIcon iconKey={i.iconKey} className="text-2xl" /> }, { header: tf('name'), cell: (i) => <b>{i.name}</b> }, { header: tf('conditionType'), cell: (i) => to(`badgeCondition.${i.conditionType}`) },
      { header: tf('threshold'), cell: (i) => i.threshold }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useBadgesListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useBadgesCreateMutation, useUpdate: useBadgesUpdateMutation, useRemove: useBadgesRemoveMutation,
  }} />;
}

function HomeActionsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const to = useTranslations('admin.resources.options');
  return <ResourcePage config={{
    title: t('nav.homeActions'), schema: HomeActionInputSchema,
    defaults: { code: '', label: '', subLabel: '', iconUrl: null, kind: 'link', href: null, showMobile: true, showTablet: true, showDesktop: true, sortOrder: 0, sortTablet: null, sortDesktop: null, active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'code', label: tf('code'), kind: 'text' }, { name: 'label', label: tf('label'), kind: 'text' }, { name: 'subLabel', label: tf('subLabel'), kind: 'text' }, { name: 'iconUrl', label: tf('iconUrl'), kind: 'asset' },
      { name: 'kind', label: tf('action'), kind: 'select', options: options(HOME_ACTION_KINDS, (k) => to(`homeActionKind.${k}`)) }, { name: 'href', label: tf('href'), kind: 'nullableText' },
      { name: 'showMobile', label: tf('showMobile'), kind: 'switch' }, { name: 'showTablet', label: tf('showTablet'), kind: 'switch' }, { name: 'showDesktop', label: tf('showDesktop'), kind: 'switch' },
      { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'sortTablet', label: tf('sortTablet'), kind: 'nullableNumber' }, { name: 'sortDesktop', label: tf('sortDesktop'), kind: 'nullableNumber' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('sortOrder'), cell: (i) => i.sortOrder }, { header: tf('label'), cell: (i) => <b>{i.label}</b> }, { header: tf('action'), cell: (i) => to(`homeActionKind.${i.kind}`) }, { header: tf('href'), cell: (i) => i.href ?? '—' }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useHomeActionsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useHomeActionsCreateMutation, useUpdate: useHomeActionsUpdateMutation, useRemove: useHomeActionsRemoveMutation,
  }} />;
}

function FooterLinksPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  return <ResourcePage config={{
    title: t('nav.footerLinks'), schema: FooterLinkInputSchema, defaults: { groupName: '', label: '', href: '/', sortOrder: 0, active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'groupName', label: tf('groupName'), kind: 'text' }, { name: 'label', label: tf('label'), kind: 'text' }, { name: 'href', label: tf('href'), kind: 'text' }, { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('groupName'), cell: (i) => i.groupName }, { header: tf('label'), cell: (i) => <b>{i.label}</b> }, { header: tf('href'), cell: (i) => i.href }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useFooterLinksListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useFooterLinksCreateMutation, useUpdate: useFooterLinksUpdateMutation, useRemove: useFooterLinksRemoveMutation,
  }} />;
}

function StreetSlotsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.resources.fields');
  const { data: scenes } = useSceneTemplatesListQuery();
  const { data: placeList } = useAdminPlacesQuery({ page: 1, pageSize: 100 });
  const sceneOptions: SelectOption[] = (scenes ?? []).map((x) => ({ value: x.id, label: x.name }));
  const placeOptions: SelectOption[] = [{ value: '', label: tf('noPlace') }, ...(placeList?.items ?? []).map((x) => ({ value: x.id, label: x.title }))];
  return <ResourcePage config={{
    title: t('nav.streetSlots'), note: t('resources.streetNote'), schema: StreetSlotInputSchema,
    defaults: { label: '', placeId: null, sceneTemplateId: scenes?.[0]?.id ?? '', imageX: 0, imageY: 0, imageW: 10, imageH: 10, posX: 0, posZ: 0, rotationDeg: 0, sortOrder: 0, active: true }, toInput: ({ id: _id, ...rest }) => rest,
    fields: [{ name: 'label', label: tf('label'), kind: 'text' }, { name: 'placeId', label: tf('placeId'), kind: 'nullableSelect', options: placeOptions }, { name: 'sceneTemplateId', label: tf('sceneTemplateId'), kind: 'select', options: sceneOptions },
      { name: 'imageX', label: tf('imageX'), kind: 'number' }, { name: 'imageY', label: tf('imageY'), kind: 'number' }, { name: 'imageW', label: tf('imageW'), kind: 'number' }, { name: 'imageH', label: tf('imageH'), kind: 'number' },
      { name: 'posX', label: tf('posX'), kind: 'number' }, { name: 'posZ', label: tf('posZ'), kind: 'number' }, { name: 'rotationDeg', label: tf('rotationDeg'), kind: 'number' },
      { name: 'sortOrder', label: tf('sortOrder'), kind: 'number' }, { name: 'active', label: tf('active'), kind: 'switch' }],
    columns: [{ header: tf('sortOrder'), cell: (i) => i.sortOrder }, { header: tf('label'), cell: (i) => <b>{i.label}</b> }, { header: tf('sceneTemplateId'), cell: (i) => scenes?.find((x) => x.id === i.sceneTemplateId)?.name ?? '—' },
      { header: tf('placeId'), cell: (i) => placeList?.items.find((x) => x.id === i.placeId)?.title ?? '—' }, { header: tf('active'), cell: (i) => <ActiveBadge active={i.active} /> }],
    useList: () => { const q = useStreetSlotsListQuery(); return { data: q.data, isLoading: q.isLoading }; }, useCreate: useStreetSlotsCreateMutation, useUpdate: useStreetSlotsUpdateMutation, useRemove: useStreetSlotsRemoveMutation,
  }} />;
}

const PAGES: Record<AdminResourceKey, () => React.JSX.Element> = {
  'wish-types': WishTypesPage, 'wish-stickers': WishStickersPage, 'wish-templates': WishTemplatesPage, 'place-categories': PlaceCategoriesPage,
  'scene-templates': SceneTemplatesPage, keywords: KeywordsPage, 'hot-topics': HotTopicsPage, missions: MissionsPage, challenges: ChallengesPage, events: EventsPage, levels: LevelsPage, badges: BadgesPage, 'home-actions': HomeActionsPage, 'footer-links': FooterLinksPage, 'street-slots': StreetSlotsPage,
};

export function ResourceRoute({ resource }: { resource?: AdminResourceKey }) {
  const params = useParams<{ resource: string }>();
  const key = resource ?? (Object.keys(PAGES).find((k): k is AdminResourceKey => k === params.resource));
  if (!key) return <Navigate to="/" replace />;
  const Page = PAGES[key];
  return <Page key={key} />;
}
