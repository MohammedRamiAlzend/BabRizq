/**
 * App router — Marketer application.
 *
 * Layout route `/marketer` guards the area (role must be `marketer`) and renders
 * the marketer sidebar around nested pages.
 */
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import MarketerLayout from '@/pages/MarketerLayout';
import MarketerOverview from '@/pages/MarketerOverview';
import MarketerLinks from '@/pages/MarketerLinks';
import MarketerPerformance from '@/pages/MarketerPerformance';
import MarketerSettings from '@/pages/MarketerSettings';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/marketer" element={<MarketerLayout />}>
        <Route index element={<MarketerOverview />} />
        <Route path="links" element={<MarketerLinks />} />
        <Route path="performance" element={<MarketerPerformance />} />
        <Route path="settings" element={<MarketerSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
