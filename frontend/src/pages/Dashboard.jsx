import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    totalStock: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [itemsRes, stockRes] = await Promise.all([
        api.get('/items'),
        api.get('/stock/summary')
      ]);

      const items = itemsRes.data.data;
      const stockSummary = stockRes.data.data;

      const totalStock = stockSummary.reduce((sum, item) => sum + item.currentStock, 0);
      const lowStock = stockSummary.filter(item => item.currentStock < 10).length;

      setStats({
        totalItems: items.length,
        activeItems: items.filter(item => item.status === 'active').length,
        totalStock,
        lowStock
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${color} bg-opacity-20 p-4 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            color="text-blue-600"
            icon={
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            }
          />

          <StatCard
            title="Active Items"
            value={stats.activeItems}
            color="text-green-600"
            icon={
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          />

          <StatCard
            title="Total Stock"
            value={stats.totalStock}
            color="text-purple-600"
            icon={
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />

          <StatCard
            title="Low Stock Items"
            value={stats.lowStock}
            color="text-red-600"
            icon={
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to Admin Panel</h2>
          <p className="text-gray-600 mb-4">
            Manage your LPG marketplace from here. You can:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Add, edit, and delete LPG products</li>
            <li>Manage inventory and stock levels</li>
            <li>Configure product catalog visibility</li>
            <li>Set up payment methods for customers</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
