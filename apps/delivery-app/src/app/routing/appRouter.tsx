/**
 * App router — Delivery Driver application.
 *
 * Layout route `/delivery` guards the area (role must be `delivery`) and renders
 * the delivery sidebar around nested pages.
 */
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import DeliveryLayout from '@/pages/DeliveryLayout';
import DeliveryOverview from '@/pages/DeliveryOverview';
import DeliveryOrders from '@/pages/DeliveryOrders';
import DeliveryOrderDetail from '@/pages/DeliveryOrderDetail';
import DeliveryHistory from '@/pages/DeliveryHistory';
import DeliveryProfile from '@/pages/DeliveryProfile';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/delivery" element={<DeliveryLayout />}>
        <Route index element={<DeliveryOverview />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="order/:orderId" element={<DeliveryOrderDetail />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="profile" element={<DeliveryProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
