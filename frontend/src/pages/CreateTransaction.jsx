import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useTransactionStore from '../store/transactionStore';
import useItemStore from '../store/itemStore';
import useStockStore from '../store/stockStore';

const CreateTransaction = () => {
  const navigate = useNavigate();
  const { createTransaction, users, fetchUsers, loading, error } = useTransactionStore();
  const { items, fetchItems } = useItemStore();
  const { summary, fetchStockSummary } = useStockStore();

  const [formData, setFormData] = useState({
    userId: '',
    status: 'UNPAID',
    items: []
  });

  const [selectedItem, setSelectedItem] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  useEffect(() => {
    fetchUsers();
    fetchItems();
    fetchStockSummary();
  }, []);

  const getStock = (itemId) => {
    const stockInfo = summary.find(s => s.itemId === itemId);
    return stockInfo ? stockInfo.currentStock : 0;
  };

  const getItemById = (itemId) => {
    return items.find(item => item._id === itemId);
  };

  const handleAddItem = () => {
    if (!selectedItem || itemQuantity < 1) {
      alert('Please select an item and enter a valid quantity');
      return;
    }

    const item = getItemById(selectedItem);
    const stock = getStock(selectedItem);

    if (itemQuantity > stock) {
      alert(`Insufficient stock. Available: ${stock}`);
      return;
    }

    // Check if item already exists in the list
    const existingItemIndex = formData.items.findIndex(i => i.itemId === selectedItem);

    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...formData.items];
      const newQty = updatedItems[existingItemIndex].qty + itemQuantity;

      if (newQty > stock) {
        alert(`Total quantity exceeds stock. Available: ${stock}`);
        return;
      }

      updatedItems[existingItemIndex].qty = newQty;
      setFormData({ ...formData, items: updatedItems });
    } else {
      // Add new item
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            itemId: selectedItem,
            qty: itemQuantity,
            name: item.name,
            size: item.size,
            price: item.price
          }
        ]
      });
    }

    // Reset selection
    setSelectedItem('');
    setItemQuantity(1);
  };

  const handleRemoveItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.itemId !== itemId)
    });
  };

  const handleUpdateItemQty = (itemId, newQty) => {
    if (newQty < 1) return;

    const stock = getStock(itemId);
    if (newQty > stock) {
      alert(`Quantity exceeds stock. Available: ${stock}`);
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.itemId === itemId ? { ...item, qty: newQty } : item
      )
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price * item.qty);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId) {
      alert('Please select a user');
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      const transactionData = {
        userId: formData.userId,
        status: formData.status,
        items: formData.items.map(item => ({
          itemId: item.itemId,
          qty: item.qty
        }))
      };

      await createTransaction(transactionData);
      alert('Transaction created successfully!');
      navigate('/transactions');
    } catch (error) {
      console.error('Create transaction error:', error);
      alert(error.response?.data?.message || 'Failed to create transaction');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Transaction</h1>
          <button
            onClick={() => navigate('/transactions')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Transactions
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Add Items</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an item...</option>
                  {items.filter(item => item.status === 'active').map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} - {item.size} (Stock: {getStock(item._id)}) - {formatCurrency(item.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {formData.items.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-3">Selected Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item) => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.name} - {item.size}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItemQty(item.itemId, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {formatCurrency(item.price * item.qty)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.itemId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Total:
                        </td>
                        <td colSpan="2" className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatCurrency(calculateTotal())}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Select items from the dropdown above.
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTransaction;
