import type { ReactNode } from 'react';
import { IntlProvider } from 'use-intl';
import { ConfirmProvider } from './components/composite';
import { APP_TIME_ZONE, DEFAULT_LOCALE, viMessages, type AppMessages } from '@chot-via/shared/i18n';

declare module 'use-intl' {
  interface AppConfig { Messages: AppMessages }
}

/** Nguồn chữ duy nhất cho cả hai web: packages/shared/i18n/vi/*.json. */
export function AppIntlProvider({ children }: { children: ReactNode }) {
  return <IntlProvider locale={DEFAULT_LOCALE} messages={viMessages} timeZone={APP_TIME_ZONE}><ConfirmProvider>{children}</ConfirmProvider></IntlProvider>;
}
