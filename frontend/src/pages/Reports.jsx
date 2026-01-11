import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const Reports = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [salesData, setSalesData] = useState({ salesByDate: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      params.append('groupBy', groupBy);
      params.append('limit', '10');

      const [bestSellersRes, salesRes] = await Promise.all([
        api.get(`/reports/best-sellers?${params}`),
        api.get(`/reports/sales?${params}`)
      ]);

      console.log('Best sellers response:', bestSellersRes.data);
      console.log('Sales response:', salesRes.data);

      setBestSellers(bestSellersRes.data.data || []);
      setSalesData(salesRes.data.data || { salesByDate: [], totals: {} });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = () => {
    fetchReports();
  };

  const handleClearFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setGroupBy('day');
    setTimeout(fetchReports, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate max values for chart scaling
  const maxQuantity = Math.max(...bestSellers.map(item => item.totalQuantitySold), 1);
  const maxSales = Math.max(
    ...(salesData.salesByDate && salesData.salesByDate.length > 0 
      ? salesData.salesByDate.map(item => item.totalSales) 
      : [1]), 
    1
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Filter Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilter}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilter}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-green-100 text-sm mb-2">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(salesData.totals.totalSales || 0)}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-blue-100 text-sm mb-2">Total Transactions</p>
            <p className="text-3xl font-bold">{salesData.totals.transactionCount || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-purple-100 text-sm mb-2">Items Sold</p>
            <p className="text-3xl font-bold">{salesData.totals.itemsSold || 0}</p>
          </div>
        </div>

        {/* Best Sellers Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🏆 Best Selling Products</h2>
          
          {bestSellers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data available for the selected period.</p>
          ) : (
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="space-y-3">
                {bestSellers.map((item, index) => (
                  <div key={item._id} className="flex items-center gap-4">
                    <div className="w-8 text-center font-bold text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-800">
                          {item.name} ({item.size})
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.totalQuantitySold} sold
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${(item.totalQuantitySold / maxQuantity) * 100}%`,
                            backgroundColor: index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : index === 2 ? '#8B5CF6' : '#6B7280'
                          }}
                        >
                          <span className="text-white text-xs font-semibold">
                            {formatCurrency(item.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Size</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Qty Sold</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Transactions</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((item, index) => (
                      <tr key={item._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {index === 0 && <span className="text-xl">🥇</span>}
                          {index === 1 && <span className="text-xl">🥈</span>}
                          {index === 2 && <span className="text-xl">🥉</span>}
                          {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.size}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{item.totalQuantitySold}</td>
                        <td className="px-4 py-3 text-right">{item.transactionCount}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📈 Sales Trend</h2>
          
          {salesData.salesByDate.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data available for the selected period.</p>
          ) : (
            <div>
              {/* Simple Bar Chart for Sales Trend */}
              <div className="h-64 flex items-end gap-2 mb-4 border-b border-l border-gray-300 pt-4 pl-4">
                {salesData.salesByDate.slice(-14).map((item, index) => {
                  const heightPercent = maxSales > 0 ? (item.totalSales / maxSales) * 100 : 50;
                  const finalHeight = Math.max(heightPercent, 8);
                  return (
                    <div key={index} className="flex-1 flex flex-col-reverse items-center h-full">
                      <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                        {item.date.slice(-5)}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-400 cursor-pointer relative group"
                        style={{ height: `${finalHeight}%` }}
                        title={`${item.date}: ${formatCurrency(item.totalSales)}`}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {formatCurrency(item.totalSales)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sales Data Table */}
              <div className="mt-8 overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Transactions</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Items Sold</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.salesByDate.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.date}</td>
                        <td className="px-4 py-3 text-right">{item.transactionCount}</td>
                        <td className="px-4 py-3 text-right">{item.itemsSold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(item.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
