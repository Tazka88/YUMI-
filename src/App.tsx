import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import Analytics from './components/Analytics';

import Home from './pages/Home';
const Category = React.lazy(() => import('./pages/Category'));
const Product = React.lazy(() => import('./pages/Product'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const AdminLogin = React.lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const Brands = React.lazy(() => import('./pages/Brands'));
const BrandProducts = React.lazy(() => import('./pages/BrandProducts'));
const Page = React.lazy(() => import('./pages/Page'));

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
  return (
    <HelmetProvider>
      <BrowserRouter>
        <GlobalFbclidCatcher />
        <Toaster position="top-center" />
        <Analytics />
        <SpeedInsights />
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>}>
          <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category/:slug" element={<Category />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="brands" element={<Brands />} />
          <Route path="brands/:slug" element={<BrandProducts />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path=":slug" element={<Page />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </HelmetProvider>
  );
}
