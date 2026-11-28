import { selectAuthStatus, selectCurrentUser, useRestoreSessionMutation, useSessionSync } from '@xin-via/api-client';
import { Skeleton } from '@xin-via/ui';
import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layout/admin-layout';
import { LoginPage, NoAccess } from './pages/login-page';
import { AuditPage } from './pages/audit-page';
import { CommentsPage, PostsPage } from './pages/content-pages';
import { DashboardPage } from './pages/dashboard-page';
import { PlacesPage } from './pages/places-page';
import { ReportsPage } from './pages/reports-page';
import { ResourceRoute } from './pages/resource-route';
import { SettingsPage } from './pages/settings-page';
import { HomeConfigPage } from './pages/home-config-page';
import { ShopPage } from './pages/shop-page';
import { DemoPostsPage, DemoUsersPage } from './pages/demo-pages';
import { UsersPage } from './pages/users-page';
import { useAppSelector } from './store';

export function App() {
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const [restore] = useRestoreSessionMutation();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void restore();
  }, [restore]);
  /* Đăng nhập/đăng xuất ở web public (cùng cookie phiên) thì admin cũng đổi theo khi quay lại tab. */
  useSessionSync(status);

  if (status === 'unknown') return <div className="p-8"><Skeleton className="h-40" /></div>;
  if (status === 'guest' || !user) return <LoginPage />;
  if (user.accountRole === 'member') return <NoAccess />;

  const isAdmin = user.accountRole === 'admin';
  return (
    <Routes>
      <Route element={<AdminLayout isAdmin={isAdmin} />}>
        <Route index element={<DashboardPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="users" element={<UsersPage isAdmin={isAdmin} />} />
        <Route path="catalog/keywords" element={<ResourceRoute resource="keywords" />} />
        {isAdmin ? (
          <>
            <Route path="places" element={<PlacesPage />} />
            <Route path="demo/users" element={<DemoUsersPage />} />
            <Route path="demo/posts" element={<DemoPostsPage />} />
            <Route path="catalog/:resource" element={<ResourceRoute />} />
            <Route path="home-config" element={<HomeConfigPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit" element={<AuditPage />} />
          </>
        ) : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
