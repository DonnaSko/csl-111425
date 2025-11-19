import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Dealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  buyingGroup: string | null;
  _count: {
    dealerNotes: number;
    photos: number;
    voiceRecordings: number;
    todos: number;
  };
}

const Dealers = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [buyingGroupFilter, setBuyingGroupFilter] = useState('All Buying Groups');
  const [buyingGroups, setBuyingGroups] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDealers();
    fetchBuyingGroups();
  }, [search, statusFilter, buyingGroupFilter]);

  const fetchDealers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'All Statuses') params.append('status', statusFilter);
      if (buyingGroupFilter !== 'All Buying Groups') params.append('buyingGroup', buyingGroupFilter);

      const response = await api.get(`/dealers?${params.toString()}`);
      setDealers(response.data.dealers);
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyingGroups = async () => {
    try {
      const response = await api.get('/dealers/buying-groups/list');
      setBuyingGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch buying groups:', error);
    }
  };

  const handleBulkUpload = () => {
    // TODO: Implement CSV upload
    alert('CSV upload feature coming soon');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dealers</h1>
            <p className="text-gray-600 mt-1">Manage your dealer database</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleBulkUpload}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              📤 Bulk Upload CSV
            </button>
            <button
              onClick={() => navigate('/capture-lead')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Add New Dealer
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by company name, contact name, email, phone, or buying group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>All Statuses</option>
              <option>Prospect</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select
              value={buyingGroupFilter}
              onChange={(e) => setBuyingGroupFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>All Buying Groups</option>
              {buyingGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dealers List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Dealer List ({dealers.length} total)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on any company or contact name to view details and add notes.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {dealers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No dealers found. Add your first dealer to get started.
              </div>
            ) : (
              dealers.map((dealer) => (
                <Link
                  key={dealer.id}
                  to={`/dealers/${dealer.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dealer.companyName}
                      </h3>
                      {dealer.contactName && (
                        <p className="text-gray-600 mt-1">{dealer.contactName}</p>
                      )}
                      {dealer.email && (
                        <p className="text-sm text-gray-500 mt-1">{dealer.email}</p>
                      )}
                      {dealer.buyingGroup && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {dealer.buyingGroup}
                        </span>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${
                          dealer.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : dealer.status === 'Prospect'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {dealer.status}
                      </span>
                      <div className="mt-2 text-xs text-gray-500">
                        {dealer._count.dealerNotes} notes • {dealer._count.photos} photos •{' '}
                        {dealer._count.voiceRecordings} recordings
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dealers;

