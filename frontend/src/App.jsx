import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Stock from './pages/Stock';
import StockDetail from './pages/StockDetail';
import Catalog from './pages/Catalog';
import PaymentMethods from './pages/PaymentMethods';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import CreateTransaction from './pages/CreateTransaction';
import BulkSettlement from './pages/BulkSettlement';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Home from './pages/Home';
import Register from './pages/user/Register';
import UserLogin from './pages/user/UserLogin';
import UserCatalog from './pages/user/UserCatalog';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import Profile from './pages/user/Profile';
import Orders from './pages/user/Orders';
import NotFound from './pages/NotFound';
import useAuthStore from './store/authStore';
import useUserStore from './store/userStore';

// Component to redirect transactions with ID
const TransactionRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/transactions/${id}`} replace />;
};

// Component to redirect payments with ID
const PaymentRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/payments/${id}`} replace />;
};

function App() {
  const initializeAuth = useAuthStore(state => state.initialize);
  const initializeUser = useUserStore(state => state.initialize);

  useEffect(() => {
    // Initialize authentication on app load
    initializeAuth();
    initializeUser();
  }, [initializeAuth, initializeUser]);

  return (
    <Router>
      <Routes>
        {/* Public Home Page */}
        <Route path="/" element={<Home />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/items" element={
          <PrivateRoute>
            <Items />
          </PrivateRoute>
        } />
        <Route path="/admin/stock" element={
          <PrivateRoute>
            <Stock />
          </PrivateRoute>
        } />
        <Route path="/admin/catalog" element={
          <PrivateRoute>
            <Catalog />
          </PrivateRoute>
        } />
        <Route path="/admin/payment-methods" element={
          <PrivateRoute>
            <PaymentMethods />
          </PrivateRoute>
        } />
        <Route path="/admin/transactions" element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        } />
        <Route path="/admin/transactions/create" element={
          <PrivateRoute>
            <CreateTransaction />
          </PrivateRoute>
        } />
        <Route path="/admin/transactions/:id" element={
          <PrivateRoute>
            <TransactionDetail />
          </PrivateRoute>
        } />
        <Route path="/admin/transactions/:id/edit" element={
          <PrivateRoute>
            <CreateTransaction />
          </PrivateRoute>
        } />
        <Route path="/admin/bulk-settlement" element={
          <PrivateRoute>
            <BulkSettlement />
          </PrivateRoute>
        } />
        <Route path="/admin/payments" element={
          <PrivateRoute>
            <Payments />
          </PrivateRoute>
        } />
        <Route path="/admin/payments/:id" element={
          <PrivateRoute>
            <PaymentDetail />
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute>
            <Users />
          </PrivateRoute>
        } />
        <Route path="/admin/users/new" element={
          <PrivateRoute>
            <UserForm />
          </PrivateRoute>
        } />
        <Route path="/admin/users/:id" element={
          <PrivateRoute>
            <UserForm />
          </PrivateRoute>
        } />
        <Route path="/admin/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="/admin/reports" element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        } />
        <Route path="/admin/stock/:itemId" element={
          <PrivateRoute>
            <StockDetail />
          </PrivateRoute>
        } />

        {/* User Routes */}
        <Route path="/user/register" element={<Register />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/catalog" element={<UserCatalog />} />
        <Route path="/user/cart" element={<Cart />} />
        <Route path="/user/checkout" element={<Checkout />} />
        <Route path="/user/profile" element={<Profile />} />
        <Route path="/user/orders" element={<Orders />} />

        {/* Backward compatibility redirects */}
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/items" element={<Navigate to="/admin/items" replace />} />
        <Route path="/stock" element={<Navigate to="/admin/stock" replace />} />
        <Route path="/catalog" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/payment-methods" element={<Navigate to="/admin/payment-methods" replace />} />
        <Route path="/transactions" element={<Navigate to="/admin/transactions" replace />} />
        <Route path="/transactions/:id" element={<TransactionRedirect />} />
        <Route path="/bulk-settlement" element={<Navigate to="/admin/bulk-settlement" replace />} />
        <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
        <Route path="/payments/:id" element={<PaymentRedirect />} />

        {/* 404 Not Found - Must be last route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
