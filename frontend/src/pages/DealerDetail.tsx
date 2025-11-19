import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

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
}

const DealerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchDealer();
    }
  }, [id]);

  const fetchDealer = async () => {
    try {
      const response = await api.get(`/dealers/${id}`);
      setDealer(response.data);
      setRating(response.data.rating || 0);
    } catch (error) {
      console.error('Failed to fetch dealer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;

    try {
      await api.post(`/dealers/${id}/notes`, { content: noteContent });
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
      await api.put(`/dealers/${id}/rating`, { rating: newRating });
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
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
            {dealer.buyingGroup && (
              <div>
                <span className="text-sm font-medium text-gray-600">Buying Group:</span>
                <p className="text-gray-900">{dealer.buyingGroup}</p>
              </div>
            )}
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
        </div>
      </div>
    </Layout>
  );
};

export default DealerDetail;

