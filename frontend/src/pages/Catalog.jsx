import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const Catalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      const [catalogRes, itemsRes] = await Promise.all([
        api.get('/catalog/admin', { params: { page: currentPage, limit: itemsPerPage } }),
        api.get('/items', { params: { limit: 100 } }) // Get all items for dropdown
      ]);

      console.log('Catalog response:', catalogRes.data); // Debug log
      setCatalog(catalogRes.data.data);
      setTotalPages(catalogRes.data.totalPages || 1);
      setItems(itemsRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const handleAddToCatalog = async (e) => {
    e.preventDefault();
    
    if (!selectedItemId) {
      alert('Please select an item');
      return;
    }
    
    try {
      const response = await api.post('/catalog', { itemId: selectedItemId, isListed: true });
      if (response.data.success) {
        setShowModal(false);
        setSelectedItemId('');
        setCurrentPage(1); // Reset to first page
        fetchData();
      }
    } catch (error) {
      console.error('Add to catalog error:', error);
      alert(error.response?.data?.message || 'Failed to add item to catalog');
    }
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      await api.put(`/catalog/${id}`, { isListed: !currentStatus });
      fetchData();
    } catch (error) {
      alert('Failed to update catalog item');
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm('Remove this item from catalog?')) {
      try {
        await api.delete(`/catalog/${id}`);
        fetchData();
      } catch (error) {
        alert('Failed to remove item from catalog');
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Filter items not in catalog
  const availableItems = items.filter(
    item => !catalog.some(cat => cat.itemId?._id === item._id)
  );

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Catalogs</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Add to Catalog
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {catalog.map((cat) => {
              const item = cat.itemId;
              if (!item) return null;

              return (
                <div key={cat._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <img 
                        src="https://img.lazcdn.com/g/p/a1eeec26b4ee0b9ce69dfe7a57dc3e93.jpg_720x720q80.jpg" 
                        alt="Logo Pertamina" 
                        className="w-20 h-20 object-contain"
                      />
                    )}
                    {!cat.isListed && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">HIDDEN</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.size}</p>
                    <p className="text-xl font-bold text-green-600 mb-3">{formatPrice(item.price)}</p>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleToggleVisibility(cat._id, cat.isListed)}
                        className={`w-full py-2 rounded transition font-semibold ${
                          cat.isListed
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {cat.isListed ? 'Hide from Catalog' : 'Show in Catalog'}
                      </button>

                      <button
                        onClick={() => handleRemove(cat._id)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {catalog.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            No items in catalog. Click "Add to Catalog" to get started.
          </div>
        )}

        {/* Pagination */}
        {!loading && catalog.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages} ({catalog.length} items on this page)
            </p>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg border ${
                            currentPage === pageNum
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Item to Catalog</h2>

                <form onSubmit={handleAddToCatalog} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Select Item *</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {availableItems.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} - {item.size}
                        </option>
                      ))}
                    </select>
                  </div>

                  {availableItems.length === 0 && (
                    <p className="text-gray-600 text-sm">All items are already in the catalog.</p>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={!selectedItemId}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
                    >
                      Add to Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedItemId('');
                      }}
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

export default Catalog;
