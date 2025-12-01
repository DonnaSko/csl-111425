import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface DashboardStats {
  totalDealers: number;
  totalNotes: number;
  totalPhotos: number;
  totalRecordings: number;
  activeTodos: number;
  dealersByStatus: Array<{ status: string; _count: number }>;
  dealersByRating: Array<{ rating: number; _count: number }>;
}

interface Dealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status?: string;
  rating?: number | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Track dealer data for each section
  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [dealersByStatus, setDealersByStatus] = useState<Record<string, Dealer[]>>({});
  const [dealersByRating, setDealersByRating] = useState<Record<number, Dealer[]>>({});
  const [dealersWithNotes, setDealersWithNotes] = useState<Dealer[]>([]);
  const [dealersWithPhotos, setDealersWithPhotos] = useState<Dealer[]>([]);
  const [dealersWithRecordings, setDealersWithRecordings] = useState<Dealer[]>([]);
  
  // Track search terms for each section
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  
  // Track loading states for each section
  const [loadingDealers, setLoadingDealers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await api.get('/reports/dashboard');
        
        // Validate response data
        if (response.data) {
          setStats({
            totalDealers: response.data.totalDealers ?? 0,
            totalNotes: response.data.totalNotes ?? 0,
            totalPhotos: response.data.totalPhotos ?? 0,
            totalRecordings: response.data.totalRecordings ?? 0,
            activeTodos: response.data.activeTodos ?? 0,
            dealersByStatus: Array.isArray(response.data.dealersByStatus) ? response.data.dealersByStatus : [],
            dealersByRating: Array.isArray(response.data.dealersByRating) ? response.data.dealersByRating : []
          });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        console.error('Failed to fetch dashboard stats:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load dashboard. Please try refreshing the page.';
        setError(errorMessage);
        // Set default stats to prevent crashes
        setStats({
          totalDealers: 0,
          totalNotes: 0,
          totalPhotos: 0,
          totalRecordings: 0,
          activeTodos: 0,
          dealersByStatus: [],
          dealersByRating: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fetchDealersForSection = async (sectionType: string, filter?: string | number) => {
    const loadingKey = `${sectionType}-${filter || 'all'}`;
    setLoadingDealers(prev => ({ ...prev, [loadingKey]: true }));

    try {
      let response: { data: { dealers: Dealer[] } };
      
      if (sectionType === 'all-dealers') {
        const searchTerm = searchTerms[sectionType] || '';
        const url = searchTerm ? `/reports/dashboard/all-dealers?search=${encodeURIComponent(searchTerm)}` : '/reports/dashboard/all-dealers';
        response = await api.get<{ dealers: Dealer[] }>(url);
        setAllDealers(Array.isArray(response.data?.dealers) ? response.data.dealers : []);
      } else if (sectionType === 'by-status' && filter) {
        const searchTerm = searchTerms[`${sectionType}-${filter}`] || '';
        const url = searchTerm 
          ? `/reports/dashboard/dealers-by-status/${filter}?search=${encodeURIComponent(searchTerm)}`
          : `/reports/dashboard/dealers-by-status/${filter}`;
        response = await api.get<{ dealers: Dealer[] }>(url);
        setDealersByStatus(prev => ({ ...prev, [filter as string]: Array.isArray(response.data?.dealers) ? response.data.dealers : [] }));
      } else if (sectionType === 'by-rating' && filter) {
        const searchTerm = searchTerms[`${sectionType}-${filter}`] || '';
        const url = searchTerm 
          ? `/reports/dashboard/dealers-by-rating/${filter}?search=${encodeURIComponent(searchTerm)}`
          : `/reports/dashboard/dealers-by-rating/${filter}`;
        response = await api.get<{ dealers: Dealer[] }>(url);
        setDealersByRating(prev => ({ ...prev, [filter as number]: Array.isArray(response.data?.dealers) ? response.data.dealers : [] }));
      } else if (sectionType === 'with-notes') {
        const searchTerm = searchTerms[sectionType] || '';
        const url = searchTerm ? `/reports/dashboard/dealers-with-notes?search=${encodeURIComponent(searchTerm)}` : '/reports/dashboard/dealers-with-notes';
        response = await api.get<{ dealers: Dealer[] }>(url);
        setDealersWithNotes(Array.isArray(response.data?.dealers) ? response.data.dealers : []);
      } else if (sectionType === 'with-photos') {
        const searchTerm = searchTerms[sectionType] || '';
        const url = searchTerm ? `/reports/dashboard/dealers-with-photos?search=${encodeURIComponent(searchTerm)}` : '/reports/dashboard/dealers-with-photos';
        response = await api.get<{ dealers: Dealer[] }>(url);
        setDealersWithPhotos(Array.isArray(response.data?.dealers) ? response.data.dealers : []);
      } else if (sectionType === 'with-recordings') {
        const searchTerm = searchTerms[sectionType] || '';
        const url = searchTerm ? `/reports/dashboard/dealers-with-recordings?search=${encodeURIComponent(searchTerm)}` : '/reports/dashboard/dealers-with-recordings';
        response = await api.get<{ dealers: Dealer[] }>(url);
        setDealersWithRecordings(Array.isArray(response.data?.dealers) ? response.data.dealers : []);
      } else {
        // TypeScript needs this to know response is always assigned
        return;
      }
    } catch (error: any) {
      console.error(`Failed to fetch dealers for ${sectionType}:`, error);
      // Set empty array on error to prevent crashes
      if (sectionType === 'all-dealers') {
        setAllDealers([]);
      } else if (sectionType === 'by-status' && filter) {
        setDealersByStatus(prev => ({ ...prev, [filter as string]: [] }));
      } else if (sectionType === 'by-rating' && filter) {
        setDealersByRating(prev => ({ ...prev, [filter as number]: [] }));
      } else if (sectionType === 'with-notes') {
        setDealersWithNotes([]);
      } else if (sectionType === 'with-photos') {
        setDealersWithPhotos([]);
      } else if (sectionType === 'with-recordings') {
        setDealersWithRecordings([]);
      }
    } finally {
      setLoadingDealers(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleSectionClick = (sectionType: string, filter?: string | number) => {
    const sectionKey = filter ? `${sectionType}-${filter}` : sectionType;
    
    if (expandedSection === sectionKey) {
      // Collapse
      setExpandedSection(null);
    } else {
      // Expand
      setExpandedSection(sectionKey);
      
      // Always fetch dealers when expanding (will use cache if already loaded)
      if (sectionType === 'all-dealers') {
        if (allDealers.length === 0) {
          fetchDealersForSection('all-dealers');
        }
      } else if (sectionType === 'by-status' && filter) {
        if (!dealersByStatus[filter as string] || dealersByStatus[filter as string].length === 0) {
          fetchDealersForSection('by-status', filter);
        }
      } else if (sectionType === 'by-rating' && filter && typeof filter === 'number') {
        if (!dealersByRating[filter] || dealersByRating[filter].length === 0) {
          fetchDealersForSection('by-rating', filter);
        }
      } else if (sectionType === 'with-notes') {
        if (dealersWithNotes.length === 0) {
          fetchDealersForSection('with-notes');
        }
      } else if (sectionType === 'with-photos') {
        if (dealersWithPhotos.length === 0) {
          fetchDealersForSection('with-photos');
        }
      } else if (sectionType === 'with-recordings') {
        if (dealersWithRecordings.length === 0) {
          fetchDealersForSection('with-recordings');
        }
      }
    }
  };

  const handleSearch = (sectionType: string, filter?: string | number) => {
    fetchDealersForSection(sectionType, filter);
  };

  const handleDealerClick = (dealerId: string) => {
    navigate(`/dealers/${dealerId}`);
  };

  const renderDealerList = (dealers: Dealer[], sectionKey: string) => {
    // Check loading state - the loading key format is: sectionType-filter or sectionType-all
    const actualLoadingKey = sectionKey.includes('all-dealers') ? 'all-dealers-all' :
                            sectionKey.includes('with-notes') ? 'with-notes-all' :
                            sectionKey.includes('with-photos') ? 'with-photos-all' :
                            sectionKey.includes('with-recordings') ? 'with-recordings-all' :
                            sectionKey;
    
    if (loadingDealers[actualLoadingKey] || loadingDealers[sectionKey]) {
      return (
        <div className="p-4 text-center text-gray-500">
          Loading dealers...
        </div>
      );
    }

    if (dealers.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No dealers found
        </div>
      );
    }

    return (
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dealers.map((dealer) => (
            <div
              key={dealer.id}
              onClick={() => handleDealerClick(dealer.id)}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="font-semibold text-gray-900">{dealer.companyName}</div>
              {dealer.contactName && (
                <div className="text-sm text-gray-600">{dealer.contactName}</div>
              )}
              {dealer.email && (
                <div className="text-xs text-gray-500">{dealer.email}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Dealers */}
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('all-dealers')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Dealers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalDealers || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedSection === 'all-dealers' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'all-dealers' && (
              <div className="px-6 pb-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search dealers..."
                    value={searchTerms['all-dealers'] || ''}
                    onChange={(e) => {
                      setSearchTerms(prev => ({ ...prev, 'all-dealers': e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch('all-dealers');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSearch('all-dealers')}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                {renderDealerList(allDealers, 'all-dealers-all')}
              </div>
            )}
          </div>

          {/* Total Notes */}
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('with-notes')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Notes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalNotes || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedSection === 'with-notes' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'with-notes' && (
              <div className="px-6 pb-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search dealers with notes..."
                    value={searchTerms['with-notes'] || ''}
                    onChange={(e) => {
                      setSearchTerms(prev => ({ ...prev, 'with-notes': e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch('with-notes');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSearch('with-notes')}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                {renderDealerList(dealersWithNotes, 'with-notes-all')}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('with-photos')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">📷</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Photos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalPhotos || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedSection === 'with-photos' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'with-photos' && (
              <div className="px-6 pb-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search dealers with photos..."
                    value={searchTerms['with-photos'] || ''}
                    onChange={(e) => {
                      setSearchTerms(prev => ({ ...prev, 'with-photos': e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch('with-photos');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSearch('with-photos')}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                {renderDealerList(dealersWithPhotos, 'with-photos-all')}
              </div>
            )}
          </div>

          {/* Recordings */}
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('with-recordings')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-2xl">🎤</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recordings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalRecordings || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedSection === 'with-recordings' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'with-recordings' && (
              <div className="px-6 pb-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search dealers with recordings..."
                    value={searchTerms['with-recordings'] || ''}
                    onChange={(e) => {
                      setSearchTerms(prev => ({ ...prev, 'with-recordings': e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch('with-recordings');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSearch('with-recordings')}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                {renderDealerList(dealersWithRecordings, 'with-recordings-all')}
              </div>
            )}
          </div>
        </div>

        {/* Dealers by Status */}
        {stats?.dealersByStatus && stats.dealersByStatus.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dealers by Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.dealersByStatus.map((statusGroup) => (
                <div key={statusGroup.status} className="bg-white rounded-lg shadow">
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSectionClick('by-status', statusGroup.status)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{statusGroup.status}</p>
                        <p className="text-2xl font-bold text-gray-900">{statusGroup._count}</p>
                      </div>
                      <span className="text-gray-400 text-lg">
                        {expandedSection === `by-status-${statusGroup.status}` ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedSection === `by-status-${statusGroup.status}` && (
                    <div className="px-6 pb-6">
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search dealers..."
                          value={searchTerms[`by-status-${statusGroup.status}`] || ''}
                          onChange={(e) => {
                            setSearchTerms(prev => ({ ...prev, [`by-status-${statusGroup.status}`]: e.target.value }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSearch('by-status', statusGroup.status);
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleSearch('by-status', statusGroup.status)}
                          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Search
                        </button>
                      </div>
                      {renderDealerList(
                        dealersByStatus[statusGroup.status] || [],
                        `by-status-${statusGroup.status}`
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dealers by Rating */}
        {stats?.dealersByRating && stats.dealersByRating.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dealers by Rating</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {stats.dealersByRating.map((ratingGroup) => (
                <div key={ratingGroup.rating} className="bg-white rounded-lg shadow">
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSectionClick('by-rating', ratingGroup.rating)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {ratingGroup.rating} {ratingGroup.rating === 1 ? 'Star' : 'Stars'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{ratingGroup._count}</p>
                      </div>
                      <span className="text-gray-400 text-lg">
                        {expandedSection === `by-rating-${ratingGroup.rating}` ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedSection === `by-rating-${ratingGroup.rating}` && (
                    <div className="px-6 pb-6">
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search dealers..."
                          value={searchTerms[`by-rating-${ratingGroup.rating}`] || ''}
                          onChange={(e) => {
                            setSearchTerms(prev => ({ ...prev, [`by-rating-${ratingGroup.rating}`]: e.target.value }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSearch('by-rating', ratingGroup.rating);
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleSearch('by-rating', ratingGroup.rating)}
                          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Search
                        </button>
                      </div>
                      {renderDealerList(
                        dealersByRating[ratingGroup.rating] || [],
                        `by-rating-${ratingGroup.rating}`
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/capture-lead"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-4">📷</span>
              <h2 className="text-xl font-semibold text-gray-900">Capture Lead</h2>
            </div>
            <p className="text-gray-600">Scan a badge or add a new dealer</p>
          </Link>

          <Link
            to="/dealers"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-4">👥</span>
              <h2 className="text-xl font-semibold text-gray-900">View Dealers</h2>
            </div>
            <p className="text-gray-600">Manage your dealer database</p>
          </Link>

          <Link
            to="/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-4">📊</span>
              <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
            </div>
            <p className="text-gray-600">View analytics and export data</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
