import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import useTransactionStore from '../store/transactionStore';
import api from '../api/axios';

const BulkSettlement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    transactions,
    users, 
    fetchTransactions, 
    fetchUsers,
    bulkPayTransactions,
    loading, 
    error 
  } = useTransactionStore();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [unpaidTransactions, setUnpaidTransactions] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchPaymentMethods();
    
    // Handle pre-selected data from navigation state
    if (location.state?.preSelectedTransactions) {
      setSelectedTransactions(location.state.preSelectedTransactions);
    }
    if (location.state?.preSelectedUserId) {
      setSelectedUserId(location.state.preSelectedUserId);
    }
    if (location.state?.preSelectedPaymentMethodId) {
      setPaymentMethodId(location.state.preSelectedPaymentMethodId);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      // Fetch transactions that can be paid - both UNPAID and completed orders
      fetchTransactions({ userId: selectedUserId });
      
      // Auto-select default payment method if not already selected
      if (!paymentMethodId && paymentMethods.length > 0) {
        // Select first available payment method as default
        setPaymentMethodId(paymentMethods[0]._id);
      }
    }
  }, [selectedUserId, paymentMethods]);

  useEffect(() => {
    // Filter transactions that can be paid (UNPAID or delivered status orders)
    const payableTransactions = transactions.filter(t => 
      t.status === 'UNPAID' || t.status === 'PENDING' ||
      ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(t.status)
    );
    setUnpaidTransactions(payableTransactions);
    
    // Keep pre-selected transactions if they exist and are still valid
    if (location.state?.preSelectedTransactions) {
      const validPreSelected = location.state.preSelectedTransactions.filter(id =>
        payableTransactions.some(t => t._id === id)
      );
      if (validPreSelected.length > 0) {
        setSelectedTransactions(validPreSelected);
      }
    } else {
      setSelectedTransactions([]);
    }
  }, [transactions, location.state]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payment-methods');
      if (response.data.success) {
        setPaymentMethods(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTransactions(unpaidTransactions.map(t => t._id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const calculateTotalAmount = () => {
    return unpaidTransactions
      .filter(t => selectedTransactions.includes(t._id))
      .reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (selectedTransactions.length === 0) {
      alert('Please select at least one transaction');
      return;
    }

    if (!paymentMethodId) {
      alert('Please select a payment method');
      return;
    }

    try {
      const paymentData = {
        userId: selectedUserId,
        transactionIds: selectedTransactions,
        paymentMethodId
      };

      const result = await bulkPayTransactions(paymentData);
      if (result && result.receiptNumber) {
        alert(`Payment successful! Receipt: ${result.receiptNumber}`);
      } else {
        alert('Payment processed successfully!');
      }
      navigate('/admin/payments');
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || 'Failed to process payment');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Settlement</h1>
          <button
            onClick={() => navigate('/admin/transactions')}
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

        {/* User Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Select User</h2>
          <div className="max-w-md">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unpaid Transactions */}
        {selectedUserId && (
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Unpaid Transactions</h2>
                  {unpaidTransactions.length > 0 && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === unpaidTransactions.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Select All</span>
                    </label>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : unpaidTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No unpaid transactions found for this user
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.length === unpaidTransactions.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unpaidTransactions.map((transaction) => (
                        <tr 
                          key={transaction._id}
                          className={`hover:bg-gray-50 ${selectedTransactions.includes(transaction._id) ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.includes(transaction._id)}
                              onChange={() => handleSelectTransaction(transaction._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {transaction.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.items?.length || 0} item(s)
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Details */}
            {selectedTransactions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(e.target.value)}
                      className="max-w-md w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose payment method...</option>
                      {paymentMethods.map((method) => (
                        <option key={method._id} value={method._id}>
                          {method.name} ({method.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Selected Transactions:</span>
                      <span className="font-bold text-blue-600">{selectedTransactions.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl mt-2">
                      <span className="font-semibold">Total Payment:</span>
                      <span className="font-bold text-green-600">{formatCurrency(calculateTotalAmount())}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/transactions')}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {loading ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Layout>
  );
};

export default BulkSettlement;
