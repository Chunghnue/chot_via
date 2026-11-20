import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { mkdir } from 'node:fs/promises';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { env } from './config/env';
import { StorageService } from './modules/media/storage.service';

async function bootstrap(): Promise<void> {
  if (env.SENTRY_DSN) Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });

  const adapter = new FastifyAdapter({ trustProxy: true, logger: { level: env.NODE_ENV === 'production' ? 'info' : 'warn' }, bodyLimit: 1_048_576 });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);
  app.setGlobalPrefix('api/v1');
  await app.register(fastifyCookie);
  await app.register(fastifyHelmet, { contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } });
  await app.register(fastifyMultipart);

  const storage = app.get(StorageService);
  if (env.STORAGE_DRIVER === 'local') {
    await mkdir(storage.localRoot, { recursive: true });
    await app.register(fastifyStatic, { root: storage.localRoot, prefix: '/storage/', decorateReply: false, maxAge: '30d' });
  }
  app.enableShutdownHooks();
  await app.listen(env.PORT, '0.0.0.0');
  new Logger('Bootstrap').log(`API đang chạy tại http://localhost:${env.PORT}/api/v1`);
}

void bootstrap();
