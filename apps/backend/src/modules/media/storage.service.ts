import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { env } from '../../config/env';

/** Cổng lưu file: ổ đĩa khi dev, S3-compatible (Cloudflare R2) khi production. */
@Injectable()
export class StorageService {
  readonly localRoot = resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
  private readonly s3 = env.STORAGE_DRIVER === 's3'
    ? new S3Client({ region: 'auto', endpoint: env.S3_ENDPOINT, credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY } })
    : null;

  /** Lưu file và trả về URL công khai. */
  async save(key: string, body: Buffer, contentType: string): Promise<string> {
    if (this.s3) {
      await this.s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable' }));
      return `${env.S3_PUBLIC_BASE_URL}/${key}`;
    }
    const path = resolve(this.localRoot, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    return `/storage/${key}`;
  }
}
