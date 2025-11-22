import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
import RetailerOrders from './pages/RetailerOrders';
import RetailerFeedbacks from './pages/RetailerFeedbacks';
import WholesaleMarket from './pages/WholesaleMarket';
import RetailerHistory from './pages/RetailerHistory';

import WholesalerDashboard from './pages/WholesalerDashboard';
import WholesalerOrders from './pages/WholesalerOrders';
import WholesalerInventory from './pages/WholesalerInventory';
import WholesalerHistory from './pages/WholesalerHistory';

import ProfilePage from "./pages/Profile";

const ALL_ROLES = ['customer', 'retailer', 'wholesaler'];
const SELLER_ROLES = ['retailer', 'wholesaler'];

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            {/*Public*/}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />

              {/*Customer facing*/}
              <Route path="/cart" element={<ProtectedRoute allowedRoles={ALL_ROLES}><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute allowedRoles={ALL_ROLES}><CheckoutPage /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute allowedRoles={ALL_ROLES}><OrderSuccessPage /></ProtectedRoute>} />

              {/*Profile page*/}
              <Route path="/profile/*" element={<ProtectedRoute allowedRoles={ALL_ROLES}><ProfilePage /></ProtectedRoute>} />

              {/* 3. ADMIN ROUTES - RETAILER (Only Retailer can access these paths) */}
              <Route
                path="/admin/retailer"
                element={<ProtectedRoute allowedRoles={['retailer']}><DashboardLayout /></ProtectedRoute>}
              >
                <Route index element={<RetailerDashboard />} />
                <Route path="inventory" element={<RetailerInventory />} />
                <Route path="orders" element={<RetailerOrders />} />
                <Route path="wholesale" element={<WholesaleMarket />} />
                <Route path="history" element={<RetailerHistory />} />
                <Route path="feedbacks" element={<RetailerFeedbacks />} />
              </Route>

              {/* 4. ADMIN ROUTES - WHOLESALER (Only Wholesaler can access these paths) */}
              <Route
                path="/admin/wholesaler"
                element={<ProtectedRoute allowedRoles={['wholesaler']}><DashboardLayout /></ProtectedRoute>}
              >
                <Route index element={<WholesalerDashboard />} />
                <Route path="orders" element={<WholesalerOrders />} />
                <Route path="inventory" element={<WholesalerInventory />} />
                <Route path="history" element={<WholesalerHistory />} />
              </Route>

              {/* 5. Fallback for undefined base admin path (sends unauthorized users to login) */}
              <Route path="/admin" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;