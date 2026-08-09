/**
 * App router — Customer application.
 *
 * Routes mirror the legacy app's customer area: the storefront home, per-store
 * catalogs and per-category catalogs. `/` is the login gate.
 */
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import StorefrontPage from '@/pages/StorefrontPage';
import StoreCatalogPage from '@/pages/StoreCatalogPage';
import CategoryCatalogPage from '@/pages/CategoryCatalogPage';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/store" element={<StorefrontPage />} />
      <Route path="/store/s/:storeId" element={<StoreCatalogPage />} />
      <Route path="/store/c/:categoryEn" element={<CategoryCatalogPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
