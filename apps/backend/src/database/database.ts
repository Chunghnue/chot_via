import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

export const DB = Symbol('DB');
export type Db = PostgresJsDatabase<typeof schema>;
/** Transaction hoặc kết nối thường đều dùng được cho các truy vấn. */
export type DbOrTx = Pick<Db, 'select' | 'insert' | 'update' | 'delete' | 'execute'>;

export function createDb(): { db: Db; close: () => Promise<void> } {
  const client = postgres(env.DATABASE_URL, { max: 10 });
  return { db: drizzle(client, { schema }), close: () => client.end() };
}
