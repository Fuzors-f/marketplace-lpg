import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import useUserStore from '../../store/userStore';
import Footer from '../../components/Footer';

const UserPaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/user/login');
      return;
    }
    fetchPaymentDetail();
  }, [id, user]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/checkout/payments/${id}`);
      console.log('Payment detail response:', response.data);
      console.log('Payment method data:', response.data.data?.paymentMethod);
      setPayment(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const handleLogout = () => {
    useUserStore.getState().logout();
    navigate('/user/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onClick={() => navigate('/user/payments')} className="text-blue-600 hover:text-blue-800">
              ← Back to Payments
            </button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Payment not found'}
          </div>
        </div>
      </div>
    );
  }

  const allItems = payment.items || [];
  const totalPaid = payment.totalPaid || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/user/payments')}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/user/orders')} className="text-gray-600 hover:text-gray-900">Orders</button>
              <button onClick={() => navigate('/user/payments')} className="text-gray-600 hover:text-gray-900">Payments</button>
              <button onClick={() => navigate('/user/profile')} className="text-gray-600 hover:text-gray-900">Profile</button>
              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Info Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header Section */}
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-600 font-medium">Receipt Number</p>
                <h2 className="text-2xl font-bold text-green-800">
                  {payment.receiptNumber || payment._id?.slice(-8).toUpperCase()}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">Payment Date</p>
                <p className="text-lg font-semibold text-green-800">{formatDate(payment.createdAt)}</p>
                <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Method Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{payment.paymentMethod?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="font-medium">{payment.paymentMethod?.accountNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="font-medium">{payment.paymentMethod?.accountName || 'N/A'}</p>
                </div>
                {payment.shippingAddress && (
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="font-medium">{payment.shippingAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
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
                        {payment.receiptNumber || payment._id?.slice(-8).toUpperCase()}
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

            {/* Items Breakdown */}
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
                            {item.name || item.itemName || 'N/A'}
                            {item.size && ` - ${item.size}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(item.price || item.priceAtPurchase || 0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.qty || item.quantity || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {formatCurrency(item.subtotal || item.total || ((item.price || 0) * (item.qty || item.quantity || 0)))}
                          </td>
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

            {/* Print Button */}
            <div className="flex justify-end pt-4 border-t">
              <button 
                onClick={() => window.print()} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserPaymentDetail;
