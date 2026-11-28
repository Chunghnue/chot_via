import { Inject, Injectable } from '@nestjs/common';
import type { KeywordAction } from '@xin-via/shared';
import { fold } from '../../common/crypto';
import { DB, type Db } from '../../database/database';
import { sensitiveKeywords } from '../../database/schema';

const TTL_MS = 60_000;

@Injectable()
export class KeywordsService {
  private cache: { list: { keyword: string; action: KeywordAction }[]; at: number } | null = null;

  constructor(@Inject(DB) private readonly db: Db) {}

  invalidate(): void {
    this.cache = null;
  }

  /** Lọc tự động trước khi hiển thị: block = chặn, review = đăng nhưng đưa vào hàng chờ kiểm duyệt. */
  async check(...texts: (string | null | undefined)[]): Promise<KeywordAction | null> {
    if (!this.cache || Date.now() - this.cache.at > TTL_MS) {
      const rows = await this.db.select().from(sensitiveKeywords);
      this.cache = { list: rows.map((r) => ({ keyword: fold(r.keyword), action: r.action })), at: Date.now() };
    }
    const haystack = fold(texts.filter((t): t is string => !!t).join(' \n '));
    let found: KeywordAction | null = null;
    for (const entry of this.cache.list) {
      if (!haystack.includes(entry.keyword)) continue;
      if (entry.action === 'block') return 'block';
      found = 'review';
    }
    return found;
  }
}
