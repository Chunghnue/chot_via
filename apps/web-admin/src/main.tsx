import { installVietnameseValidation } from '@chot-via/shared';
import { AppIntlProvider, Toaster } from '@chot-via/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { makeStore } from './store';
import './index.css';

installVietnameseValidation();
const store = makeStore();
const container = document.getElementById('root');
if (!container) throw new Error('Thiếu #root');

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <AppIntlProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster />
      </AppIntlProvider>
    </Provider>
  </StrictMode>,
);
