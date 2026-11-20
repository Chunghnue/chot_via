import { teardown } from '../apps/backend/test/support/global-setup';

export default async function globalTeardown(): Promise<void> {
  await teardown();
}
