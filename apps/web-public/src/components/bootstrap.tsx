'use client';

import { selectAuthStatus, selectIsMember, useGetDeityTodayQuery, useGetOfflinePackQuery, useRestoreSessionMutation, useSessionSync } from '@xin-via/api-client';
import { toast, useCodeMessage } from '@xin-via/ui';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'use-intl';
import { offlinePackLoaded, wishSynced } from '@/features/wish/wishSlice';
import { initAnalytics } from '@/lib/analytics';
import { appStarted } from '@/store/listeners';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Khởi động một lần: khôi phục bộ đếm/bản nháp, khôi phục phiên đăng nhập bằng cookie, cache lời chúc offline, đăng ký PWA. */
export function Bootstrap() {
  const dispatch = useAppDispatch();
  const [restore] = useRestoreSessionMutation();
  const { data: pack } = useGetOfflinePackQuery();
  const isMember = useAppSelector(selectIsMember);
  const status = useAppSelector(selectAuthStatus);
  const { data: today } = useGetDeityTodayQuery(undefined, { skip: !isMember });
  const t = useTranslations('auth');
  const message = useCodeMessage();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    dispatch(appStarted());
    void restore();
    void initAnalytics();
    const url = new URL(window.location.href);
    const login = url.searchParams.get('login');
    if (login) {
      if (login === 'ok') toast.success(t('welcomeBack'));
      else toast.error(message('AUTH_PROVIDER_FAILED'));
      url.searchParams.delete('login');
      window.history.replaceState(null, '', url.toString());
    }
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      } else {
        /* Bản dev: gỡ service worker và cache còn sót từ bản production từng chạy trên cùng địa chỉ, nếu không sẽ phục vụ file cũ và gây lỗi nạp module. */
        void navigator.serviceWorker.getRegistrations().then((list) => Promise.all(list.map((r) => r.unregister()))).catch(() => undefined);
        if ('caches' in window) void caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('xv-')).map((k) => caches.delete(k)))).catch(() => undefined);
      }
    }
  }, [dispatch, restore, t, message]);

  // Đồng bộ đăng nhập/đăng xuất với web admin (cùng cookie phiên) và giữa các tab.
  useSessionSync(status);

  useEffect(() => {
    if (pack) dispatch(offlinePackLoaded(pack.texts));
  }, [pack, dispatch]);

  useEffect(() => {
    if (today) dispatch(wishSynced(today.map((e) => ({ at: e.at, titleCode: e.titleCode, templateId: 'server', offline: false }))));
  }, [today, dispatch]);

  return null;
}
