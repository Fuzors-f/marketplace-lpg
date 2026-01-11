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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  const calculateTotal = () => {
    if (currentPayment?.totalPaid) return currentPayment.totalPaid;
    if (currentPayment?.totalAmount) return currentPayment.totalAmount;
    if (currentPayment?.items?.length > 0) {
      return currentPayment.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    }
    return 0;
  };

  const getAllItems = () => {
    if (currentPayment?.items?.length > 0) {
      return currentPayment.items.map((item) => ({
        ...item,
        invoiceNumber: currentPayment.receiptNumber || currentPayment._id?.slice(-8).toUpperCase()
      }));
    }
    return [];
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Payment not found'}
          </div>
          <button onClick={() => navigate('/admin/payments')} className="text-blue-600 hover:text-blue-800">
            Back to Payments
          </button>
        </div>
      </Layout>
    );
  }

  const totalPaid = calculateTotal();
  const allItems = getAllItems();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Payment Receipt</h1>
          <button onClick={() => navigate('/admin/payments')} className="text-gray-600 hover:text-gray-900">
            Back to Payments
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-600 font-medium">Receipt Number</p>
                <h2 className="text-2xl font-bold text-green-800">
                  {currentPayment.receiptNumber || currentPayment._id?.slice(-8).toUpperCase()}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">Payment Date</p>
                <p className="text-lg font-semibold text-green-800">{formatDate(currentPayment.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
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
                  <p className="font-medium">{currentPayment.paymentMethodId?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {currentPayment.receiptNumber || currentPayment._id?.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{allItems.length} item(s)</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatCurrency(totalPaid)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total Paid:</td>
                      <td className="px-6 py-4 text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Items Breakdown</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allItems.length > 0 ? (
                      allItems.map((item, idx) => (
                        <tr key={item._id || idx}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.name || 'N/A'}{item.size ?  - +item.size : ''}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.price || 0)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.qty || item.quantity || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatCurrency(item.subtotal || 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentDetail;
