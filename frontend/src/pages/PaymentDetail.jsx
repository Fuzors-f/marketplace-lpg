import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useTransactionStore from '../store/transactionStore';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentPayment, fetchPaymentById, loading, error } = useTransactionStore();

  useEffect(() => {
    fetchPaymentById(id);
  }, [id]);

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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !currentPayment) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Payment not found'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Payment Receipt</h1>
          <button
            onClick={() => navigate('/payments')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Payments
          </button>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-600 font-medium">Receipt Number</p>
                <h2 className="text-2xl font-bold text-green-800">
                  {currentPayment.receiptNumber}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">Payment Date</p>
                <p className="text-lg font-semibold text-green-800">
                  {formatDate(currentPayment.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{currentPayment.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{currentPayment.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{currentPayment.userId?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">
                    {currentPayment.paymentMethodId?.name || 'N/A'} 
                    {currentPayment.paymentMethodId?.type && ` (${currentPayment.paymentMethodId.type})`}
                  </p>
                </div>
              </div>
            </div>

            {/* Paid Transactions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Paid Transactions</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPayment.transactionIds?.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {transaction.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.items?.length || 0} item(s)
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {formatCurrency(transaction.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => navigate(`/transactions/${transaction._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Total Paid:
                      </td>
                      <td colSpan="2" className="px-6 py-4 text-lg font-bold text-green-600">
                        {formatCurrency(currentPayment.totalPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Detailed Items Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Items Breakdown</h3>
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
                    {currentPayment.transactionIds?.map((transaction) => 
                      transaction.items?.map((item, index) => (
                        <tr key={`${transaction._id}-${index}`}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.itemId?.name || 'N/A'} - {item.itemId?.size || ''}
                            <span className="text-xs text-gray-500 ml-2">({transaction.invoiceNumber})</span>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentDetail;
