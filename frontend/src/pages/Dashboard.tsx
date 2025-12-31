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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-yellow-50"
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

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  businessPhone?: string | null;
  website?: string | null;
  instagram?: string | null;
  businessDescription?: string | null;
  tagline?: string | null;
  callToAction?: string | null;
  company: {
    id: string;
    name: string;
  };
}

interface BusinessCardHistory {
  id: string;
  companyName: string;
  jobTitle?: string | null;
  businessPhone?: string | null;
  website?: string | null;
  instagram?: string | null;
  businessDescription?: string | null;
  tagline?: string | null;
  callToAction?: string | null;
  changeReason?: string | null;
  changedAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // Track expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedStatCard, setExpandedStatCard] = useState<string | null>(null);
  
  // Business card editing
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [cardFormData, setCardFormData] = useState({
    jobTitle: '',
    businessPhone: '',
    website: '',
    instagram: '',
    businessDescription: '',
    tagline: '',
    callToAction: '',
    changeReason: ''
  });
  const [cardHistory, setCardHistory] = useState<BusinessCardHistory[]>([]);
  const [savingCard, setSavingCard] = useState(false);
  
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
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/me');
        setUserInfo(response.data.user);
        // Initialize form data with current values or defaults
        const user = response.data.user;
        setCardFormData({
          jobTitle: user.jobTitle || 'Designer Focus',
          businessPhone: user.businessPhone || '973-520-7114',
          website: user.website || 'www.CasaBellaOutdoor.com',
          instagram: user.instagram || '@CasaBella_Outdoor',
          businessDescription: user.businessDescription || 'Outdoor Kitchen Cabinetry (Made in USA)',
          tagline: user.tagline || 'Designer Colors • Slab/Flat Panel • Premium Outdoor Living',
          callToAction: user.callToAction || 'Want to become a Dealer? Call today!',
          changeReason: ''
        });
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const fetchCardHistory = async () => {
    try {
      const response = await api.get('/auth/business-card/history');
      setCardHistory(response.data.history);
    } catch (error) {
      console.error('Failed to fetch card history:', error);
    }
  };

