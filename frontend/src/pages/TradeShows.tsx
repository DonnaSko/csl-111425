import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface TradeShow {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  _count: {
    dealers: number;
  };
}

const TradeShows = () => {
  const [tradeShows, setTradeShows] = useState<TradeShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  useEffect(() => {
    fetchTradeShows();
  }, []);

  const fetchTradeShows = async () => {
    try {
      const response = await api.get('/trade-shows');
      setTradeShows(response.data);
    } catch (error) {
      console.error('Failed to fetch trade shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/trade-shows', formData);
      setShowCreateForm(false);
      setFormData({ name: '', location: '', startDate: '', endDate: '', description: '' });
      fetchTradeShows();
    } catch (error) {
      console.error('Failed to create trade show:', error);
      alert('Failed to create trade show. Please try again.');
    }
  };

  const handleExport = async (id: string, name: string) => {
    try {
      setExportingId(id);
      const response = await api.get(`/trade-shows/${id}/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = response.headers['content-disposition']
        ?.split('filename=')[1]?.replace(/"/g, '')
        || `trade-show-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export trade show:', error);
      alert('Failed to export trade show. Please try again.');
    } finally {
      setExportingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
            <h1 className="text-3xl font-bold text-gray-900">Trade Shows</h1>
            <p className="text-gray-600 mt-1">Manage your trade show events and export captured leads</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ➕ Create Trade Show
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Trade Show</h2>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Trade Show
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', location: '', startDate: '', endDate: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Trade Shows ({tradeShows.length} total)</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tradeShows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No trade shows found. Create your first trade show to get started.
              </div>
            ) : (
              tradeShows.map((tradeShow) => (
                <div
                  key={tradeShow.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tradeShow.name}
                      </h3>
                      {tradeShow.location && (
                        <p className="text-gray-600 mt-1">📍 {tradeShow.location}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        {tradeShow.startDate && (
                          <span>Start: {formatDate(tradeShow.startDate)}</span>
                        )}
                        {tradeShow.endDate && (
                          <span>End: {formatDate(tradeShow.endDate)}</span>
                        )}
                        <span>{tradeShow._count.dealers} dealers</span>
                      </div>
                      {tradeShow.description && (
                        <p className="text-gray-600 mt-2 text-sm">{tradeShow.description}</p>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/trade-shows/${tradeShow.id}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleExport(tradeShow.id, tradeShow.name)}
                        disabled={exportingId === tradeShow.id || tradeShow._count.dealers === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export captured leads to CSV"
                      >
                        {exportingId === tradeShow.id ? 'Exporting...' : '📥 Export Leads'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TradeShows;
