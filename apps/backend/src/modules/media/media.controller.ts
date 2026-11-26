import { Controller, Inject, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import sharp, { type OutputInfo } from 'sharp';
import { Auth, Ctx, requireUser, type RequestContext } from '../../common/access';
import { ok } from '../../common/api';
import { DomainError } from '../../common/domain-error';
import { RateLimitService } from '../../common/rate-limit.service';
import { SettingsService } from '../../common/settings.service';
import { DB, type Db } from '../../database/database';
import { postMedia } from '../../database/schema';
import { StorageService } from './storage.service';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Controller('media')
export class MediaController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(RateLimitService) private readonly rate: RateLimitService,
  ) {}

  /** Tải ảnh lên (đã đăng nhập): nén về WebP, tối đa 1600px, giới hạn dung lượng theo cài đặt. */
  @Post()
  @Auth()
  async upload(@Ctx() ctx: RequestContext, @Req() req: FastifyRequest) {
    const user = requireUser(ctx);
    await this.rate.assert(`media:${user.id}`, 60, 3600);
    const { imageMaxMb } = await this.settings.get();
    const part = await req.file({ limits: { fileSize: Math.ceil(imageMaxMb * 1024 * 1024), files: 1 } });
    if (!part) throw new DomainError('MEDIA_TYPE_INVALID');
    if (!ALLOWED.has(part.mimetype)) throw new DomainError('MEDIA_TYPE_INVALID');
    const input = await part.toBuffer();
    if (part.file.truncated) throw new DomainError('MEDIA_TOO_LARGE', { maxMb: imageMaxMb });

    let output: { data: Buffer; info: OutputInfo };
    try {
      output = await sharp(input, { animated: false })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new DomainError('MEDIA_TYPE_INVALID');
    }
    const key = `u/${user.id}/${randomUUID()}.webp`;
    const url = await this.storage.save(key, output.data, 'image/webp');
    const [row] = await this.db.insert(postMedia).values({ ownerId: user.id, url, width: output.info.width, height: output.info.height }).returning();
    return ok('MEDIA_UPLOADED', { id: row?.id ?? '', url, width: output.info.width, height: output.info.height });
  }
}
