import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useTransactionStore from '../store/transactionStore';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTransaction, fetchTransactionById, loading, error } = useTransactionStore();

  useEffect(() => {
    fetchTransactionById(id);
  }, [id]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800';
      case 'CONFIRMED':
        return 'bg-teal-100 text-teal-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      // Legacy support
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const canMakePayment = (transaction) => {
    // Can make payment if status is CONFIRMED, PROCESSING, or SHIPPED (not DELIVERED)
    return ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(transaction.status);
  };

  const canEdit = (transaction) => {
    // Can edit if status is PENDING
    return ['PENDING'].includes(transaction.status);
  };

  const handleMakePayment = (transaction) => {
    // Navigate to bulk settlement with pre-selected transaction
    navigate('/admin/bulk-settlement', { 
      state: { 
        preSelectedTransactions: [transaction._id],
        preSelectedUserId: transaction.userId._id 
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !currentTransaction) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Transaction not found'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Transaction Detail</h1>
          <button
            onClick={() => navigate('/admin/transactions')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Transactions
          </button>
        </div>

        {/* Transaction Info */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {currentTransaction.invoiceNumber}
              </h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(currentTransaction.status)}`}>
                {currentTransaction.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{currentTransaction.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{currentTransaction.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{currentTransaction.userId?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{currentTransaction.userId?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Transaction Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Transaction Date</p>
                  <p className="font-medium">{formatDate(currentTransaction.createdAt)}</p>
                </div>
                {currentTransaction.paymentMethodId && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{currentTransaction.paymentMethodId?.name || 'N/A'}</p>
                  </div>
                )}
                {currentTransaction.paymentId && (
                  <div>
                    <p className="text-sm text-gray-600">Receipt Number</p>
                    <p className="font-medium">{currentTransaction.paymentId?.receiptNumber || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTransaction.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.itemId?.name || 'N/A'} - {item.itemId?.size || ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.qty}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Total Amount:
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-lg">
                        {formatCurrency(currentTransaction.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              {/* Payment Status & Link */}
              <div>
                {(currentTransaction.status === 'DELIVERED' || canMakePayment(currentTransaction)) ? (
                  <button
                    onClick={() => navigate('/admin/payments')}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    → View Payment Records
                  </button>
                ) : null}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {canMakePayment(currentTransaction) && (
                  <button
                    onClick={() => handleMakePayment(currentTransaction)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Make Payment
                  </button>
                )}
                {canEdit(currentTransaction) && (
                  <button
                    onClick={() => navigate(`/admin/transactions/${currentTransaction._id}/edit`)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionDetail;
