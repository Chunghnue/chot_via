import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../config/env';
import { DomainError } from './domain-error';

const VerifySchema = z.object({ success: z.boolean() });

/** Cloudflare Turnstile chạy ẩn. Không cấu hình TURNSTILE_SECRET = bỏ qua (dev). */
@Injectable()
export class TurnstileService {
  get enabled(): boolean {
    return env.TURNSTILE_SECRET !== '';
  }

  async assertHuman(token: string | undefined, ip: string, required: boolean): Promise<void> {
    if (!this.enabled) return;
    if (!token) {
      if (required) throw new DomainError('COMMON_BOT_CHECK_FAILED');
      return;
    }
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const parsed = VerifySchema.safeParse(await res.json());
    if (!parsed.success || !parsed.data.success) throw new DomainError('COMMON_BOT_CHECK_FAILED');
  }
}
