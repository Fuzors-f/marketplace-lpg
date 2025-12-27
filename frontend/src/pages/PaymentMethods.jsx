import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank_transfer',
    accountNumber: '',
    accountName: '',
    qrCode: '',
    instructions: '',
    active: true
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payment-methods');
      setPaymentMethods(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      setLoading(false);
    }
  };

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        accountNumber: method.accountNumber || '',
        accountName: method.accountName || '',
        qrCode: method.qrCode || '',
        instructions: method.instructions || '',
        active: method.active
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'bank_transfer',
        accountNumber: '',
        accountName: '',
        qrCode: '',
        instructions: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMethod(null);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await api.put(`/payment-methods/${editingMethod._id}`, formData);
      } else {
        await api.post('/payment-methods', formData);
      }
      handleCloseModal();
      fetchPaymentMethods();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save payment method');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await api.delete(`/payment-methods/${id}`);
        fetchPaymentMethods();
      } catch (error) {
        alert('Failed to delete payment method');
      }
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      bank_transfer: 'Bank Transfer',
      e_wallet: 'E-Wallet',
      cod: 'Cash on Delivery',
      qris: 'QRIS'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      bank_transfer: 'bg-blue-100 text-blue-800',
      e_wallet: 'bg-purple-100 text-purple-800',
      cod: 'bg-green-100 text-green-800',
      qris: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Payment Methods</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Add Payment Method
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <div key={method._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{method.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getTypeColor(method.type)}`}>
                      {getTypeLabel(method.type)}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    method.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {method.accountNumber && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Account Number:</p>
                    <p className="font-semibold text-gray-800">{method.accountNumber}</p>
                  </div>
                )}

                {method.accountName && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Account Name:</p>
                    <p className="font-semibold text-gray-800">{method.accountName}</p>
                  </div>
                )}

                {method.instructions && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Instructions:</p>
                    <p className="text-sm text-gray-700">{method.instructions}</p>
                  </div>
                )}

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleOpenModal(method)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(method._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {paymentMethods.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            No payment methods configured. Click "Add Payment Method" to get started.
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Bank BCA, GoPay, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
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
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="e_wallet">E-Wallet</option>
                      <option value="cod">Cash on Delivery (COD)</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </div>

                  {(formData.type === 'bank_transfer' || formData.type === 'e_wallet') && (
                    <>
                      <div>
                        <label className="block text-gray-700 mb-2">Account Number</label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          placeholder="Account or phone number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Account Name</label>
                        <input
                          type="text"
                          name="accountName"
                          value={formData.accountName}
                          onChange={handleChange}
                          placeholder="Account holder name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </>
                  )}

                  {formData.type === 'qris' && (
                    <div>
                      <label className="block text-gray-700 mb-2">QR Code Image URL</label>
                      <input
                        type="text"
                        name="qrCode"
                        value={formData.qrCode}
                        onChange={handleChange}
                        placeholder="https://example.com/qr-code.jpg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 mb-2">Instructions</label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Payment instructions for customers"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    ></textarea>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label className="ml-2 text-gray-700">Active (visible to customers)</label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition"
                    >
                      {editingMethod ? 'Update' : 'Create'}
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

export default PaymentMethods;
