import { useState, useEffect } from 'react';
import axios from '../api/axios';

function Footer() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching footer settings:', err);
      // Set default values if API fails
      setSettings({
        companyName: 'PT. Unggul Migas Sejati',
        address: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
        contactPerson: 'Budi Pekerti',
        phone: '+628117584566',
        email: 'budi@gmail.com'
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </footer>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Logo */}
        {settings.footerLogo && (
          <div className="flex justify-center mb-6">
            <img 
              src={settings.footerLogo} 
              alt={settings.companyName}
              className="h-16 object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}

        {/* Company Name */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {settings.companyName}
          </h3>
        </div>

        {/* Address Section */}
        <div className="flex justify-center mb-6">
          <div className="text-center max-w-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-semibold text-gray-700">Alamat</p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {settings.location || settings.address}
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold text-gray-700">Contact Person</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Contact 1 - Heru Atmojo */}
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">Heru Atmojo</p>
              <p className="text-sm text-gray-600 mb-1">atmojohero69@gmail.com</p>
              <p className="text-sm text-gray-600">+628123522860</p>
            </div>
            
            {/* Contact 2 - Mawardi */}
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">Mawardi</p>
              <p className="text-sm text-gray-600 mb-1">mawardi2455@gmail.com</p>
              <p className="text-sm text-gray-600">+6281237332540</p>
            </div>
            
            {/* Contact 3 - Diah */}
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">Diah</p>
              <p className="text-sm text-gray-600 mb-1">diahkurniyaty3@gmail.com</p>
              <p className="text-sm text-gray-600">+6287730221343</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <p className="text-center text-xs text-gray-500">
            © Copyright PT Pertamina (Persero) 2025. All Right Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
