import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 flex items-center justify-center shadow-lg rounded-full bg-white p-2">
              <img 
                src="https://img.lazcdn.com/g/p/a1eeec26b4ee0b9ce69dfe7a57dc3e93.jpg_720x720q80.jpg" 
                alt="Logo Pertamina" 
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            PT. UNGGUL MIGAS SEJATI
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Sumber LPG paling terpercaya se penjuru Lombok
          </p>

          {/* Welcome Message */}
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-lg text-gray-700 mb-6">
              Selamat datang di marketplace LPG kami. Dapatkan tabung gas berkualitas dengan harga terbaik.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/user/catalog')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 shadow-lg transform hover:scale-105 transition-all"
            >
              Browse Catalog
            </button>
            <button
              onClick={() => navigate('/user/register')}
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all"
            >
              Register Now
            </button>
            <button
              onClick={() => navigate('/user/login')}
              className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 shadow-lg border-2 border-gray-300 transform hover:scale-105 transition-all"
            >
              Sign In
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Shopping</h3>
              <p className="text-gray-600">Browse and order LPG products with just a few clicks</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-green-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Products</h3>
              <p className="text-gray-600">Premium LPG cylinders with guaranteed quality</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-purple-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable delivery to your doorstep</p>
            </div>
          </div>

          {/* Admin Link */}
          <div className="border-t border-gray-300 pt-8">
            <p className="text-gray-600 mb-4">Are you an administrator?</p>
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-700 hover:text-gray-900 font-medium inline-flex items-center"
            >
              Go to Admin Panel
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2025 PT. UNGGUL MIGAS SEJATI. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Sumber LPG paling terpercaya se penjuru Lombok
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
