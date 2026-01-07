import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';

const StockDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    type: 'IN',
    quantity: '',
    reason: 'restock',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStockHistory();
  }, [itemId]);

  const fetchStockHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stock/history/${itemId}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stock history:', error);
      setError('Failed to load stock history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/stock/add-with-history', {
        itemId,
        ...addForm,
        quantity: parseInt(addForm.quantity)
      });
      
      setShowAddModal(false);
      setAddForm({ type: 'IN', quantity: '', reason: 'restock', note: '' });
      fetchStockHistory();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getReasonLabel = (reason) => {
    const labels = {
      restock: 'Restock',
      sold: 'Sold',
      purchased: 'Purchased',
      damaged: 'Damaged',
      correction: 'Admin Correction',
      return: 'Return',
      initial: 'Initial Stock',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason) => {
    const colors = {
      restock: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      purchased: 'bg-purple-100 text-purple-800',
      damaged: 'bg-red-100 text-red-800',
      correction: 'bg-yellow-100 text-yellow-800',
      return: 'bg-orange-100 text-orange-800',
      initial: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load stock data</p>
          <button
            onClick={() => navigate('/admin/stock')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Stock
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/stock')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Stock Detail</h1>
              <p className="text-gray-600">{data.item.name} - {data.item.size}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            + Add Stock Change
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Product Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Product Name</p>
              <p className="text-xl font-bold text-gray-800">{data.item.name}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Size</p>
              <p className="text-xl font-bold text-gray-800">{data.item.size}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Price</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.item.price)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Current Stock</p>
              <p className={`text-3xl font-bold ${data.currentStock < 10 ? 'text-red-600' : 'text-blue-600'}`}>
                {data.currentStock}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {data.stats && data.stats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Stock Statistics by Reason</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.stats.map((stat) => (
                <div key={stat._id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getReasonColor(stat._id)}`}>
                    {getReasonLabel(stat._id)}
                  </span>
                  <p className="text-2xl font-bold text-gray-800">{stat.totalQuantity}</p>
                  <p className="text-sm text-gray-500">{stat.count} records</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock History Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📜 Stock History</h2>
          
          {data.history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No stock history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Reason</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Stock Before</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Stock After</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Change</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Performed By</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{formatDate(record.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          record.type === 'IN' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getReasonColor(record.reason)}`}>
                          {getReasonLabel(record.reason)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{record.previousStock}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{record.newStock}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={record.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                          {record.type === 'IN' ? '+' : '-'}{record.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-800">{record.performedBy?.name || 'System'}</span>
                        <span className="text-xs text-gray-500 ml-1">({record.performedBy?.userType || 'System'})</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={record.note}>
                        {record.note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data.pagination && data.pagination.pages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    // Implement pagination fetch
                  }}
                  className={`px-3 py-1 rounded ${
                    page === data.pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Stock Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Stock Change</h2>

                <form onSubmit={handleAddStock} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Type *</label>
                    <select
                      value={addForm.type}
                      onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="IN">Stock In (+)</option>
                      <option value="OUT">Stock Out (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={addForm.quantity}
                      onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter quantity"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Reason *</label>
                    <select
                      value={addForm.reason}
                      onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      {addForm.type === 'IN' ? (
                        <>
                          <option value="restock">Restock</option>
                          <option value="return">Return</option>
                          <option value="correction">Admin Correction</option>
                          <option value="initial">Initial Stock</option>
                          <option value="other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="sold">Sold</option>
                          <option value="damaged">Damaged</option>
                          <option value="correction">Admin Correction</option>
                          <option value="other">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Note</label>
                    <textarea
                      value={addForm.note}
                      onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows="3"
                      placeholder="Optional note about this stock change"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setAddForm({ type: 'IN', quantity: '', reason: 'restock', note: '' });
                        setError('');
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StockDetail;
