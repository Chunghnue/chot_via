import { setup } from '../apps/backend/test/support/global-setup';

/** Dựng database test sạch + API test (cổng 3101) cho cả bộ E2E. */
export default async function globalSetup(): Promise<void> {
  await setup();
}
