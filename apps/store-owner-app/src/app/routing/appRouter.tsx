/**
 * App router — Store Owner application.
 *
 * Layout route `/store-owner` guards the area (role must be `store_owner`) and
 * renders the store-owner sidebar around nested pages.
 */
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import StoreOwnerLayout from '@/pages/StoreOwnerLayout';
import StoreOwnerOverview from '@/pages/StoreOwnerOverview';
import StoreOwnerProducts from '@/pages/StoreOwnerProducts';
import StoreOwnerOrders from '@/pages/StoreOwnerOrders';
import StoreOwnerSales from '@/pages/StoreOwnerSales';
import StoreOwnerCategories from '@/pages/StoreOwnerCategories';
import StoreOwnerOffers from '@/pages/StoreOwnerOffers';
import StoreOwnerReports from '@/pages/StoreOwnerReports';
import StoreOwnerChat from '@/pages/StoreOwnerChat';
import StoreOwnerSettings from '@/pages/StoreOwnerSettings';
import StoreOwnerWarehouse from '@/pages/StoreOwnerWarehouse';
import StoreOwnerAccounting from '@/pages/StoreOwnerAccounting';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/store-owner" element={<StoreOwnerLayout />}>
        <Route index element={<StoreOwnerOverview />} />
        <Route path="products" element={<StoreOwnerProducts />} />
        <Route path="orders" element={<StoreOwnerOrders />} />
        <Route path="sales" element={<StoreOwnerSales />} />
        <Route path="categories" element={<StoreOwnerCategories />} />
        <Route path="offers" element={<StoreOwnerOffers />} />
        <Route path="reports" element={<StoreOwnerReports />} />
        <Route path="chat" element={<StoreOwnerChat />} />
        <Route path="warehouse" element={<StoreOwnerWarehouse />} />
        <Route path="accounting" element={<StoreOwnerAccounting />} />
        <Route path="settings" element={<StoreOwnerSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
