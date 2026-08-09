/**
 * App router — Platform Admin application.
 *
 * Layout route `/admin` guards the area (role must be `admin`) and renders
 * the admin sidebar around nested pages.
 */
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/pages/AdminLayout';
import AdminOverview from '@/pages/AdminOverview';
import AdminUsers from '@/pages/AdminUsers';
import AdminSettings from '@/pages/AdminSettings';
import AdminProfile from '@/pages/AdminProfile';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
