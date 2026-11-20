import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '../config/env';
import { DomainError } from './domain-error';

interface Counter { count: number; resetAt: number }

/** Giới hạn tốc độ chống bot/spam: Redis khi có REDIS_URL, nếu không dùng bộ nhớ (dev). */
@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly memory = new Map<string, Counter>();
  private readonly redis: Redis | null = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 }) : null;

  async hit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; retryAfterSec: number }> {
    if (this.redis) {
      const redisKey = `rl:${key}`;
      const count = await this.redis.incr(redisKey);
      if (count === 1) await this.redis.expire(redisKey, windowSec);
      const ttl = await this.redis.ttl(redisKey);
      return { allowed: count <= limit, retryAfterSec: Math.max(ttl, 1) };
    }
    const now = Date.now();
    const current = this.memory.get(key);
    if (!current || current.resetAt <= now) {
      this.memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      if (this.memory.size > 50_000) this.sweep(now);
      return { allowed: 1 <= limit, retryAfterSec: windowSec };
    }
    current.count += 1;
    return { allowed: current.count <= limit, retryAfterSec: Math.max(Math.ceil((current.resetAt - now) / 1000), 1) };
  }

  async assert(key: string, limit: number, windowSec: number): Promise<void> {
    const result = await this.hit(key, limit, windowSec);
    if (!result.allowed) throw new DomainError('COMMON_RATE_LIMITED', { retryAfterSec: result.retryAfterSec });
  }

  private sweep(now: number): void {
    for (const [key, counter] of this.memory) if (counter.resetAt <= now) this.memory.delete(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit();
  }
}
