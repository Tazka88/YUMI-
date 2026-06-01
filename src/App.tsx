import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import Analytics from './components/Analytics';
import PromoPopup from './components/PromoPopup';

import Home from './pages/Home';
const Category = React.lazy(() => import('./pages/Category'));
const Product = React.lazy(() => import('./pages/Product'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const AdminLogin = React.lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const Brands = React.lazy(() => import('./pages/Brands'));
const BrandProducts = React.lazy(() => import('./pages/BrandProducts'));
const BlogList = React.lazy(() => import('./pages/Blog/BlogList'));
const BlogPost = React.lazy(() => import('./pages/Blog/BlogPost'));
const Page = React.lazy(() => import('./pages/Page'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Login = React.lazy(() => import('./pages/Account/Login'));
const Register = React.lazy(() => import('./pages/Account/Register'));
const ForgotPassword = React.lazy(() => import('./pages/Account/ForgotPassword'));
const AccountLayout = React.lazy(() => import('./pages/Account/AccountLayout'));
const Dashboard = React.lazy(() => import('./pages/Account/Dashboard'));
const Orders = React.lazy(() => import('./pages/Account/Orders'));
const Wishlist = React.lazy(() => import('./pages/Account/Wishlist'));
const Addresses = React.lazy(() => import('./pages/Account/Addresses'));
const Profile = React.lazy(() => import('./pages/Account/Profile'));
const Notifications = React.lazy(() => import('./pages/Account/Notifications'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));

// Global fbclid catcher
const GlobalFbclidCatcher = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      const creationTime = Date.now();
      const newFbc = `fb.1.${creationTime}.${fbclid}`;
      const domain = window.location.hostname.replace('www.', '');
      document.cookie = `_fbc=${newFbc}; path=/; domain=${domain}; max-age=7776000; SameSite=Lax`;
      try {
        sessionStorage.setItem('_fbc', newFbc);
      } catch (e) {}
    }
  }, []);
  return null;
};

export default function App() {
  useEffect(() => {
    // Smooth entry after hydration
    document.getElementById('root')?.classList.add('app-ready');
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <HelmetProvider>
        <BrowserRouter>
        <GlobalFbclidCatcher />
        <Toaster position="top-center" />
        <Analytics />
        <SpeedInsights />
        <PromoPopup />
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
          <Route path="brands" element={<Brands />} />
          <Route path="brands/:slug" element={<BrandProducts />} />
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
        <Route path="/landing/:slug" element={<LandingPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </HelmetProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
