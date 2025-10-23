import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const QRLandingPage = lazy(() => import('./pages/QRLandingPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const OrderManagementPage = lazy(() => import('./pages/admin/OrderManagementPage'));
const MenuManagementPage = lazy(() => import('./pages/admin/MenuManagementPage'));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <Layout>
              <HomePage />
            </Layout>
          } />
          <Route path="/qr" element={
            <Layout>
              <QRLandingPage />
            </Layout>
          } />
          <Route path="/menu" element={
            <Layout>
              <MenuPage />
            </Layout>
          } />
          <Route path="/cart" element={
            <Layout>
              <CartPage />
            </Layout>
          } />
          <Route path="/checkout" element={
            <Layout>
              <CheckoutPage />
            </Layout>
          } />
          <Route path="/order/:orderId" element={
            <Layout>
              <OrderTrackingPage />
            </Layout>
          } />
          
          {/* Payment routes */}
          <Route path="/payment/:orderId" element={
            <Layout>
              <PaymentPage />
            </Layout>
          } />
          <Route path="/payment/success" element={
            <Layout>
              <PaymentSuccessPage />
            </Layout>
          } />
          <Route path="/payment/cancel" element={
            <Layout>
              <PaymentCancelPage />
            </Layout>
          } />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          
          {/* Protected admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          <Route path="/admin/orders" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <OrderManagementPage />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          <Route path="/admin/menu" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <MenuManagementPage />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          <Route path="/admin/analytics" element={
            <ProtectedAdminRoute requiredRole="MANAGER">
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
                  <p className="text-gray-600">This feature will be implemented in a future task.</p>
                </div>
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedAdminRoute requiredRole="ADMIN">
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
                  <p className="text-gray-600">This feature will be implemented in a future task.</p>
                </div>
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* 404 page */}
          <Route path="*" element={
            <Layout>
              <NotFoundPage />
            </Layout>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;