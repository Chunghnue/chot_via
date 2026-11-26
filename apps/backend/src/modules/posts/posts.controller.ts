import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query } from '@nestjs/common';
import {
  CreateCommentBodySchema, CreatePostBodySchema, IdParamSchema, PageQuerySchema, PostListQuerySchema, PostWishBodySchema, SearchQuerySchema,
  SetReactionBodySchema, VotePollBodySchema, type CreatePostBody, type PostListQuery,
} from '@chot-via/shared';
import { z } from 'zod';
import { Auth, Ctx, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { SettingsService } from '../../common/settings.service';
import { ZodPipe } from '../../common/zod.pipe';
import { PlacesService } from '../places/places.service';
import { UsersService } from '../users/users.service';
import { CommentsService } from './comments.service';
import { PostInteractionsService } from './post-interactions.service';
import { PostsService } from './posts.service';

const IdParam = new ZodPipe(IdParamSchema);
const Paging = new ZodPipe(PageQuerySchema);
type Page = { page: number; pageSize: number };

@Controller()
export class PostsController {
  constructor(
    @Inject(PostsService) private readonly posts: PostsService,
    @Inject(PostInteractionsService) private readonly interactions: PostInteractionsService,
    @Inject(CommentsService) private readonly commentsService: CommentsService,
    @Inject(PlacesService) private readonly places: PlacesService,
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  @Get('posts')
  list(@Ctx() ctx: RequestContext, @Query(new ZodPipe(PostListQuerySchema)) query: PostListQuery) {
    return this.posts.list(query, ctx);
  }

  @Get('hashtags/hot')
  async hot() {
    return ok('OK', await this.posts.hotHashtags(5, (await this.settings.get()).hot.windowDays));
  }

  @Get('topics/hot')
  async topics() {
    return ok('OK', await this.posts.hotTopics());
  }

  @Get('posts/featured-poll')
  async featuredPoll(@Ctx() ctx: RequestContext) {
    return ok('OK', await this.posts.featuredPoll(ctx));
  }

  @Get('posts/top-story-authors')
  async topStoryAuthors() {
    return ok('OK', await this.posts.topStoryAuthors(3));
  }

  @Get('search')
  async search(@Ctx() ctx: RequestContext, @Query(new ZodPipe(SearchQuerySchema)) query: { q: string }) {
    const [posts, places, users] = await Promise.all([
      this.posts.search(query.q, ctx, 10),
      this.places.list({ search: query.q, sort: 'street', scope: 'all', page: 1, pageSize: 8 }, ctx),
      this.users.search(query.q, 8),
    ]);
    return ok('OK', { posts, places: places.data, users });
  }

  @Get('me/saved-posts')
  @Auth()
  saved(@Ctx() ctx: RequestContext, @Query(Paging) query: Page) {
    return this.posts.saved(requireUser(ctx).id, ctx, query.page, query.pageSize);
  }

  @Post('posts')
  @Auth()
  async create(@Ctx() ctx: RequestContext, @Body(new ZodPipe(CreatePostBodySchema)) body: CreatePostBody) {
    return ok('POST_CREATED', await this.posts.create(requireUser(ctx).id, body, ctx));
  }

  @Get('posts/:id')
  async one(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.posts.getOne(params.id, ctx));
  }

  @Delete('posts/:id')
  @Auth()
  async remove(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    await this.posts.remove(requireUser(ctx).id, params.id);
    return ok('POST_DELETED', { ok: true as const });
  }

  @Put('posts/:id/reaction')
  @Auth()
  async react(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(SetReactionBodySchema)) body: { type: 'like' | 'love' | 'haha' }) {
    return ok('OK', await this.interactions.setReaction(requireUser(ctx).id, params.id, body.type));
  }

  @Delete('posts/:id/reaction')
  @Auth()
  async unreact(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.interactions.setReaction(requireUser(ctx).id, params.id, null));
  }

  @Put('posts/:id/save')
  @Auth()
  async save(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', { saved: await this.interactions.setSaved(requireUser(ctx).id, params.id, true) });
  }

  @Delete('posts/:id/save')
  @Auth()
  async unsave(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', { saved: await this.interactions.setSaved(requireUser(ctx).id, params.id, false) });
  }

  @Post('posts/:id/share')
  async share(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', { shares: await this.interactions.share(ctx, params.id) });
  }

  @Post('posts/:id/wishes')
  async wish(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(PostWishBodySchema)) body: { wishTypeId?: string }) {
    return ok('WISH_SENT', await this.interactions.wishPost(ctx, params.id, body.wishTypeId));
  }

  @Post('posts/:id/poll/vote')
  @Auth()
  async vote(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(VotePollBodySchema)) body: { optionId: string }) {
    return ok('POLL_VOTED', await this.interactions.votePoll(requireUser(ctx).id, params.id, body.optionId, ctx));
  }

  @Get('posts/:id/comments')
  comments(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Query(Paging) query: Page) {
    return this.commentsService.comments(params.id, ctx, query.page, query.pageSize);
  }

  @Post('posts/:id/comments')
  @Auth()
  async comment(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(CreateCommentBodySchema)) body: z.infer<typeof CreateCommentBodySchema>) {
    return ok('COMMENT_CREATED', await this.commentsService.addComment(requireUser(ctx).id, params.id, body.body, ctx));
  }
}