  const handleSaveBusinessCard = async () => {
    try {
      setSavingCard(true);
      const response = await api.put('/auth/business-card', cardFormData);
      setUserInfo(response.data.user);
      setIsEditingCard(false);
      alert('Business card updated successfully!');
      // Refresh history
      fetchCardHistory();
      // Reset change reason
      setCardFormData(prev => ({ ...prev, changeReason: '' }));
    } catch (error: any) {
      console.error('Failed to update business card:', error);
      alert(error.response?.data?.error || 'Failed to update business card');
    } finally {
      setSavingCard(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current user info or defaults
    if (userInfo) {
      setCardFormData({
        jobTitle: userInfo.jobTitle || 'Designer Focus',
        businessPhone: userInfo.businessPhone || '973-520-7114',
        website: userInfo.website || 'www.CasaBellaOutdoor.com',
        instagram: userInfo.instagram || '@CasaBella_Outdoor',
        businessDescription: userInfo.businessDescription || 'Outdoor Kitchen Cabinetry (Made in USA)',
        tagline: userInfo.tagline || 'Designer Colors • Slab/Flat Panel • Premium Outdoor Living',
        callToAction: userInfo.callToAction || 'Want to become a Dealer? Call today!',
        changeReason: ''
      });
    }
    setIsEditingCard(false);
  };

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

        {/* 1. SEARCH FOR DEALER - Top Priority */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">🔍</span>
            <h2 className="text-3xl font-bold text-gray-900">Search for Dealer</h2>
          </div>
          <p className="text-lg text-gray-700 mb-4 font-medium">Search by first name, last name, company name, city, or state</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, company, city, or state..."
              value={searchTerms['dashboard-search'] || ''}
              onChange={(e) => setSearchTerms(prev => ({ ...prev, 'dashboard-search': e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const term = searchTerms['dashboard-search'];
                  if (term) {
                    navigate(`/dealers?search=${encodeURIComponent(term)}`);
                  }
                }
              }}
              className="flex-1 px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-base"
            />
            <button
              onClick={() => {
                const term = searchTerms['dashboard-search'];
                if (term) {
                  navigate(`/dealers?search=${encodeURIComponent(term)}`);
                } else {
                  alert('Please enter a search term');
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>

        {/* 2. CAPTURE LEAD - Second Priority */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">📷</span>
            <h2 className="text-3xl font-bold text-gray-900">Scan Tradeshow Badge or Enter New Dealer</h2>
          </div>
          <p className="text-lg text-gray-700 mb-4 font-medium">Scan a tradeshow badge or search for an existing dealer</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Scan Badge Button */}
            <button
              onClick={() => navigate('/capture-lead')}
              className="flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-md text-lg"
            >
              <span className="text-2xl">📸</span>
              <span>Scan Tradeshow Badge</span>
            </button>
            
            {/* Or divider */}
            <div className="flex items-center justify-center text-gray-500 font-medium md:hidden">
              <span>— OR —</span>
            </div>
            
            {/* Search Dealer */}
            <div className="hidden md:flex items-center justify-center text-gray-500 font-medium absolute left-1/2 transform -translate-x-1/2">
              <span>OR</span>
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Search for existing dealer..."
                value={searchTerms['capture-lead-search'] || ''}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, 'capture-lead-search': e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const term = searchTerms['capture-lead-search'];
                    if (term) {
                      navigate(`/dealers?search=${encodeURIComponent(term)}`);
                    }
                  }
                }}
                className="w-full px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-base mb-2"
              />
              <button
                onClick={() => {
                  const term = searchTerms['capture-lead-search'];
                  if (term) {
                    navigate(`/dealers?search=${encodeURIComponent(term)}`);
                  } else {
                    alert('Please enter a dealer name to search');
                  }
                }}
                className="w-full px-4 py-2 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-medium"
              >
                Search Dealer
              </button>
            </div>
          </div>
        </div>

        {/* Electronic Business Card */}
        {userInfo && (
          <div className="mb-6">
            <div 
              className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all p-5 border-2 border-purple-200 hover:border-purple-300"
              onClick={() => setExpandedSection(expandedSection === 'business-card' ? null : 'business-card')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">💼</span>
                  <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                      Electronic Business Card
                    </h2>
                    <p className="text-lg text-gray-700 font-semibold">Share your digital business card instantly</p>
                  </div>
                </div>
                <span className="text-purple-600 text-2xl font-bold">
                  {expandedSection === 'business-card' ? '▼' : '▶'}
                </span>
              </div>
            </div>
          </div>
        )}

        {expandedSection === 'business-card' && userInfo && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-6 border-2 border-purple-100">
            <div className="max-w-3xl mx-auto">
              
              {/* Edit/View Toggle */}
              <div className="flex justify-end mb-4">
                {!isEditingCard ? (
                  <button
                    onClick={() => {
                      setIsEditingCard(true);
                      fetchCardHistory();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                  >
                    <span>✏️</span>
                    <span>Edit Business Card</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBusinessCard}
                      disabled={savingCard}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50"
                    >
                      <span>💾</span>
                      <span>{savingCard ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingCard}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition-colors disabled:opacity-50"
                    >
                      <span>❌</span>
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Business Card Display/Edit */}
              {!isEditingCard ? (
                <>
                  {/* Business Card Display */}
                  <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-1 shadow-2xl">
                    <div className="bg-white rounded-xl p-8">
                      {/* Header Section */}
                      <div className="text-center border-b-2 border-gray-200 pb-6 mb-6">
                        <div className="mb-4">
                          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-lg">
                            {userInfo.firstName.charAt(0)}{userInfo.lastName.charAt(0)}
                          </div>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900 mb-3">
                          {userInfo.firstName} {userInfo.lastName}
                        </h3>
                        <div className="mb-4">
                          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                            {userInfo.company.name}
                          </p>
                          <p className="text-lg text-gray-700 font-semibold italic">{userInfo.jobTitle || 'Designer Focus'}</p>
                        </div>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mt-4">
                          <p className="text-base text-gray-800 font-medium">
                            {userInfo.businessDescription || 'Outdoor Kitchen Cabinetry (Made in USA)'}
                          </p>
                          <p className="text-sm text-indigo-700 mt-1">
                            {userInfo.tagline || 'Designer Colors • Slab/Flat Panel • Premium Outdoor Living'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Contact Information */}
                      <div className="space-y-4 mb-6">
                        {/* Email */}
                        <div className="flex items-center justify-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <span className="text-3xl">📧</span>
                          <div className="text-left flex-1">
                            <p className="text-xs text-gray-600 font-semibold uppercase">Email</p>
                            <a href={`mailto:${userInfo.email}`} className="text-lg text-blue-600 hover:underline font-semibold">
                              {userInfo.email}
                            </a>
                          </div>
                        </div>

                        {/* Phone - Always show with default */}
                        <div className="flex items-center justify-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                          <span className="text-3xl">📞</span>
                          <div className="text-left flex-1">
                            <p className="text-xs text-gray-600 font-semibold uppercase">Phone</p>
                            <a href={`tel:${userInfo.businessPhone || '973-520-7114'}`} className="text-lg text-green-600 hover:underline font-semibold">
                              {userInfo.businessPhone || '973-520-7114'}
                            </a>
                          </div>
                        </div>

                        {/* Website - Always show with default */}
                        <div className="flex items-center justify-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                          <span className="text-3xl">🌐</span>
                          <div className="text-left flex-1">
                            <p className="text-xs text-gray-600 font-semibold uppercase">Website</p>
                            <a 
                              href={
                                userInfo.website 
                                  ? (userInfo.website.startsWith('http') ? userInfo.website : `https://${userInfo.website}`)
                                  : 'https://www.CasaBellaOutdoor.com'
                              } 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-lg text-purple-600 hover:underline font-semibold"
                            >
                              {userInfo.website || 'www.CasaBellaOutdoor.com'}
                            </a>
                          </div>
                        </div>

                        {/* Instagram - Always show with default */}
                        <div className="flex items-center justify-center gap-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                          <span className="text-3xl">📸</span>
                          <div className="text-left flex-1">
                            <p className="text-xs text-gray-600 font-semibold uppercase">Instagram</p>
                            <a 
                              href={`https://www.instagram.com/${(userInfo.instagram || '@CasaBella_Outdoor').replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-lg text-pink-600 hover:underline font-semibold"
                            >
                              {userInfo.instagram || '@CasaBella_Outdoor'}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Call to Action - Always show with default */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-center shadow-lg">
                        <p className="text-2xl font-bold text-white mb-2">
                          {userInfo.callToAction || 'Want to become a Dealer?'}
                        </p>
                        <p className="text-xl text-white font-semibold">
                          Call today! 📞
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        const phone = userInfo.businessPhone || '973-520-7114';
                        const website = userInfo.website || 'www.CasaBellaOutdoor.com';
                        const instagram = userInfo.instagram || '@CasaBella_Outdoor';
                        const jobTitle = userInfo.jobTitle || 'Designer Focus';
                        const description = userInfo.businessDescription || 'Outdoor Kitchen Cabinetry (Made in USA)';
                        const tagline = userInfo.tagline || 'Designer Colors • Slab/Flat Panel • Premium Outdoor Living';
                        
                        const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${userInfo.firstName} ${userInfo.lastName}
N:${userInfo.lastName};${userInfo.firstName};;;
ORG:${userInfo.company.name}
TITLE:${jobTitle}
NOTE:${description} - ${tagline}
EMAIL:${userInfo.email}
TEL;TYPE=WORK,VOICE:${phone}
URL:${website.startsWith('http') ? website : `https://${website}`}
X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/${instagram.replace('@', '')}
END:VCARD`;
                        const blob = new Blob([vCard], { type: 'text/vcard' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${userInfo.firstName}_${userInfo.lastName}.vcf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold text-lg transition-colors shadow-lg"
                    >
                      <span>📥</span>
                      <span>Download vCard</span>
                    </button>
                    <button
                      onClick={() => {
                        const phone = userInfo.businessPhone || '973-520-7114';
                        const website = userInfo.website || 'www.CasaBellaOutdoor.com';
                        const instagram = userInfo.instagram || '@CasaBella_Outdoor';
                        const jobTitle = userInfo.jobTitle || 'Designer Focus';
                        const description = userInfo.businessDescription || 'Outdoor Kitchen Cabinetry (Made in USA)';
                        const callToAction = userInfo.callToAction || 'Want to become a Dealer? Call today!';
                        
                        const shareText = `${userInfo.firstName} ${userInfo.lastName}
${userInfo.company.name} — ${jobTitle}
${description}

📞 ${phone}
📧 ${userInfo.email}
🌐 ${website}
📸 Instagram: ${instagram}

${callToAction}`;
                        if (navigator.share) {
                          navigator.share({
                            title: 'Business Card',
                            text: shareText
                          }).catch(err => console.log('Share failed:', err));
                        } else {
                          navigator.clipboard.writeText(shareText);
                          alert('Business card info copied to clipboard!');
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg hover:from-indigo-700 hover:to-pink-700 font-semibold text-lg transition-colors shadow-lg"
                    >
                      <span>📤</span>
                      <span>Share Card</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Business Card Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={cardFormData.jobTitle}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                        placeholder="e.g., Designer Focus"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
                      <input
                        type="tel"
                        value={cardFormData.businessPhone}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                        placeholder="e.g., 973-520-7114"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={cardFormData.website}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="e.g., www.CasaBellaOutdoor.com"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram</label>
                      <input
                        type="text"
                        value={cardFormData.instagram}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="e.g., @CasaBella_Outdoor"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Description</label>
                      <input
                        type="text"
                        value={cardFormData.businessDescription}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                        placeholder="e.g., Outdoor Kitchen Cabinetry (Made in USA)"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={cardFormData.tagline}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, tagline: e.target.value }))}
                        placeholder="e.g., Designer Colors • Slab/Flat Panel • Premium Outdoor Living"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Call to Action</label>
                      <input
                        type="text"
                        value={cardFormData.callToAction}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, callToAction: e.target.value }))}
                        placeholder="e.g., Want to become a Dealer? Call today!"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Change (Optional)</label>
                      <input
                        type="text"
                        value={cardFormData.changeReason}
                        onChange={(e) => setCardFormData(prev => ({ ...prev, changeReason: e.target.value }))}
                        placeholder="e.g., Changed companies, Updated phone number"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Business Card History */}
              {!isEditingCard && cardHistory.length > 0 && (
                <div className="mt-8">
                  <div 
                    className="bg-gray-50 rounded-lg shadow-md cursor-pointer hover:bg-gray-100 transition-colors p-4"
                    onClick={() => setExpandedStatCard(expandedStatCard === 'card-history' ? null : 'card-history')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📜</span>
                        <h3 className="text-xl font-bold text-gray-900">Business Card History</h3>
                        <span className="text-sm text-gray-600">({cardHistory.length} changes)</span>
                      </div>
                      <span className="text-gray-600 text-xl font-bold">
                        {expandedStatCard === 'card-history' ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {expandedStatCard === 'card-history' && (
                    <div className="mt-4 space-y-4">
                      {cardHistory.map((record) => (
                        <div key={record.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-lg font-bold text-gray-900">{record.companyName}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(record.changedAt).toLocaleString()}
                              </p>
                            </div>
                            {record.changeReason && (
                              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-semibold">
                                {record.changeReason}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {record.jobTitle && (
                              <div><span className="font-semibold">Title:</span> {record.jobTitle}</div>
                            )}
                            {record.businessPhone && (
                              <div><span className="font-semibold">Phone:</span> {record.businessPhone}</div>
                            )}
                            {record.website && (
                              <div><span className="font-semibold">Website:</span> {record.website}</div>
                            )}
                            {record.instagram && (
                              <div><span className="font-semibold">Instagram:</span> {record.instagram}</div>
                            )}
                            {record.businessDescription && (
                              <div className="md:col-span-2"><span className="font-semibold">Description:</span> {record.businessDescription}</div>
                            )}
                            {record.tagline && (
                              <div className="md:col-span-2"><span className="font-semibold">Tagline:</span> {record.tagline}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid - Collapsible Accordion */}
        <div className="mb-6">
          <div 
            className="bg-blue-50 rounded-lg shadow-md cursor-pointer hover:bg-blue-100 transition-colors p-5"
            onClick={() => setExpandedSection(expandedSection === 'stats-grid' ? null : 'stats-grid')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">📊</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dealer Stats</h2>
                  <p className="text-lg text-gray-700 font-medium">View detailed dealer metrics</p>
                </div>
              </div>
              <span className="text-gray-600 text-2xl font-bold">
                {expandedSection === 'stats-grid' ? '▼' : '▶'}
              </span>
            </div>
          </div>
        </div>

        {expandedSection === 'stats-grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Dealers - Pale Green */}
          <div className="bg-green-50 rounded-lg shadow-md border-2 border-green-100">
            <div 
              className="p-5 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => {
                setExpandedStatCard(expandedStatCard === 'all-dealers' ? null : 'all-dealers');
                if (expandedStatCard !== 'all-dealers') {
                  fetchDealersForSection('all-dealers');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-3 bg-green-200 rounded-lg flex-shrink-0">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className="text-base font-semibold text-gray-700 truncate">Total Dealers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalDealers || 0}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                  {expandedStatCard === 'all-dealers' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedStatCard === 'all-dealers' && (
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
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

          {/* Total Notes - Pale Yellow */}
          <div className="bg-yellow-50 rounded-lg shadow-md border-2 border-yellow-100">
            <div 
              className="p-5 cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={() => {
                setExpandedStatCard(expandedStatCard === 'with-notes' ? null : 'with-notes');
                if (expandedStatCard !== 'with-notes') {
                  fetchDealersForSection('with-notes');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-3 bg-yellow-200 rounded-lg flex-shrink-0">
                    <span className="text-3xl">📝</span>
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className="text-base font-semibold text-gray-700 truncate">Total Notes</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalNotes || 0}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                  {expandedStatCard === 'with-notes' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedStatCard === 'with-notes' && (
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
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

          {/* Photos - Pale Orange */}
          <div className="bg-orange-50 rounded-lg shadow-md border-2 border-orange-100">
            <div 
              className="p-5 cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => {
                setExpandedStatCard(expandedStatCard === 'with-photos' ? null : 'with-photos');
                if (expandedStatCard !== 'with-photos') {
                  fetchDealersForSection('with-photos');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-3 bg-orange-200 rounded-lg flex-shrink-0">
                    <span className="text-3xl">📷</span>
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className="text-base font-semibold text-gray-700 truncate">Photos</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalPhotos || 0}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                  {expandedStatCard === 'with-photos' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedStatCard === 'with-photos' && (
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
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

          {/* Recordings - Pale Purple */}
          <div className="bg-purple-50 rounded-lg shadow-md border-2 border-purple-100">
            <div 
              className="p-5 cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={() => {
                setExpandedStatCard(expandedStatCard === 'with-recordings' ? null : 'with-recordings');
                if (expandedStatCard !== 'with-recordings') {
                  fetchDealersForSection('with-recordings');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-3 bg-purple-200 rounded-lg flex-shrink-0">
                    <span className="text-3xl">🎤</span>
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className="text-base font-semibold text-gray-700 truncate">Recordings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalRecordings || 0}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                  {expandedStatCard === 'with-recordings' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedStatCard === 'with-recordings' && (
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
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
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

          {/* To Do's and Follow Up - Pale Pink */}
          <div className="bg-pink-50 rounded-lg shadow-md border-2 border-pink-100">
            <div 
              className="p-5 cursor-pointer hover:bg-pink-100 transition-colors"
              onClick={() => {
                setExpandedStatCard(expandedStatCard === 'todos' ? null : 'todos');
                if (expandedStatCard !== 'todos') {
                  fetchDealersForSection('todos');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="p-3 bg-pink-200 rounded-lg flex-shrink-0">
                    <span className="text-3xl">✅</span>
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className="text-base font-semibold text-gray-700">To Do's & Follow Up</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.activeTodos || 0}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                  {expandedStatCard === 'todos' ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedStatCard === 'todos' && (
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

          {/* Dealers by Status - Nested Accordion */}
          {stats?.dealersByStatus && stats.dealersByStatus.length > 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="bg-indigo-50 rounded-lg shadow-md border-2 border-indigo-100">
                <div 
                  className="p-5 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => {
                    setExpandedStatCard(expandedStatCard === 'dealers-by-status' ? null : 'dealers-by-status');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="p-3 bg-indigo-200 rounded-lg flex-shrink-0">
                        <span className="text-3xl">📋</span>
                      </div>
                      <div className="ml-4 min-w-0">
                        <p className="text-base font-semibold text-gray-700 truncate">Dealers by Status</p>
                        <p className="text-sm text-gray-600">View dealers grouped by status</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                      {expandedStatCard === 'dealers-by-status' ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                
                {expandedStatCard === 'dealers-by-status' && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.dealersByStatus.map((statusGroup, index) => {
                        // Assign complementary pale colors
                        const statusColors = [
                          { bg: 'bg-rose-50', border: 'border-rose-100', hover: 'hover:bg-rose-100', icon: 'bg-rose-200' },
                          { bg: 'bg-cyan-50', border: 'border-cyan-100', hover: 'hover:bg-cyan-100', icon: 'bg-cyan-200' },
                          { bg: 'bg-amber-50', border: 'border-amber-100', hover: 'hover:bg-amber-100', icon: 'bg-amber-200' },
                          { bg: 'bg-emerald-50', border: 'border-emerald-100', hover: 'hover:bg-emerald-100', icon: 'bg-emerald-200' },
                          { bg: 'bg-violet-50', border: 'border-violet-100', hover: 'hover:bg-violet-100', icon: 'bg-violet-200' },
                          { bg: 'bg-lime-50', border: 'border-lime-100', hover: 'hover:bg-lime-100', icon: 'bg-lime-200' },
                        ];
                        const colorSet = statusColors[index % statusColors.length];
                        
                        return (
                          <div key={statusGroup.status} className={`${colorSet.bg} rounded-lg shadow border-2 ${colorSet.border}`}>
                            <div 
                              className={`p-4 cursor-pointer ${colorSet.hover} transition-colors`}
                              onClick={() => handleSectionClick('by-status', statusGroup.status)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-700 truncate">{statusGroup.status}</p>
                                  <p className="text-2xl font-bold text-gray-900">{statusGroup._count}</p>
                                </div>
                                <span className="text-gray-400 text-lg ml-2 flex-shrink-0">
                                  {expandedSection === `by-status-${statusGroup.status}` ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>
                            
                            {expandedSection === `by-status-${statusGroup.status}` && (
                              <div className="px-4 pb-4">
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
                                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
                                  />
                                  <button
                                    onClick={() => handleSearch('by-status', statusGroup.status)}
                                    className="mt-2 w-full px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dealers by Rating - Nested Accordion */}
          {stats?.dealersByRating && stats.dealersByRating.length > 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="bg-teal-50 rounded-lg shadow-md border-2 border-teal-100">
                <div 
                  className="p-5 cursor-pointer hover:bg-teal-100 transition-colors"
                  onClick={() => {
                    setExpandedStatCard(expandedStatCard === 'dealers-by-rating' ? null : 'dealers-by-rating');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="p-3 bg-teal-200 rounded-lg flex-shrink-0">
                        <span className="text-3xl">⭐</span>
                      </div>
                      <div className="ml-4 min-w-0">
                        <p className="text-base font-semibold text-gray-700 truncate">Dealers by Rating</p>
                        <p className="text-sm text-gray-600">View dealers grouped by star rating</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-xl ml-2 flex-shrink-0">
                      {expandedStatCard === 'dealers-by-rating' ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                
                {expandedStatCard === 'dealers-by-rating' && (
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {stats.dealersByRating.map((ratingGroup, index) => {
                        // Assign complementary pale colors for ratings
                        const ratingColors = [
                          { bg: 'bg-yellow-50', border: 'border-yellow-100', hover: 'hover:bg-yellow-100', icon: 'bg-yellow-200' },
                          { bg: 'bg-orange-50', border: 'border-orange-100', hover: 'hover:bg-orange-100', icon: 'bg-orange-200' },
                          { bg: 'bg-red-50', border: 'border-red-100', hover: 'hover:bg-red-100', icon: 'bg-red-200' },
                          { bg: 'bg-blue-50', border: 'border-blue-100', hover: 'hover:bg-blue-100', icon: 'bg-blue-200' },
                          { bg: 'bg-green-50', border: 'border-green-100', hover: 'hover:bg-green-100', icon: 'bg-green-200' },
                        ];
                        const colorSet = ratingColors[index % ratingColors.length];
                        
                        return (
                          <div key={ratingGroup.rating} className={`${colorSet.bg} rounded-lg shadow border-2 ${colorSet.border}`}>
                            <div 
                              className={`p-3 cursor-pointer ${colorSet.hover} transition-colors`}
                              onClick={() => handleSectionClick('by-rating', ratingGroup.rating)}
                            >
                              <div className="flex flex-col gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-700 truncate">
                                    {ratingGroup.rating} {ratingGroup.rating === 1 ? 'Star' : 'Stars'}
                                  </p>
                                  <p className="text-2xl font-bold text-gray-900">{ratingGroup._count}</p>
                                </div>
                                <span className="text-gray-400 text-lg self-end">
                                  {expandedSection === `by-rating-${ratingGroup.rating}` ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>
                            
                            {expandedSection === `by-rating-${ratingGroup.rating}` && (
                              <div className="px-3 pb-3">
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
                                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
                                  />
                                  <button
                                    onClick={() => handleSearch('by-rating', ratingGroup.rating)}
                                    className="mt-2 w-full px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Email Files Management Section */}
        <EmailFilesSection />

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
