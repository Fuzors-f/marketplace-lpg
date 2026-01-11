import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useTransactionStore from '../store/transactionStore';

const Payments = () => {
  const navigate = useNavigate();
  const { payments, users, fetchPayments, fetchUsers, loading, error } = useTransactionStore();

  const [filters, setFilters] = useState({ userId: '', startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchUsers();
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...payments];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.receiptNumber?.toLowerCase().includes(search) || 
        p.userId?.name?.toLowerCase().includes(search)
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = sortConfig.key === 'userName' ? (a.userId?.name || '') : a[sortConfig.key];
        let bVal = sortConfig.key === 'userName' ? (b.userId?.name || '') : b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [payments, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);

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

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleApplyFilters = () => { fetchPayments(filters); setCurrentPage(1); };
  const handleClearFilters = () => { setFilters({ userId: '', startDate: '', endDate: '' }); setSearchTerm(''); fetchPayments(); setCurrentPage(1); };
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (a) => {
    const numAmount = Number(a);
    if (isNaN(numAmount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numAmount);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Payment Records</h1>
          <button onClick={() => navigate('/admin/bulk-settlement')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ New Bulk Payment</button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="">All Users</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
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
            <div className="py-12 text-center text-gray-500">No payment records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('receiptNumber')}>Receipt{getSortIcon('receiptNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('userName')}>User{getSortIcon('userName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('totalPaid')}>Total{getSortIcon('totalPaid')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('createdAt')}>Date{getSortIcon('createdAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/payments/${p._id}`)}>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{p.receiptNumber || p._id?.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.userId?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.paymentMethodId?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.transactionIds?.length || 0} transaction(s)</td>
                      <td className="px-6 py-4 text-sm font-medium">{formatCurrency(p.totalPaid || p.totalAmount || 0)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.createdAt)}</td>
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
              {getPageNumbers().map((pg, i) => pg === '...' ? <span key={i} className="px-3 py-1">...</span> : <button key={pg} onClick={() => setCurrentPage(pg)} className={`px-3 py-1 border rounded ${currentPage === pg ? 'bg-blue-600 text-white' : ''}`}>{pg}</button>)}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded disabled:opacity-50">Last</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Payments;
