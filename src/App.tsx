import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Storefront Pages
import HomePage from '@/app/page';
import CartPage from '@/app/(store)/cart/page';
import CheckoutPage from '@/app/(store)/checkout/page';
import { OrderSuccessClient } from '@/app/(store)/checkout/success/OrderSuccessClient';
import TrackOrderPage from '@/app/(store)/track-order/page';
import { ProductDetailClient } from '@/app/(store)/products/[slug]/ProductDetailClient';

// Auth Pages
import SignInPage from '@/app/(auth)/sign-in/page';
import SignUpPage from '@/app/(auth)/sign-up/page';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';

// Admin Pages & Shell
import AdminLayout from '@/app/(admin)/admin/layout';
import AdminDashboardPage from '@/app/(admin)/admin/page';
import AdminLoginPage from '@/app/(admin)/admin/login/page';
import AdminOrdersPage from '@/app/(admin)/admin/orders/page';
import AdminProductsPage from '@/app/(admin)/admin/products/page';
import AdminInventoryPage from '@/app/(admin)/admin/inventory/page';
import AdminContentPage from '@/app/(admin)/admin/content/page';
import AdminReportsPage from '@/app/(admin)/admin/reports/page';

function ProductRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <ProductDetailClient slug={slug || 'tinted-sunscreen-spf50'} />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Storefront Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<OrderSuccessClient />} />
        <Route path="/order-success" element={<OrderSuccessClient />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/products" element={<Navigate to="/products/tinted-sunscreen-spf50" replace />} />
        <Route path="/shop" element={<Navigate to="/products/tinted-sunscreen-spf50" replace />} />
        <Route path="/products/:slug" element={<ProductRoute />} />

      {/* Auth Routes */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected Admin Console Routes */}
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminLayout>
            <AdminOrdersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminLayout>
            <AdminProductsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <AdminLayout>
            <AdminInventoryPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/content"
        element={
          <AdminLayout>
            <AdminContentPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminLayout>
            <AdminReportsPage />
          </AdminLayout>
        }
      />

      {/* Catch-all redirect to storefront */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
