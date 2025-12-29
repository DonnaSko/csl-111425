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

interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  followUpDate: string | null;
  followUp: boolean;
  type: string;
  completed: boolean;
  dealer: {
    id: string;
    companyName: string;
    contactName: string | null;
  } | null;
}

interface EmailFile {
  id: string;
  originalName: string;
  description: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
}

const EmailFilesSection = () => {
  const [files, setFiles] = useState<EmailFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileDescription, setFileDescription] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch email files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (fileDescription) {
        formData.append('description', fileDescription);
      }

      await api.post('/email-files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFileDescription('');
      setShowUploadForm(false);
      fetchFiles();
      alert('File uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      alert(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/email-files/${fileId}`);
      fetchFiles();
      alert('File deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      alert(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Email Files & Catalogs</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Upload PDFs, catalogs, and product sheets to send to dealers
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
            >
              {showUploadForm ? 'Cancel' : '+ Upload File'}
            </button>
          </div>
        </div>

        {showUploadForm && (
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  File Description (Optional)
                </label>
                <input
                  type="text"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="e.g., 2025 Catalog, Product Sheet A"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-100"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Select File (PDF, Word, Excel, Images)
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {uploading && <p className="text-xs sm:text-sm text-gray-500 mt-2">Uploading...</p>}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {loading ? (
            <p className="text-gray-500 text-sm sm:text-base">Loading files...</p>
          ) : files.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
              No files uploaded yet. Click "Upload File" to add catalogs, PDFs, or product sheets.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {files.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{file.originalName}</h4>
                      {file.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{file.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm sm:text-base flex-shrink-0"
                      title="Delete file"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [todos, setTodos] = useState<Todo[]>([]);
  
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
      } else if (sectionType === 'todos') {
        const todosResponse = await api.get<{ todos: Todo[] }>('/reports/dashboard/todos');
        setTodos(Array.isArray(todosResponse.data?.todos) ? todosResponse.data.todos : []);
        return; // Early return since we don't use the response variable for todos
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
      } else if (sectionType === 'todos') {
        setTodos([]);
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
      } else if (sectionType === 'todos') {
        if (todos.length === 0) {
          fetchDealersForSection('todos');
        }
      }
    }
  };

  const handleSearch = (sectionType: string, filter?: string | number) => {
    fetchDealersForSection(sectionType, filter);
  };

  const handleDealerClick = (dealerId: string) => {
    // Validate dealer ID before navigation
    if (!dealerId || dealerId.trim().length === 0) {
      console.error('[DASHBOARD] Invalid dealer ID:', dealerId);
      alert('Invalid dealer ID. Please try again.');
      return;
    }
    
    // Ensure ID is properly trimmed (React Router will handle URL encoding)
    const trimmedId = dealerId.trim();
    const targetUrl = `/dealers/${trimmedId}`;
    
    console.log(`[DASHBOARD] Navigating to dealer:`, {
      originalId: dealerId,
      trimmedId: trimmedId,
      targetUrl: targetUrl
    });
    
    navigate(targetUrl);
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
        <div className="p-4 text-center text-gray-500 text-sm sm:text-base">
          Loading dealers...
        </div>
      );
    }

    if (dealers.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm sm:text-base">
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
              <div className="font-semibold text-gray-900 text-sm sm:text-base break-words">{dealer.companyName}</div>
              {dealer.contactName && (
                <div className="text-xs sm:text-sm text-gray-600 break-words">{dealer.contactName}</div>
              )}
              {dealer.email && (
                <div className="text-xs text-gray-500 break-all">{dealer.email}</div>
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
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h1>
        
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Dealers */}
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('all-dealers')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <span className="text-xl sm:text-2xl">👥</span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Dealers</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.totalDealers || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-base sm:text-lg ml-2 flex-shrink-0">
                  {expandedSection === 'all-dealers' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'all-dealers' && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
                  />
                  <button
                    onClick={() => handleSearch('all-dealers')}
                    className="mt-2 w-full px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('with-notes')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <span className="text-xl sm:text-2xl">📝</span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Notes</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.totalNotes || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-base sm:text-lg ml-2 flex-shrink-0">
                  {expandedSection === 'with-notes' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'with-notes' && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
                  />
                  <button
                    onClick={() => handleSearch('with-notes')}
                    className="mt-2 w-full px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('with-photos')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                    <span className="text-xl sm:text-2xl">📷</span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Photos</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.totalPhotos || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-base sm:text-lg ml-2 flex-shrink-0">
                  {expandedSection === 'with-photos' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'with-photos' && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
                  />
                  <button
                    onClick={() => handleSearch('with-photos')}
                    className="mt-2 w-full px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('with-recordings')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🎤</span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Recordings</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.totalRecordings || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-base sm:text-lg ml-2 flex-shrink-0">
                  {expandedSection === 'with-recordings' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'with-recordings' && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
                  />
                  <button
                    onClick={() => handleSearch('with-recordings')}
                    className="mt-2 w-full px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Search
                  </button>
                </div>
                {renderDealerList(dealersWithRecordings, 'with-recordings-all')}
              </div>
            )}
          </div>
        </div>

        {/* To Do's and Follow Up Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSectionClick('todos')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <span className="text-xl sm:text-2xl">✅</span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">To Do's and Follow Up</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.activeTodos || 0}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-base sm:text-lg ml-2 flex-shrink-0">
                  {expandedSection === 'todos' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSection === 'todos' && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                {loadingDealers['todos-all'] ? (
                  <div className="p-4 text-center text-gray-500 text-sm sm:text-base">
                    Loading todos...
                  </div>
                ) : todos.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm sm:text-base">
                    No pending to-dos or follow-ups
                  </div>
                ) : (
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {todos.map((todo) => {
                        const isPastDue = (todo.dueDate && new Date(todo.dueDate) < new Date()) || 
                                          (todo.followUpDate && new Date(todo.followUpDate) < new Date());
                        return (
                          <div
                            key={todo.id}
                            onClick={() => todo.dealer && handleDealerClick(todo.dealer.id)}
                            className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-colors ${
                              isPastDue 
                                ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start flex-wrap gap-2">
                                  <span className="font-semibold text-gray-900 text-sm sm:text-base break-words">{todo.title}</span>
                                  <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                                    todo.type === 'email' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {todo.type}
                                  </span>
                                  {isPastDue && (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium flex-shrink-0">
                                      PAST DUE
                                    </span>
                                  )}
                                </div>
                                {todo.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{todo.description}</p>
                                )}
                                {todo.dealer && (
                                  <p className="text-xs sm:text-sm text-blue-600 mt-1 break-words">
                                    👤 {todo.dealer.companyName}
                                    {todo.dealer.contactName && ` (${todo.dealer.contactName})`}
                                  </p>
                                )}
                                <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 mt-2 text-xs text-gray-500">
                                  {todo.dueDate && (
                                    <span className={isPastDue ? 'text-red-600 font-medium' : ''}>
                                      Due: {new Date(todo.dueDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
                                  {todo.followUp && todo.followUpDate && (
                                    <span className={isPastDue ? 'text-red-600 font-medium' : ''}>
                                      Follow-up: {new Date(todo.followUpDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Email Files Management Section */}
        <EmailFilesSection />

        {/* Dealers by Status */}
        {stats?.dealersByStatus && stats.dealersByStatus.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Dealers by Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {stats.dealersByStatus.map((statusGroup) => (
                <div key={statusGroup.status} className="bg-white rounded-lg shadow">
                  <div 
                    className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSectionClick('by-status', statusGroup.status)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{statusGroup.status}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{statusGroup._count}</p>
                      </div>
                      <span className="text-gray-400 text-base sm:text-lg ml-2 flex-shrink-0">
                        {expandedSection === `by-status-${statusGroup.status}` ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedSection === `by-status-${statusGroup.status}` && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
                        />
                        <button
                          onClick={() => handleSearch('by-status', statusGroup.status)}
                          className="mt-2 w-full px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Dealers by Rating</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {stats.dealersByRating.map((ratingGroup) => (
                <div key={ratingGroup.rating} className="bg-white rounded-lg shadow">
                  <div 
                    className="p-3 sm:p-4 lg:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSectionClick('by-rating', ratingGroup.rating)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                          {ratingGroup.rating} {ratingGroup.rating === 1 ? 'Star' : 'Stars'}
                        </p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{ratingGroup._count}</p>
                      </div>
                      <span className="text-gray-400 text-sm sm:text-base lg:text-lg self-end sm:self-auto">
                        {expandedSection === `by-rating-${ratingGroup.rating}` ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedSection === `by-rating-${ratingGroup.rating}` && (
                    <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
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
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
                        />
                        <button
                          onClick={() => handleSearch('by-rating', ratingGroup.rating)}
                          className="mt-2 w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link
            to="/capture-lead"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">📷</span>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Capture Lead</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Scan a badge or add a new dealer</p>
          </Link>

          <Link
            to="/dealers"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">👥</span>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">View Dealers</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Manage your dealer database</p>
          </Link>

          <Link
            to="/reports"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">📊</span>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Reports</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600">View analytics and export data</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
