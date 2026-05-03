import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import StorefrontPage from '@/pages/StorefrontPage';
import StoreCatalogPage from '@/pages/StoreCatalogPage';
import CategoryCatalogPage from '@/pages/CategoryCatalogPage';
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
import BackOfficeLayout from '@/pages/BackOfficeLayout';
import BackOfficeOverview from '@/pages/BackOfficeOverview';
import BackOfficeOrders from '@/pages/BackOfficeOrders';
import BackOfficeShipmentDetail from '@/pages/BackOfficeShipmentDetail';
import BackOfficeDrivers from '@/pages/BackOfficeDrivers';
import BackOfficeMap from '@/pages/BackOfficeMap';
import BackOfficeNotifications from '@/pages/BackOfficeNotifications';
import BackOfficeChat from '@/pages/BackOfficeChat';
import DeliveryLayout from '@/pages/DeliveryLayout';
import DeliveryOverview from '@/pages/DeliveryOverview';
import DeliveryOrders from '@/pages/DeliveryOrders';
import DeliveryOrderDetail from '@/pages/DeliveryOrderDetail';
import DeliveryHistory from '@/pages/DeliveryHistory';
import DeliveryProfile from '@/pages/DeliveryProfile';
import MarketerLayout from '@/pages/MarketerLayout';
import MarketerOverview from '@/pages/MarketerOverview';
import MarketerLinks from '@/pages/MarketerLinks';
import MarketerPerformance from '@/pages/MarketerPerformance';
import MarketerSettings from '@/pages/MarketerSettings';
import AdminLayout from '@/pages/AdminLayout';
import AdminOverview from '@/pages/AdminOverview';
import AdminUsers from '@/pages/AdminUsers';
import AdminSettings from '@/pages/AdminSettings';
import AdminProfile from '@/pages/AdminProfile';
import NotFound from '@/pages/NotFound';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/store" element={<StorefrontPage />} />
      <Route path="/store/s/:storeId" element={<StoreCatalogPage />} />
      <Route path="/store/c/:categoryEn" element={<CategoryCatalogPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
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
      <Route path="/marketer" element={<MarketerLayout />}>
        <Route index element={<MarketerOverview />} />
        <Route path="links" element={<MarketerLinks />} />
        <Route path="performance" element={<MarketerPerformance />} />
        <Route path="settings" element={<MarketerSettings />} />
      </Route>
      <Route path="/back-office" element={<BackOfficeLayout />}>
        <Route index element={<BackOfficeOverview />} />
        <Route path="orders" element={<BackOfficeOrders />} />
        <Route path="shipments/:orderId" element={<BackOfficeShipmentDetail />} />
        <Route path="drivers" element={<BackOfficeDrivers />} />
        <Route path="map" element={<BackOfficeMap />} />
        <Route path="notifications" element={<BackOfficeNotifications />} />
        <Route path="chat" element={<BackOfficeChat />} />
      </Route>
      <Route path="/delivery" element={<DeliveryLayout />}>
        <Route index element={<DeliveryOverview />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="order/:orderId" element={<DeliveryOrderDetail />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="profile" element={<DeliveryProfile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);