import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useTransactionStore from '../store/transactionStore';

const Transactions = () => {
  const navigate = useNavigate();
  const { 
    transactions, 
    users, 
    fetchTransactions, 
    fetchUsers,
    deleteTransaction,
    loading, 
    error 
  } = useTransactionStore();

  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...transactions];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.invoiceNumber?.toLowerCase().includes(search) ||
        t.userId?.name?.toLowerCase().includes(search) ||
        t.status?.toLowerCase().includes(search)
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'userName') {
          aVal = a.userId?.name || '';
          bVal = b.userId?.name || '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [transactions, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ';
    return sortConfig.direction === 'asc' ? ' (A)' : ' (D)';
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchTransactions(filters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ userId: '', status: '', startDate: '', endDate: '', search: '' });
    setSearchTerm('');
    fetchTransactions();
    setCurrentPage(1);
  };

  const handleDeleteClick = (transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTransaction(deletingTransaction._id);
      setShowDeleteModal(false);
      setDeletingTransaction(null);
      fetchTransactions(filters);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'DELIVERED': 'bg-green-100 text-green-800',
      'SHIPPED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'CONFIRMED': 'bg-teal-100 text-teal-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'PAID': 'bg-green-100 text-green-800',
      'UNPAID': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-blue-100 text-blue-800';
  };

  const canMakePayment = (t) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(t.status);
  const canEdit = (t) => ['PENDING'].includes(t.status);
  const canDelete = (t) => ['PENDING', 'CANCELLED'].includes(t.status);

  const handleMakePayment = (t) => {
    navigate('/admin/bulk-settlement', { 
      state: { preSelectedTransactions: [t._id], preSelectedUserId: t.userId._id }
    });
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatCurrency = (a) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(a);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <button onClick={() => navigate('/admin/transactions/create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Create Transaction</button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="">All Users</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleApplyFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Apply</button>
              <button onClick={handleClearFilters} className="bg-gray-200 px-4 py-2 rounded-lg">Clear</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="border rounded px-2 py-1">
                {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="border rounded px-3 py-1" />
          </div>

          {loading ? (
            <div className="py-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : paginatedData.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('invoiceNumber')}>Invoice{getSortIcon('invoiceNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('userName')}>User{getSortIcon('userName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('totalAmount')}>Total{getSortIcon('totalAmount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('status')}>Status{getSortIcon('status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('createdAt')}>Date{getSortIcon('createdAt')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{t.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.userId?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{(t.items?.reduce((sum, item) => sum + (item.qty || 0), 0)) || 0} items ({t.items?.length || 0} kind{t.items?.length !== 1 ? 's' : ''})</td>
                      <td className="px-6 py-4 text-sm font-medium">{formatCurrency(t.totalAmount)}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(t.status)}`}>{t.status}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => navigate(`/admin/transactions/${t._id}`)} className="text-blue-600 hover:text-blue-900">View</button>
                        {canMakePayment(t) && <button onClick={() => handleMakePayment(t)} className="text-green-600 hover:text-green-900">Payment</button>}
                        {canEdit(t) && <button onClick={() => navigate(`/admin/transactions/${t._id}/edit`)} className="text-indigo-600 hover:text-indigo-900">Edit</button>}
                        {canDelete(t) && <button onClick={() => handleDeleteClick(t)} className="text-red-600 hover:text-red-900">Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t flex justify-between items-center flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
            </div>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">First</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              {getPageNumbers().map((p, i) => p === '...' ? <span key={i} className="px-3 py-1">...</span> : <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded ${currentPage === p ? 'bg-blue-600 text-white' : ''}`}>{p}</button>)}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded disabled:opacity-50">Last</button>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete transaction <strong>{deletingTransaction?.invoiceNumber}</strong>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
