import {
  useDemoPostCreateMutation,
  useDemoPostDeleteMutation,
  useDemoPostsListQuery,
  useDemoPostUpdateMutation,
  useDemoUserCreateMutation,
  useDemoUserDeleteMutation,
  useDemoUsersListQuery,
  useDemoUserUpdateMutation,
} from '@chot-via/api-client';
import {
  ACCOUNT_STATUSES,
  DEMO_POST_TYPES,
  DemoPostInputSchema,
  DemoUserInputSchema,
  MEMBER_ROLES,
  type DemoPostInput,
  type DemoPostItem,
  type DemoUserInput,
  type DemoUserItem,
} from '@chot-via/shared';
import { Avatar, Badge } from '@chot-via/ui';
import { useTranslations } from 'use-intl';
import { ResourcePage } from '../components/resource-page';

const hoursSince = (iso: string): number => Math.max(0, Math.round(((Date.now() - new Date(iso).getTime()) / 3_600_000) * 10) / 10);

/** Quản lý tài khoản mẫu (is_demo): tạo, sửa, khóa, xóa. Không đụng tới người dùng thật. */
export function DemoUsersPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.demo.fields');
  const to = useTranslations('admin.demo');
  return <ResourcePage<DemoUserItem, DemoUserInput> config={{
    title: t('nav.demoUsers'), note: to('usersNote'), schema: DemoUserInputSchema,
    defaults: { displayName: '', memberRole: 'owner', jobTitle: null, province: null, avatarUrl: null, status: 'active' },
    toInput: ({ id: _id, createdAt: _c, ...rest }) => rest,
    fields: [
      { name: 'displayName', label: tf('displayName'), kind: 'text' },
      { name: 'memberRole', label: tf('memberRole'), kind: 'nullableSelect', options: [{ value: '', label: '—' }, ...MEMBER_ROLES.map((r) => ({ value: r, label: to(`roles.${r}`) }))] },
      { name: 'jobTitle', label: tf('jobTitle'), kind: 'nullableText' },
      { name: 'province', label: tf('province'), kind: 'nullableText' },
      { name: 'avatarUrl', label: tf('avatar'), kind: 'image' },
      { name: 'status', label: tf('status'), kind: 'select', options: ACCOUNT_STATUSES.map((s) => ({ value: s, label: to(`status.${s}`) })) },
    ],
    columns: [
      { header: tf('displayName'), cell: (i) => <span className="flex items-center gap-2"><Avatar src={i.avatarUrl} name={i.displayName} size={32} /><b>{i.displayName}</b></span> },
      { header: tf('memberRole'), cell: (i) => (i.memberRole ? to(`roles.${i.memberRole}`) : '—') },
      { header: tf('jobTitle'), cell: (i) => i.jobTitle ?? '—' },
      { header: tf('status'), cell: (i) => <Badge tone={i.status === 'active' ? 'success' : 'danger'}>{to(`status.${i.status}`)}</Badge> },
    ],
    useList: () => { const q = useDemoUsersListQuery(); return { data: q.data, isLoading: q.isLoading }; },
    useCreate: useDemoUserCreateMutation, useUpdate: useDemoUserUpdateMutation, useRemove: useDemoUserDeleteMutation,
  }} />;
}

/** Quản lý bài mẫu: tạo, sửa, xóa, ghim; chỉnh được số cảm xúc/bình luận/chia sẻ và thời điểm đăng để bảng tin hiển thị đúng thiết kế. */
export function DemoPostsPage() {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.demo.fields');
  const to = useTranslations('admin.demo');
  const { data: authors } = useDemoUsersListQuery();
  return <ResourcePage<DemoPostItem, DemoPostInput> config={{
    title: t('nav.demoPosts'), note: to('postsNote'), schema: DemoPostInputSchema,
    defaults: { authorId: authors?.[0]?.id ?? '', type: 'story', body: '', hashtags: [], imageUrl: null, pinned: false, reactionCount: 0, commentCount: 0, shareCount: 0, hoursAgo: 1 },
    toInput: ({ id: _id, authorName: _n, createdAt, ...rest }) => ({ ...rest, hoursAgo: hoursSince(createdAt) }),
    fields: [
      { name: 'authorId', label: tf('author'), kind: 'select', options: (authors ?? []).map((a) => ({ value: a.id, label: a.displayName })) },
      { name: 'type', label: tf('postType'), kind: 'select', options: DEMO_POST_TYPES.map((p) => ({ value: p, label: to(`postTypes.${p}`) })) },
      { name: 'body', label: tf('body'), kind: 'textarea' },
      { name: 'hashtags', label: tf('hashtags'), kind: 'tags' },
      { name: 'imageUrl', label: tf('image'), kind: 'image' },
      { name: 'pinned', label: tf('pinned'), kind: 'switch' },
      { name: 'reactionCount', label: tf('reactions'), kind: 'number' },
      { name: 'commentCount', label: tf('comments'), kind: 'number' },
      { name: 'shareCount', label: tf('shares'), kind: 'number' },
      { name: 'hoursAgo', label: tf('hoursAgo'), kind: 'number' },
    ],
    columns: [
      { header: tf('author'), cell: (i) => <b>{i.authorName}</b> },
      { header: tf('body'), cell: (i) => <span className="line-clamp-2 max-w-md">{i.body}</span> },
      { header: tf('postType'), cell: (i) => to(`postTypes.${i.type}`) },
      { header: tf('pinned'), cell: (i) => (i.pinned ? <Badge tone="gold">{to('pinnedBadge')}</Badge> : '—') },
      { header: tf('reactions'), cell: (i) => i.reactionCount },
    ],
    useList: () => { const q = useDemoPostsListQuery(); return { data: q.data, isLoading: q.isLoading }; },
    useCreate: useDemoPostCreateMutation, useUpdate: useDemoPostUpdateMutation, useRemove: useDemoPostDeleteMutation,
  }} />;
}
