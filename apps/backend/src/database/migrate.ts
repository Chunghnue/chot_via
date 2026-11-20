import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb } from './database';

const { db, close } = createDb();
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Đã áp dụng migration.');
await close();
