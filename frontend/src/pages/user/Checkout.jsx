import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import useUserStore from '../../store/userStore';
import Footer from '../../components/Footer';

function Checkout() {
  const navigate = useNavigate();
  const { user, cart, fetchCart, clearCart, getCartTotal } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/user/login');
      return;
    }
    
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await fetchCart();
    await fetchPaymentMethods();
    
    // Set default shipping address from user profile
    if (user.address) {
      setShippingAddress(user.address);
    }
    
    setLoading(false);
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/payment-methods?active=true');
      const activeMethods = response.data.data.filter(pm => pm.active);
      setPaymentMethods(activeMethods);
      
      if (activeMethods.length > 0) {
        setSelectedPaymentMethod(activeMethods[0]._id);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load payment methods');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Please provide a shipping address');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post('/checkout', {
        paymentMethodId: selectedPaymentMethod,
        shippingAddress: shippingAddress.trim()
      });

      if (response.data.success) {
        // Clear cart from store
        await clearCart();
        
        // Navigate to orders page with success message
        navigate('/user/orders', { 
          state: { 
            success: 'Order placed successfully!',
            orderId: response.data.data._id
          } 
        });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center max-w-md">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add items before checking out</p>
          <button
            onClick={() => navigate('/user/catalog')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/user/cart')}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hello, {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your complete shipping address..."
                />
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                
                {paymentMethods.length === 0 ? (
                  <p className="text-gray-500">No payment methods available</p>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method._id}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPaymentMethod === method._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method._id}
                          checked={selectedPaymentMethod === method._id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3 w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{method.name}</p>
                          {method.description && (
                            <p className="text-sm text-gray-600">{method.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.itemId._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.itemId.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.qty} x {formatPrice(item.itemId.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.itemId.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cart.items.length})</span>
                    <span className="font-medium">{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(getCartTotal())}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || paymentMethods.length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/user/cart')}
                  disabled={submitting}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                >
                  Back to Cart
                </button>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    🔒 Secure checkout powered by LPG Marketplace
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Checkout;
