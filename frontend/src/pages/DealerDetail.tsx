import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface BuyingGroupHistory {
  id: string;
  startDate: string;
  endDate: string | null;
  buyingGroup: {
    id: string;
    name: string;
  };
}

interface DealerDetail {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  address: string | null;
  buyingGroup: string | null;
  status: string;
  rating: number | null;
  dealerNotes: Array<{ id: string; content: string; createdAt: string }>;
  photos: Array<{ id: string; originalName: string; type: string; createdAt: string }>;
  voiceRecordings: Array<{ id: string; originalName: string; createdAt: string }>;
  todos: Array<{ id: string; title: string; dueDate: string | null }>;
  buyingGroupHistory?: BuyingGroupHistory[];
}

const DealerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [rating, setRating] = useState(0);
  const [showBuyingGroupModal, setShowBuyingGroupModal] = useState(false);
  const [buyingGroups, setBuyingGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBuyingGroupId, setSelectedBuyingGroupId] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchDealer();
      fetchBuyingGroups();
    }
  }, [id]);

  const fetchDealer = async () => {
    if (!id) {
      console.error('[DEALER DETAIL] No dealer ID provided');
      setLoading(false);
      return;
    }
    
    // Validate ID format (should be a non-empty string)
    const trimmedId = id.trim();
    if (!trimmedId || trimmedId.length === 0) {
      console.error('[DEALER DETAIL] Invalid dealer ID (empty or whitespace)');
      alert('Invalid dealer ID. Please try again.');
      navigate('/dealers');
      setLoading(false);
      return;
    }
    
    try {
      // Properly encode the dealer ID for the URL
      const encodedId = encodeURIComponent(trimmedId);
      const apiUrl = `/dealers/${encodedId}`;
      
      console.log(`[DEALER DETAIL] Fetching dealer:`, {
        originalId: id,
        trimmedId: trimmedId,
        encodedId: encodedId,
        apiUrl: apiUrl,
        fullUrl: `${api.defaults.baseURL}${apiUrl}`
      });
      
      const response = await api.get(apiUrl);
      
      console.log('[DEALER DETAIL] Dealer fetched successfully:', {
        dealerId: response.data?.id,
        companyName: response.data?.companyName,
        hasNotes: !!response.data?.dealerNotes,
        notesCount: response.data?.dealerNotes?.length || 0
      });
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      setDealer(response.data);
      setRating(response.data.rating || 0);
    } catch (error: any) {
      // Comprehensive error logging
      const errorDetails = {
        id: id,
        trimmedId: trimmedId,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        code: error.code,
        name: error.name,
        stack: error.stack
      };
      
      console.error('[DEALER DETAIL] Failed to fetch dealer:', error);
      console.error('[DEALER DETAIL] Complete error details:', errorDetails);
      
      // Handle different error types with specific messages
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        alert('Request timed out. Please check your connection and try again.');
        return;
      }
      
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.error('[DEALER DETAIL] Network error - no response from server');
        alert('Network error. Please check your internet connection and try again.');
        return;
      }
      
      if (error.response?.status === 404) {
        console.error('[DEALER DETAIL] Dealer not found (404)');
        alert(`Dealer not found (ID: ${trimmedId}). It may have been deleted or you may not have access to it.`);
        navigate('/dealers');
      } else if (error.response?.status === 403) {
        console.error('[DEALER DETAIL] Access denied (403)');
        alert('You do not have access to this dealer.');
        navigate('/dealers');
      } else if (error.response?.status === 401) {
        console.error('[DEALER DETAIL] Authentication failed (401)');
        alert('Your session has expired. Please log in again.');
        // Auth interceptor should handle redirect
      } else if (error.response?.status === 500) {
        // Server error - show backend error message if available
        const errorMsg = error.response?.data?.error || 'Server error. Please try again later.';
        console.error('[DEALER DETAIL] Server error (500):', error.response?.data);
        alert(`Server error: ${errorMsg}`);
      } else {
        // Show more detailed error message
        const errorMsg = error.response?.data?.error || error.message || 'Failed to load dealer. Please try again.';
        console.error('[DEALER DETAIL] Unexpected error:', errorMsg);
        alert(`Error: ${errorMsg}`);
        // Don't navigate away on generic errors - let user try again
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;

    try {
      const encodedId = encodeURIComponent(id.trim());
      await api.post(`/dealers/${encodedId}/notes`, { content: noteContent });
      setNoteContent('');
      fetchDealer();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    }
  };

  const handleRatingChange = async (newRating: number) => {
    if (!id) return;
    setRating(newRating);
    try {
      const encodedId = encodeURIComponent(id.trim());
      await api.put(`/dealers/${encodedId}/rating`, { rating: newRating });
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const fetchBuyingGroups = async () => {
    try {
      const response = await api.get('/buying-groups');
      setBuyingGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch buying groups:', error);
    }
  };

  const handleAssignBuyingGroup = async () => {
    if (!id || !selectedBuyingGroupId) return;

    try {
      const encodedBuyingGroupId = encodeURIComponent(selectedBuyingGroupId.trim());
      await api.post(`/buying-groups/${encodedBuyingGroupId}/assign`, { dealerId: id.trim() });
      setShowBuyingGroupModal(false);
      setSelectedBuyingGroupId('');
      fetchDealer();
    } catch (error: any) {
      console.error('Failed to assign buying group:', error);
      alert(error.response?.data?.error || 'Failed to assign buying group');
    }
  };

  const handleRemoveBuyingGroup = async (buyingGroupId: string) => {
    if (!id) return;

    if (!confirm('Remove this dealer from the buying group? This will be recorded in history.')) {
      return;
    }

    try {
      const encodedBuyingGroupId = encodeURIComponent(buyingGroupId.trim());
      const encodedDealerId = encodeURIComponent(id.trim());
      await api.delete(`/buying-groups/${encodedBuyingGroupId}/assign/${encodedDealerId}`);
      fetchDealer();
    } catch (error: any) {
      console.error('Failed to remove buying group:', error);
      alert(error.response?.data?.error || 'Failed to remove buying group');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (!dealer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Dealer not found</p>
          <button
            onClick={() => navigate('/dealers')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Dealers
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <button
          onClick={() => navigate('/dealers')}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to List
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dealer.companyName}</h1>
              {dealer.contactName && (
                <p className="text-lg text-gray-600 mt-1">{dealer.contactName}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm rounded-full ${
                dealer.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : dealer.status === 'Prospect'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {dealer.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {dealer.email && (
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{dealer.email}</p>
              </div>
            )}
            {dealer.phone && (
              <div>
                <span className="text-sm font-medium text-gray-600">Phone:</span>
                <p className="text-gray-900">{dealer.phone}</p>
              </div>
            )}
            {dealer.city && (
              <div>
                <span className="text-sm font-medium text-gray-600">City:</span>
                <p className="text-gray-900">{dealer.city}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-600">Buying Group:</span>
              <div className="flex items-center gap-2 mt-1">
                {dealer.buyingGroup ? (
                  <>
                    <p className="text-gray-900">{dealer.buyingGroup}</p>
                    {dealer.buyingGroupHistory && dealer.buyingGroupHistory.length > 0 && (
                      <button
                        onClick={() => {
                          const current = dealer.buyingGroupHistory?.find(
                            h => h.buyingGroup.name === dealer.buyingGroup && !h.endDate
                          );
                          if (current) {
                            handleRemoveBuyingGroup(current.buyingGroup.id);
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
                <button
                  onClick={() => setShowBuyingGroupModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {dealer.buyingGroup ? 'Change' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Lead Quality Rating */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Lead Quality Rating</h3>
            <p className="text-sm text-gray-600 mb-3">
              How would you rate this dealer as a lead from your conversation?
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="text-2xl focus:outline-none"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notes ({dealer.dealerNotes.length})
            </h3>
            <div className="mb-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-2">
              {dealer.dealerNotes.map((note) => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          {dealer.photos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Photos ({dealer.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dealer.photos.map((photo) => (
                  <div key={photo.id} className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">{photo.originalName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Recordings Section */}
          {dealer.voiceRecordings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Voice Recordings ({dealer.voiceRecordings.length})
              </h3>
              <div className="space-y-2">
                {dealer.voiceRecordings.map((recording) => (
                  <div key={recording.id} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{recording.originalName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(recording.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buying Group History */}
          {dealer.buyingGroupHistory && dealer.buyingGroupHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Buying Group History
              </h3>
              <div className="space-y-2">
                {dealer.buyingGroupHistory.map((history) => (
                  <div key={history.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{history.buyingGroup.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(history.startDate)}
                          {history.endDate ? ` - ${formatDate(history.endDate)}` : ' - Present'}
                        </p>
                      </div>
                      {!history.endDate && (
                        <button
                          onClick={() => handleRemoveBuyingGroup(history.buyingGroup.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buying Group Modal */}
      {showBuyingGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Assign Buying Group</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Buying Group
              </label>
              <select
                value={selectedBuyingGroupId}
                onChange={(e) => setSelectedBuyingGroupId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a buying group --</option>
                {buyingGroups.map((bg) => (
                  <option key={bg.id} value={bg.id}>
                    {bg.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowBuyingGroupModal(false);
                  setSelectedBuyingGroupId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignBuyingGroup}
                disabled={!selectedBuyingGroupId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DealerDetail;

