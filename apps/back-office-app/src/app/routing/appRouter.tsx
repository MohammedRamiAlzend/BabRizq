/**
 * App router — Back Office application.
 *
 * Layout route `/back-office` guards the area (role must be `back_office`) and
 * renders the back-office sidebar around nested pages.
 */
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import BackOfficeLayout from '@/pages/BackOfficeLayout';
import BackOfficeOverview from '@/pages/BackOfficeOverview';
import BackOfficeOrders from '@/pages/BackOfficeOrders';
import BackOfficeShipmentDetail from '@/pages/BackOfficeShipmentDetail';
import BackOfficeDrivers from '@/pages/BackOfficeDrivers';
import BackOfficeMap from '@/pages/BackOfficeMap';
import BackOfficeNotifications from '@/pages/BackOfficeNotifications';
import BackOfficeChat from '@/pages/BackOfficeChat';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/back-office" element={<BackOfficeLayout />}>
        <Route index element={<BackOfficeOverview />} />
        <Route path="orders" element={<BackOfficeOrders />} />
        <Route path="shipments/:orderId" element={<BackOfficeShipmentDetail />} />
        <Route path="drivers" element={<BackOfficeDrivers />} />
        <Route path="map" element={<BackOfficeMap />} />
        <Route path="notifications" element={<BackOfficeNotifications />} />
        <Route path="chat" element={<BackOfficeChat />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
