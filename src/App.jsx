import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AdminLayout from './components/AdminLayout.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminAddProductPage from './pages/AdminAddProductPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminDeleteProductPage from './pages/AdminDeleteProductPage.jsx'
import AdminRevenuePage from './pages/AdminRevenuePage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CustomerHomePage from './pages/CustomerHomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/customer-home" replace />} />
        <Route path="/customer-home" element={<CustomerHomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Route>
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="add-product" element={<AdminAddProductPage />} />
          <Route path="delete-product" element={<AdminDeleteProductPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="revenue/daily" element={<AdminRevenuePage mode="daily" />} />
          <Route path="revenue/monthly" element={<AdminRevenuePage mode="monthly" />} />
          <Route path="revenue/yearly" element={<AdminRevenuePage mode="yearly" />} />
          <Route path="revenue/overall" element={<AdminRevenuePage mode="overall" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
