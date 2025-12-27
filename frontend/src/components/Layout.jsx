import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="https://img.lazcdn.com/g/p/a1eeec26b4ee0b9ce69dfe7a57dc3e93.jpg_720x720q80.jpg" 
                alt="Logo Pertamina" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">PT. UNGGUL MIGAS SEJATI</h1>
              <p className="text-sm text-gray-600">Admin Panel</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{admin?.username}</p>
              <p className="text-xs text-gray-600">{admin?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1">
            <Link
              to="/admin/dashboard"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/dashboard') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/items"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/items') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Items
            </Link>
            <Link
              to="/admin/stock"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/stock') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Stock
            </Link>
            <Link
              to="/admin/catalog"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/catalog') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Catalog
            </Link>
            <Link
              to="/admin/payment-methods"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/payment-methods') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Payment Methods
            </Link>
            <Link
              to="/admin/transactions"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                location.pathname.startsWith('/admin/transactions') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Transactions
            </Link>
            <Link
              to="/admin/payments"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                location.pathname.startsWith('/admin/payments') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Payments
            </Link>
            <Link
              to="/admin/users"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                location.pathname.startsWith('/admin/users') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Users
            </Link>
            <Link
              to="/admin/reports"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/reports') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Reports
            </Link>
            <Link
              to="/admin/settings"
              className={`px-6 py-4 hover:bg-gray-700 transition ${
                isActive('/admin/settings') ? 'bg-gray-700 border-b-4 border-green-500' : ''
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;
