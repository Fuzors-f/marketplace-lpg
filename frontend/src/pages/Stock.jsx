import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useStockStore from '../store/stockStore';
import useItemStore from '../store/itemStore';

const Stock = () => {
  const navigate = useNavigate();
  const { summary, fetchStockSummary, addStock, loading } = useStockStore();
  const { items, fetchItems } = useItemStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    type: 'IN',
    note: ''
  });

  useEffect(() => {
    fetchItems();
    fetchStockSummary();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      itemId: '',
      quantity: '',
      type: 'IN',
      note: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addStock({
      ...formData,
      quantity: parseInt(formData.quantity)
    });

    if (success) {
      handleCloseModal();
      fetchStockSummary();
    }
  };

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Stocks</h1>
          <button
            onClick={handleOpenModal}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Add Stock Movement
          </button>
        </div>

        {loading && summary.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Item Name</th>
                    <th className="px-6 py-4 text-left">Size</th>
                    <th className="px-6 py-4 text-center">Current Stock</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item, index) => (
                    <tr key={item.itemId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                      <td className="px-6 py-4 text-gray-600">{item.size}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-4 py-1 rounded-full font-semibold ${
                          item.currentStock < 10 
                            ? 'bg-red-100 text-red-800'
                            : item.currentStock < 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.currentStock < 10 ? (
                          <span className="text-red-600 font-semibold">Low Stock</span>
                        ) : item.currentStock < 20 ? (
                          <span className="text-yellow-600 font-semibold">Medium</span>
                        ) : (
                          <span className="text-green-600 font-semibold">Good</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/stock/${item.itemId}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {summary.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No stock data available
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Stock Movement</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Select Item *</label>
                    <select
                      name="itemId"
                      value={formData.itemId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {items.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} - {item.size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
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
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Note</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Optional note about this stock movement"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    ></textarea>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
                    >
                      {loading ? 'Saving...' : 'Add Movement'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
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

export default Stock;
