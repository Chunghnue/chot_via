'use client';

import { installVietnameseValidation } from '@chot-via/shared';
import { AppIntlProvider, Toaster } from '@chot-via/ui';
import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';
import { Bootstrap } from '@/components/bootstrap';
import { GlobalDialogs } from '@/components/dialogs/global-dialogs';

installVietnameseValidation();

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      <AppIntlProvider>
        <Bootstrap />
        {children}
        <GlobalDialogs />
        <Toaster />
      </AppIntlProvider>
    </Provider>
  );
}
