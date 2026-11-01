import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('Lazy module load failed, retrying once...', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return await factory();
      } catch (retryError) {
        const isChunkError = /Failed to fetch dynamically imported module|error loading dynamically imported module|Loading chunk/i.test(
          String((error as any)?.message || error)
        );
        if (isChunkError && typeof window !== 'undefined' && !sessionStorage.getItem('chunk_reloaded_once')) {
          sessionStorage.setItem('chunk_reloaded_once', '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        throw retryError;
      }
    }
  });
}

const Analytics = lazyWithRetry(() => import('./components/Analytics'));

const Home = lazyWithRetry(() => import('./pages/Home'));
const Category = lazyWithRetry(() => import('./pages/Category'));
const Product = lazyWithRetry(() => import('./pages/Product'));
const Cart = lazyWithRetry(() => import('./pages/Cart'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const AdminLogin = lazyWithRetry(() => import('./pages/Admin/Login'));
const AdminDashboard = lazyWithRetry(() => import('./pages/Admin/Dashboard'));
const Brands = lazyWithRetry(() => import('./pages/Brands'));
const BrandProducts = lazyWithRetry(() => import('./pages/BrandProducts'));
const BlogList = lazyWithRetry(() => import('./pages/Blog/BlogList'));
const BlogPost = lazyWithRetry(() => import('./pages/Blog/BlogPost'));
const Page = lazyWithRetry(() => import('./pages/Page'));

import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Login = lazyWithRetry(() => import('./pages/Account/Login'));
const Register = lazyWithRetry(() => import('./pages/Account/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/Account/ForgotPassword'));
const AccountLayout = lazyWithRetry(() => import('./pages/Account/AccountLayout'));
const Dashboard = lazyWithRetry(() => import('./pages/Account/Dashboard'));
const Orders = lazyWithRetry(() => import('./pages/Account/Orders'));
const Wishlist = lazyWithRetry(() => import('./pages/Account/Wishlist'));
const Addresses = lazyWithRetry(() => import('./pages/Account/Addresses'));
const Profile = lazyWithRetry(() => import('./pages/Account/Profile'));
const Notifications = lazyWithRetry(() => import('./pages/Account/Notifications'));
const AuthCallback = lazyWithRetry(() => import('./pages/AuthCallback'));

export default function App() {
  useEffect(() => {
    // Smooth entry after hydration and clear chunk retry flag
    try {
      sessionStorage.removeItem('chunk_reloaded_once');
    } catch (_) {}
    document.getElementById('root')?.classList.add('app-ready');
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <HelmetProvider>
        <BrowserRouter>
        <Toaster position="top-center" />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <Suspense fallback={
          <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium animate-pulse">Chargement de ZORANDO...</p>
          </div>
        }>
          <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category/:slug" element={<Category />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="products/:slug" element={<Product />} />
          <Route path="produit/:slug" element={<Product />} />
          <Route path="brands" element={<Brands />} />
          <Route path="brands/:slug" element={<BrandProducts />} />
          <Route path="brands/:slug/:categorySlug" element={<BrandProducts />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="account/login" element={<Login />} />
          <Route path="account/register" element={<Register />} />
          <Route path="account/forgot-password" element={<ForgotPassword />} />
          <Route path="account" element={<ProtectedRoute><AccountLayout><Navigate to="/account/dashboard" replace /></AccountLayout></ProtectedRoute>} />
          <Route path="account/dashboard" element={<ProtectedRoute><AccountLayout><Dashboard /></AccountLayout></ProtectedRoute>} />
          <Route path="account/orders" element={<ProtectedRoute><AccountLayout><Orders /></AccountLayout></ProtectedRoute>} />
          <Route path="account/wishlist" element={<ProtectedRoute><AccountLayout><Wishlist /></AccountLayout></ProtectedRoute>} />
          <Route path="account/addresses" element={<ProtectedRoute><AccountLayout><Addresses /></AccountLayout></ProtectedRoute>} />
          <Route path="account/profile" element={<ProtectedRoute><AccountLayout><Profile /></AccountLayout></ProtectedRoute>} />
          <Route path="account/notifications" element={<ProtectedRoute><AccountLayout><Notifications /></AccountLayout></ProtectedRoute>} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path=":slug" element={<Page />} />
        </Route>
        <Route path="/admin-7xK9pL2q/login" element={<AdminLogin />} />
        <Route path="/admin-7xK9pL2q/*" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </HelmetProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
