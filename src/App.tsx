import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Analytics from './components/Analytics';

const Home = React.lazy(() => import('./pages/Home'));
const Category = React.lazy(() => import('./pages/Category'));
const Product = React.lazy(() => import('./pages/Product'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const AdminLogin = React.lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const Brands = React.lazy(() => import('./pages/Brands'));
const BrandProducts = React.lazy(() => import('./pages/BrandProducts'));
const Page = React.lazy(() => import('./pages/Page'));

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Analytics />
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
