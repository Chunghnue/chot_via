import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  ADMIN_RESOURCE_KEYS, AdminCommentUpdateSchema, AdminListQuerySchema, AdminPlaceInputSchema, AdminPlaceUpdateSchema, AdminPostUpdateSchema, type AdminPostUpdate, DemoPostInputSchema, DemoUserInputSchema, type DemoPostInput, type DemoUserInput,
  AdminReportActionSchema, AdminUserUpdateSchema, AppSettingsSchema, HomeConfigSchema, type HomeConfig, IdParamSchema, PageQuerySchema, type AdminListQuery, type AdminPlaceInput,
  type AdminPlaceUpdate, type AdminReportAction, type AdminResourceKey, type AdminUserUpdate, type AppSettings,
} from '@xin-via/shared';
import { z } from 'zod';
import { Ctx, Roles, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { SettingsService } from '../../common/settings.service';
import { ZodPipe } from '../../common/zod.pipe';
import { HomeLayoutService } from '../catalog/home-layout.service';
import { StorageService } from '../media/storage.service';
import { PlacesService } from '../places/places.service';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminDemoService } from './admin-demo.service';
import { AdminService } from './admin.service';

const IdParam = new ZodPipe(IdParamSchema);
const ListQuery = new ZodPipe(AdminListQuerySchema);
const ResourceParam = new ZodPipe(z.object({ resource: z.string().refine((v): v is AdminResourceKey => ADMIN_RESOURCE_KEYS.some((k) => k === v), 'invalid_string') }));
const ResourceIdParam = new ZodPipe(z.object({ resource: z.string(), id: z.string().uuid() }));

function resourceOf(value: string): AdminResourceKey {
  const found = ADMIN_RESOURCE_KEYS.find((k) => k === value);
  if (!found) throw new DomainError('COMMON_NOT_FOUND');
  return found;
}

