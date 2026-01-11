import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from '../api/axios';

function Settings() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    locationInfo: '',
    footerLogo: '',
    contactPersons: [
      { name: 'Heru Atmojo', email: 'atmojohero69@gmail.com', phone: '+628123522860' },
      { name: 'Mawardi', email: 'mawardi2455@gmail.com', phone: '+6281237332540' },
      { name: 'Diah', email: 'diahkurniyaty3@gmail.com', phone: '+6287730221343' }
    ]
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Settings fetch timeout - using default values');
        setLoading(false);
        setError('Settings loading took too long. Using default values.');
      }
    }, 10000); // 10 second timeout
    
    fetchSettings();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to fetch settings from the backend
      const response = await axios.get('/settings');
      
      if (response && response.data) {
        if (response.data.success && response.data.data) {
          const settings = response.data.data;
          const contactPersons = (settings.contactPersons && Array.isArray(settings.contactPersons) && settings.contactPersons.length > 0)
            ? settings.contactPersons.map(c => ({
                name: c.name || '',
                email: c.email || '',
                phone: c.phone || ''
              }))
            : [
                { name: 'Heru Atmojo', email: 'atmojohero69@gmail.com', phone: '+628123522860' },
                { name: 'Mawardi', email: 'mawardi2455@gmail.com', phone: '+6281237332540' },
                { name: 'Diah', email: 'diahkurniyaty3@gmail.com', phone: '+6287730221343' }
              ];
          
          setFormData({
            companyName: settings.companyName || '',
            address: settings.address || '',
            locationInfo: settings.locationInfo || '',
            footerLogo: settings.footerLogo || '',
            contactPersons: contactPersons
          });
        } else {
          // If API returns success but no data, use defaults
          console.warn('Settings API returned success but no data');
          setFormData(prev => ({
            ...prev,
            contactPersons: [
              { name: 'Heru Atmojo', email: 'atmojohero69@gmail.com', phone: '+628123522860' },
              { name: 'Mawardi', email: 'mawardi2455@gmail.com', phone: '+6281237332540' },
              { name: 'Diah', email: 'diahkurniyaty3@gmail.com', phone: '+6287730221343' }
            ]
          }));
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err.message);
      console.error('Error details:', err.response?.data || err);
      
      // Use default values as fallback
      setFormData(prev => ({
        ...prev,
        contactPersons: [
          { name: 'Heru Atmojo', email: 'atmojohero69@gmail.com', phone: '+628123522860' },
          { name: 'Mawardi', email: 'mawardi2455@gmail.com', phone: '+6281237332540' },
          { name: 'Diah', email: 'diahkurniyaty3@gmail.com', phone: '+6287730221343' }
        ]
      }));
      
      // Don't show error to user if it's just a network issue on load
      console.log('Loaded settings with default values');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContactChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons];
    updatedContactPersons[index][field] = value;
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.companyName || !formData.address) {
      setError('Please fill in company name and address');
      return;
    }

    // Validate at least one contact person has all fields
    if (!formData.contactPersons.some(c => c.name.trim() && c.email.trim() && c.phone.trim())) {
      setError('Please add at least one complete contact person with name, email, and phone');
      return;
    }

    setSaving(true);

    try {
      console.log('Sending settings data:', formData);
      const response = await axios.put('/settings', formData);
      
      console.log('Settings response:', response.data);
      
      if (response.data.success) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to save settings');
      }
      
      setSaving(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      
      // Provide detailed error message
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save settings';
      setError(`Error: ${errorMsg}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="mt-2 text-gray-600">Manage company information displayed in the footer</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
          <p>Loading settings from server...</p>
          <p className="text-sm mt-2">If this takes too long, the page will automatically use default values.</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        <p className="mt-2 text-gray-600">Manage company information displayed in the footer</p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PT. Unggul Migas Sejati"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              id="address"
              name="address"
              required
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jl. Karang Bayan, Sigerongan, Kec. Lingsar..."
            />
          </div>

          {/* Location (Optional - same as address or different) */}
          <div>
            <label htmlFor="locationInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Location Info
              <span className="text-gray-500 text-xs ml-2">(Optional - defaults to address)</span>
            </label>
            <textarea
              id="locationInfo"
              name="locationInfo"
              rows="2"
              value={formData.locationInfo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Same as address or provide specific location details..."
            />
          </div>

          {/* Contact Persons Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Persons (3 people)</h3>
            {formData.contactPersons && formData.contactPersons.length > 0 ? (
              <div className="space-y-6 w-full">
                {formData.contactPersons.map((contact, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">Contact Person {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+62812345678"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p>Loading contact persons...</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Footer Preview</h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="text-center">
                {formData.footerLogo && (
                  <img 
                    src={formData.footerLogo} 
                    alt="Company Logo" 
                    className="h-12 mx-auto mb-4"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <h4 className="font-bold text-lg text-gray-900 mb-2">
                  {formData.companyName || 'Company Name'}
                </h4>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Alamat
                  </p>
                  <p>
                    {formData.locationInfo || formData.address || 'Address not set'}
                  </p>
                </div>

                {/* Contact Persons Preview */}
                <div className="border-t border-gray-300 pt-4">
                  <p className="font-semibold text-gray-900 mb-4">Contact Person</p>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.contactPersons.map((contact, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-semibold text-gray-900 mb-1">
                          {contact.name || `Contact ${index + 1}`}
                        </p>
                        <p className="text-gray-600 text-xs mb-1">{contact.email || 'email@example.com'}</p>
                        <p className="text-gray-600 text-xs">{contact.phone || '+62812345678'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  © Copyright PT Pertamina (Persero) 2025. All Right Reserved.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default Settings;
