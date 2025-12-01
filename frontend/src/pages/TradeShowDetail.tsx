import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Dealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

interface DealerTradeShow {
  id: string;
  dealer: Dealer;
  createdAt: string;
}

interface TradeShowDetail {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  dealers: DealerTradeShow[];
}

const TradeShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tradeShow, setTradeShow] = useState<TradeShowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTradeShow();
    }
  }, [id]);

  const fetchTradeShow = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get(`/trade-shows/${id}`);
      setTradeShow(response.data);
    } catch (error: any) {
      console.error('Failed to fetch trade show:', error);
      setError(error.response?.data?.error || 'Failed to load trade show details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading trade show details...</div>
        </div>
      </Layout>
    );
  }

  if (error || !tradeShow) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error || 'Trade show not found'}</p>
            <button
              onClick={() => navigate('/trade-shows')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Trade Shows
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <button
            onClick={() => navigate('/trade-shows')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Trade Shows
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{tradeShow.name}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trade Show Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tradeShow.location && (
              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-gray-900">📍 {tradeShow.location}</p>
              </div>
            )}
            {tradeShow.startDate && (
              <div>
                <p className="text-sm font-medium text-gray-600">Start Date</p>
                <p className="text-gray-900">{formatDate(tradeShow.startDate)}</p>
              </div>
            )}
            {tradeShow.endDate && (
              <div>
                <p className="text-sm font-medium text-gray-600">End Date</p>
                <p className="text-gray-900">{formatDate(tradeShow.endDate)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Total Dealers</p>
              <p className="text-gray-900">{tradeShow.dealers.length}</p>
            </div>
          </div>
          {tradeShow.description && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-gray-900 mt-1">{tradeShow.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Associated Dealers ({tradeShow.dealers.length})</h2>
          </div>
          {tradeShow.dealers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No dealers associated with this trade show yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tradeShow.dealers.map((dts) => (
                <Link
                  key={dts.id}
                  to={`/dealers/${dts.dealer.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dts.dealer.companyName}
                      </h3>
                      {dts.dealer.contactName && (
                        <p className="text-gray-600 mt-1">{dts.dealer.contactName}</p>
                      )}
                      {dts.dealer.email && (
                        <p className="text-sm text-gray-500 mt-1">{dts.dealer.email}</p>
                      )}
                      {dts.dealer.phone && (
                        <p className="text-sm text-gray-500 mt-1">{dts.dealer.phone}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Captured: {new Date(dts.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${
                          dts.dealer.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : dts.dealer.status === 'Prospect'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {dts.dealer.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TradeShowDetail;

