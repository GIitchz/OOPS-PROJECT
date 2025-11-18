import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductDetailPage from './pages/ProductDetailPage';
import NavBar from './components/NavBar';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import DashboardLayout from './components/DashboardLayout';
import RetailerDashboard from './pages/RetailerDashboard';
import RetailerInventory from './pages/RetailerInventory';
import WholesalerDashboard from './pages/WholesalerDashboard';
import WholesalerOrders from './pages/WholesalerOrders';
import RetailerOrders from './pages/RetailerOrders';
import WholesaleMarket from './pages/WholesaleMarket';
import WholesalerInventory from './pages/WholesalerInventory';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          {/*Customer facing*/}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />

          {/*admin nested routes*/}
          <Route path="/admin" element={<DashboardLayout />}>

            {/* Retailer Routes */}
            <Route path="retailer" element={<RetailerDashboard />} />
            <Route path="retailer/inventory" element={<RetailerInventory />} />
            <Route path="retailer/orders" element={<RetailerOrders />} />
            <Route path="retailer/wholesale" element={<WholesaleMarket />} />

            {/* Wholesaler Routes */}
            <Route path="wholesaler" element={<WholesalerDashboard />} />
            <Route path="wholesaler/orders" element={<WholesalerOrders />} />
            <Route path="wholesaler/inventory" element={<WholesalerInventory />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;