/** Quản trị & kiểm duyệt. Mặc định cho admin + moderator; phần cấu hình chỉ admin. */
@Controller('admin')
@Roles('admin', 'moderator')
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly admin: AdminService,
    @Inject(AdminCatalogService) private readonly catalog: AdminCatalogService,
    @Inject(PlacesService) private readonly places: PlacesService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(AdminDemoService) private readonly demo: AdminDemoService,
    @Inject(HomeLayoutService) private readonly home: HomeLayoutService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private assertAdmin(ctx: RequestContext): void {
    if (requireUser(ctx).accountRole !== 'admin') throw new DomainError('COMMON_FORBIDDEN');
  }

  @Get('stats')
  async stats() {
    return ok('OK', await this.admin.stats());
  }

  @Get('reports')
  reports(@Query(ListQuery) query: AdminListQuery) {
    return this.admin.reportList(query);
  }

  @Patch('reports/:id')
  async actOnReport(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(AdminReportActionSchema)) body: AdminReportAction) {
    await this.admin.actOnReport(params.id, body.action, requireUser(ctx).id);
    return ok('UPDATED', { ok: true as const });
  }

  @Get('posts')
  posts(@Ctx() ctx: RequestContext, @Query(ListQuery) query: AdminListQuery) {
    return this.admin.postList(query, ctx);
  }

  @Patch('posts/:id')
  async setPost(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(AdminPostUpdateSchema)) body: AdminPostUpdate) {
    const actor = requireUser(ctx).id;
    if (body.status !== undefined) await this.admin.setPostStatus(params.id, body.status, actor);
    if (body.pinned !== undefined) await this.admin.setPostPinned(params.id, body.pinned, actor);
    return ok('UPDATED', { ok: true as const });
  }

  @Get('comments')
  comments(@Query(ListQuery) query: AdminListQuery) {
    return this.admin.commentList(query);
  }

  @Patch('comments/:id')
  async setComment(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(AdminCommentUpdateSchema)) body: { status: 'published' | 'hidden' }) {
    await this.admin.setCommentStatus(params.id, body.status, requireUser(ctx).id);
    return ok('UPDATED', { ok: true as const });
  }

  @Get('places')
  places_(@Query(new ZodPipe(PageQuerySchema.extend({ search: z.string().optional() }))) query: { page: number; pageSize: number; search?: string }) {
    return this.places.adminList(query);
  }

  @Get('places/:id')
  async place(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    return ok('OK', await this.places.detail(params.id, ctx, true));
  }

  @Post('places')
  async createPlace(@Ctx() ctx: RequestContext, @Body(new ZodPipe(AdminPlaceInputSchema)) body: AdminPlaceInput) {
    const created = await this.places.adminCreate(body, ctx);
    await this.admin.audit(requireUser(ctx).id, 'place.create', 'place', created.id);
    return ok('PLACE_CREATED', created);
  }

  @Patch('places/:id')
  async updatePlace(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(AdminPlaceUpdateSchema)) body: AdminPlaceUpdate) {
    const updated = await this.places.adminUpdate(params.id, body, ctx);
    await this.admin.audit(requireUser(ctx).id, 'place.update', 'place', params.id);
    return ok('PLACE_UPDATED', updated);
  }

  @Delete('places/:id')
  async deletePlace(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    await this.places.adminDelete(params.id);
    await this.admin.audit(requireUser(ctx).id, 'place.delete', 'place', params.id);
    return ok('DELETED', { ok: true as const });
  }

  @Get('users')
  users(@Query(ListQuery) query: AdminListQuery) {
    return this.admin.userList(query);
  }

  @Patch('users/:id')
  async updateUser(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(AdminUserUpdateSchema)) body: AdminUserUpdate) {
    const actor = requireUser(ctx);
    await this.admin.updateUser(params.id, body, actor.id, actor.accountRole === 'admin');
    return ok('UPDATED', { ok: true as const });
  }

  @Get('demo/users')
  async demoUsers(@Ctx() ctx: RequestContext) {
    this.assertAdmin(ctx);
    return ok('OK', await this.demo.listUsers());
  }

  @Post('demo/users')
  async createDemoUser(@Ctx() ctx: RequestContext, @Body(new ZodPipe(DemoUserInputSchema)) body: DemoUserInput) {
    this.assertAdmin(ctx);
    const created = await this.demo.createUser(body);
    await this.admin.audit(requireUser(ctx).id, 'demo_user.create', 'user', created.id);
    return ok('CREATED', created);
  }

  @Put('demo/users/:id')
  async updateDemoUser(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(DemoUserInputSchema)) body: DemoUserInput) {
    this.assertAdmin(ctx);
    await this.demo.updateUser(params.id, body);
    await this.admin.audit(requireUser(ctx).id, 'demo_user.update', 'user', params.id);
    return ok('UPDATED', { ok: true as const });
  }

  @Delete('demo/users/:id')
  async deleteDemoUser(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    this.assertAdmin(ctx);
    await this.demo.deleteUser(params.id);
    await this.admin.audit(requireUser(ctx).id, 'demo_user.delete', 'user', params.id);
    return ok('DELETED', { ok: true as const });
  }

  @Get('demo/posts')
  async demoPosts(@Ctx() ctx: RequestContext) {
    this.assertAdmin(ctx);
    return ok('OK', await this.demo.listPosts());
  }

  @Post('demo/posts')
  async createDemoPost(@Ctx() ctx: RequestContext, @Body(new ZodPipe(DemoPostInputSchema)) body: DemoPostInput) {
    this.assertAdmin(ctx);
    await this.demo.createPost(body);
    await this.admin.audit(requireUser(ctx).id, 'demo_post.create', 'post', null);
    return ok('CREATED', { ok: true as const });
  }

  @Put('demo/posts/:id')
  async updateDemoPost(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }, @Body(new ZodPipe(DemoPostInputSchema)) body: DemoPostInput) {
    this.assertAdmin(ctx);
    await this.demo.updatePost(params.id, body);
    await this.admin.audit(requireUser(ctx).id, 'demo_post.update', 'post', params.id);
    return ok('UPDATED', { ok: true as const });
  }

  @Delete('demo/posts/:id')
  async deleteDemoPost(@Ctx() ctx: RequestContext, @Param(IdParam) params: { id: string }) {
    this.assertAdmin(ctx);
    await this.demo.deletePost(params.id);
    await this.admin.audit(requireUser(ctx).id, 'demo_post.delete', 'post', params.id);
    return ok('DELETED', { ok: true as const });
  }

  @Get('settings')
  async getSettings(@Ctx() ctx: RequestContext) {
    this.assertAdmin(ctx);
    return ok('OK', await this.settings.get());
  }

  @Put('settings')
  async putSettings(@Ctx() ctx: RequestContext, @Body(new ZodPipe(AppSettingsSchema)) body: AppSettings) {
    this.assertAdmin(ctx);
    return ok('UPDATED', await this.admin.saveSettings(body, requireUser(ctx).id));
  }

  @Get('home-config')
  async getHomeConfig(@Ctx() ctx: RequestContext) {
    this.assertAdmin(ctx);
    return ok('OK', await this.home.getConfig());
  }

  @Put('home-config')
  async putHomeConfig(@Ctx() ctx: RequestContext, @Body(new ZodPipe(HomeConfigSchema)) body: HomeConfig) {
    this.assertAdmin(ctx);
    const saved = await this.home.saveConfig(body);
    await this.admin.audit(requireUser(ctx).id, 'home_config.update', 'settings', null);
    return ok('UPDATED', saved);
  }

  /** Tải file gốc (ảnh phố độ phân giải cao hoặc model GLB) cho trang chủ: không nén lại, giữ nguyên chất lượng. */
  @Post('assets')
  async uploadAsset(@Ctx() ctx: RequestContext, @Req() req: FastifyRequest) {
    this.assertAdmin(ctx);
    const part = await req.file({ limits: { fileSize: 40 * 1024 * 1024, files: 1 } });
    if (!part) throw new DomainError('MEDIA_TYPE_INVALID');
    const data = await part.toBuffer();
    if (part.file.truncated) throw new DomainError('MEDIA_TOO_LARGE', { maxMb: 40 });
    const isGlb = data.subarray(0, 4).toString('latin1') === 'glTF';
    const isPng = data[0] === 0x89 && data.subarray(1, 4).toString('latin1') === 'PNG';
    const isJpg = data[0] === 0xff && data[1] === 0xd8;
    const isWebp = data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP';
    const kind = isGlb ? { ext: 'glb', type: 'model/gltf-binary' } : isPng ? { ext: 'png', type: 'image/png' } : isJpg ? { ext: 'jpg', type: 'image/jpeg' } : isWebp ? { ext: 'webp', type: 'image/webp' } : null;
    if (!kind) throw new DomainError('MEDIA_TYPE_INVALID');
    const url = await this.storage.save(`home/${randomUUID()}.${kind.ext}`, data, kind.type);
    await this.admin.audit(requireUser(ctx).id, 'home_asset.upload', 'asset', null);
    return ok('MEDIA_UPLOADED', { url });
  }

  @Get('audit-logs')
  audit(@Ctx() ctx: RequestContext, @Query(new ZodPipe(PageQuerySchema)) query: { page: number; pageSize: number }) {
    this.assertAdmin(ctx);
    return this.admin.auditList(query.page, query.pageSize);
  }

  /* ---- Danh mục cấu hình (CRUD dùng chung): admin; từ khóa nhạy cảm moderator cũng dùng được ---- */
  private assertResourceAccess(ctx: RequestContext, key: AdminResourceKey): void {
    if (key !== 'keywords') this.assertAdmin(ctx);
  }

  @Get('catalog/:resource')
  async list(@Ctx() ctx: RequestContext, @Param(ResourceParam) params: { resource: string }) {
    const key = resourceOf(params.resource);
    this.assertResourceAccess(ctx, key);
    return ok('OK', await this.catalog.list(key));
  }

  @Post('catalog/:resource')
  async create(@Ctx() ctx: RequestContext, @Param(ResourceParam) params: { resource: string }, @Body() body: unknown) {
    const key = resourceOf(params.resource);
    this.assertResourceAccess(ctx, key);
    const created = await this.catalog.create(key, body);
    await this.admin.audit(requireUser(ctx).id, `${key}.create`, key, null);
    return ok('CREATED', created);
  }

  @Put('catalog/:resource/:id')
  async update(@Ctx() ctx: RequestContext, @Param(ResourceIdParam) params: { resource: string; id: string }, @Body() body: unknown) {
    const key = resourceOf(params.resource);
    this.assertResourceAccess(ctx, key);
    const updated = await this.catalog.update(key, params.id, body);
    await this.admin.audit(requireUser(ctx).id, `${key}.update`, key, params.id);
    return ok('UPDATED', updated);
  }

  @Delete('catalog/:resource/:id')
  async remove(@Ctx() ctx: RequestContext, @Param(ResourceIdParam) params: { resource: string; id: string }) {
    const key = resourceOf(params.resource);
    this.assertResourceAccess(ctx, key);
    await this.catalog.remove(key, params.id);
    await this.admin.audit(requireUser(ctx).id, `${key}.delete`, key, params.id);
    return ok('DELETED', { ok: true as const });
  }
}
