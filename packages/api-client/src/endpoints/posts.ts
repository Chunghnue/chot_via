import {
  CommentSchema, HashtagCountSchema, HotTopicSchema, MediaSchema, OkSchema, PollSchema, PostSchema, ReactionResultSchema, SavedResultSchema, SearchResultSchema,
  ShareResultSchema, StoryAuthorRankSchema, type CreatePostBody, type PostListQuery,
} from '@xin-via/shared';
import { z } from 'zod';
import { baseApi, unwrap, unwrapPaged, type Paged } from '../base';

type Post = z.output<typeof PostSchema>;
type PostListArgs = Partial<Omit<PostListQuery, 'page' | 'pageSize'>> & { page?: number; pageSize?: number };

/** Khóa cache bỏ `page` để các trang nối vào cùng một danh sách (cuộn vô hạn). */
function listKey(args: PostListArgs): string {
  const { page: _page, ...rest } = args;
  return JSON.stringify(rest);
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPosts: b.query<Paged<Post>, PostListArgs>({
      query: (args) => ({ url: '/posts', params: { pageSize: 10, ...args } }),
      transformResponse: unwrapPaged(PostSchema),
      serializeQueryArgs: ({ queryArgs }) => listKey(queryArgs),
      merge: (current, incoming, { arg }) => {
        if ((arg.page ?? 1) === 1) return incoming;
        const seen = new Set(current.items.map((p) => p.id));
        return { items: [...current.items, ...incoming.items.filter((p) => !seen.has(p.id))], meta: incoming.meta };
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
      providesTags: ['Posts'],
    }),
    getPost: b.query<Post, string>({
      query: (id: string) => `/posts/${id}`,
      transformResponse: unwrap(PostSchema),
      providesTags: (_r, _e, id) => [{ type: 'Post', id }],
    }),
    getSavedPosts: b.query({
      query: (page: number) => ({ url: '/me/saved-posts', params: { page, pageSize: 10 } }),
      transformResponse: unwrapPaged(PostSchema),
      providesTags: ['Posts'],
    }),
    getComments: b.query<Paged<z.output<typeof CommentSchema>>, { postId: string; page: number }>({
      query: ({ postId, page }: { postId: string; page: number }) => ({ url: `/posts/${postId}/comments`, params: { page, pageSize: 20 } }),
      transformResponse: unwrapPaged(CommentSchema),
      providesTags: (_r, _e, { postId }) => [{ type: 'Comments', id: postId }],
    }),
    addComment: b.mutation<z.output<typeof CommentSchema>, { postId: string; body: string }>({
      query: ({ postId, body }: { postId: string; body: string }) => ({ url: `/posts/${postId}/comments`, method: 'POST', body: { body } }),
      transformResponse: unwrap(CommentSchema),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Comments', id: postId }, { type: 'Post', id: postId }, 'Missions'],
    }),
    createPost: b.mutation<Post, CreatePostBody>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      transformResponse: unwrap(PostSchema),
      invalidatesTags: ['Posts', 'Home', 'Missions', 'Stats'],
    }),
    deletePost: b.mutation<z.output<typeof OkSchema>, string>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      transformResponse: unwrap(OkSchema),
      invalidatesTags: ['Posts', 'Home', 'Stats'],
    }),
    setReaction: b.mutation({
      query: ({ postId, type }: { postId: string; type: 'like' | 'love' | 'haha' | null }) =>
        type ? { url: `/posts/${postId}/reaction`, method: 'PUT', body: { type } } : { url: `/posts/${postId}/reaction`, method: 'DELETE' },
      transformResponse: unwrap(ReactionResultSchema),
      invalidatesTags: ['Missions'],
    }),
    setSaved: b.mutation({
      query: ({ postId, on }: { postId: string; on: boolean }) => ({ url: `/posts/${postId}/save`, method: on ? 'PUT' : 'DELETE' }),
      transformResponse: unwrap(SavedResultSchema),
    }),
    sharePost: b.mutation({
      query: (postId: string) => ({ url: `/posts/${postId}/share`, method: 'POST' }),
      transformResponse: unwrap(ShareResultSchema),
    }),
    votePoll: b.mutation({
      query: ({ postId, optionId }: { postId: string; optionId: string }) => ({ url: `/posts/${postId}/poll/vote`, method: 'POST', body: { optionId } }),
      transformResponse: unwrap(PollSchema),
    }),
    getHotHashtags: b.query({ query: (_arg: void) => '/hashtags/hot', transformResponse: unwrap(z.array(HashtagCountSchema)), providesTags: ['Posts'] }),
    getHotTopics: b.query({ query: (_arg: void) => '/topics/hot', transformResponse: unwrap(z.array(HotTopicSchema)), providesTags: ['Posts'] }),
    getFeaturedPoll: b.query({ query: (_arg: void) => '/posts/featured-poll', transformResponse: unwrap(PostSchema.nullable()), providesTags: ['Posts'] }),
    getTopStoryAuthors: b.query({ query: (_arg: void) => '/posts/top-story-authors', transformResponse: unwrap(z.array(StoryAuthorRankSchema)), providesTags: ['Posts'] }),
    search: b.query({ query: (q: string) => ({ url: '/search', params: { q } }), transformResponse: unwrap(SearchResultSchema) }),
    uploadMedia: b.mutation({
      query: (file: File) => {
        const form = new FormData();
        form.append('file', file);
        return { url: '/media', method: 'POST', body: form };
      },
      transformResponse: unwrap(MediaSchema),
    }),
  }),
});

export const {
  useGetPostsQuery, useGetPostQuery, useGetSavedPostsQuery, useGetCommentsQuery, useAddCommentMutation, useCreatePostMutation,
  useDeletePostMutation, useSetReactionMutation, useSetSavedMutation, useSharePostMutation, useVotePollMutation, useGetHotHashtagsQuery,
  useGetHotTopicsQuery, useGetFeaturedPollQuery, useGetTopStoryAuthorsQuery, useSearchQuery, useUploadMediaMutation,
} = postsApi;
