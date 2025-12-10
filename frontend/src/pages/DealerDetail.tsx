import { useEffect, useState, useRef, useCallback } from 'react';
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

interface Product {
  id: string;
  name: string;
}

interface PrivacyPermission {
  id: string;
  permission: string;
  granted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrivacyPermissionHistory {
  id: string;
  permission: string;
  granted: boolean;
  action: string;
  changedData: any;
  createdAt: string;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  type: string;
  emailSent: boolean;
  emailSentDate: string | null;
  emailContent: string | null;
  followUp: boolean;
  followUpDate: string | null;
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
  todos: Todo[];
  buyingGroupHistory?: BuyingGroupHistory[];
  products?: Array<{ product: Product }>;
  privacyPermissions?: PrivacyPermission[];
  privacyPermissionHistory?: PrivacyPermissionHistory[];
}

interface AccordionSection {
  id: string;
  title: string;
  expanded: boolean;
}

const DealerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [showBuyingGroupModal, setShowBuyingGroupModal] = useState(false);
  const [buyingGroups, setBuyingGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBuyingGroupId, setSelectedBuyingGroupId] = useState<string>('');
  const [showCreateBuyingGroup, setShowCreateBuyingGroup] = useState(false);
  const [newBuyingGroupName, setNewBuyingGroupName] = useState('');
  
  // Accordion state - all collapsed by default
  const [sections, setSections] = useState<AccordionSection[]>([
    { id: 'info', title: 'Dealer Information', expanded: false },
    { id: 'products', title: 'Products', expanded: false },
    { id: 'notes', title: 'Notes', expanded: false },
    { id: 'photos', title: 'Business Cards & Photos', expanded: false },
    { id: 'badges', title: 'Badge Scanning', expanded: false },
    { id: 'todos', title: 'Tasks & Emails', expanded: false },
    { id: 'privacy', title: 'Privacy Permissions', expanded: false },
  ]);

  // Auto-save debounce refs
  const autoSaveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  // Form state
  const [dealerInfo, setDealerInfo] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    address: '',
    status: 'Prospect',
  });

  const [noteContent, setNoteContent] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    type: 'general',
    dueDate: '',
    followUp: false,
    followUpDate: '',
  });

  // Privacy permissions
  const [privacyPermissions, setPrivacyPermissions] = useState<{ [key: string]: boolean }>({
    marketing_emails: false,
    data_sharing: false,
    phone_contact: false,
    snail_mail: false,
    badge_photo: false,
    audio_notes: false,
  });

  useEffect(() => {
    if (id) {
      fetchDealer();
      fetchBuyingGroups();
    }
  }, [id]);

  const fetchDealer = async () => {
    if (!id) return;
    
    const trimmedId = id.trim();
    if (!trimmedId || !trimmedId.match(/^c[a-z0-9]{24}$/i)) {
      alert('Invalid dealer ID');
      navigate('/dealers');
      return;
    }
    
    try {
      const response = await api.get(`/dealers/${trimmedId}`);
      const dealerData = response.data;
      
      setDealer(dealerData);
      setRating(dealerData.rating || 0);
      
      // Set dealer info for editing
      setDealerInfo({
        companyName: dealerData.companyName || '',
        contactName: dealerData.contactName || '',
        email: dealerData.email || '',
        phone: dealerData.phone || '',
        city: dealerData.city || '',
        state: dealerData.state || '',
        zip: dealerData.zip || '',
        country: dealerData.country || '',
        address: dealerData.address || '',
        status: dealerData.status || 'Prospect',
      });

      // Set privacy permissions
      if (dealerData.privacyPermissions) {
        const perms: { [key: string]: boolean } = {};
        dealerData.privacyPermissions.forEach((p: PrivacyPermission) => {
          perms[p.permission] = p.granted;
        });
        setPrivacyPermissions(prev => ({ ...prev, ...perms }));
      }
    } catch (error: any) {
      console.error('Failed to fetch dealer:', error);
      if (error.response?.status === 404) {
        alert('Dealer not found');
        navigate('/dealers');
      }
    } finally {
      setLoading(false);
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

  // Auto-save function with 2 second debounce
  const autoSave = useCallback((field: string, _value: any, saveFn: () => Promise<void>) => {
    // Clear existing timer
    if (autoSaveTimers.current[field]) {
      clearTimeout(autoSaveTimers.current[field]);
    }

    // Set saving state
    setSaving(prev => ({ ...prev, [field]: true }));

    // Set new timer
    autoSaveTimers.current[field] = setTimeout(async () => {
      try {
        await saveFn();
      } catch (error) {
        console.error(`Auto-save failed for ${field}:`, error);
      } finally {
        setSaving(prev => ({ ...prev, [field]: false }));
      }
    }, 2000);
  }, []);

  const handleDealerInfoChange = (field: string, value: string) => {
    setDealerInfo(prev => ({ ...prev, [field]: value }));
    
    autoSave(`dealer_${field}`, value, async () => {
      await api.put(`/dealers/${id}`, { [field]: value });
    });
  };

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    try {
      await api.put(`/dealers/${id}/rating`, { rating: newRating });
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
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

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/dealers/${id}/notes/${noteId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handlePhotoUpload = async (file: File, type: string = 'business_card') => {
    if (!id) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);

    try {
      await api.post(`/uploads/photo/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.delete(`/uploads/photo/${photoId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !id) return;

    try {
      await api.post(`/dealers/${id}/products`, { productName: newProductName.trim() });
      setNewProductName('');
      fetchDealer();
    } catch (error: any) {
      console.error('Failed to add product:', error);
      alert(error.response?.data?.error || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Remove this product?')) return;
    try {
      await api.delete(`/dealers/${id}/products/${productId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to remove product:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim() || !id) return;

    try {
      await api.post('/todos', {
        ...newTodo,
        dealerId: id,
        dueDate: newTodo.dueDate || null,
        followUpDate: newTodo.followUpDate || null,
      });
      setNewTodo({
        title: '',
        description: '',
        type: 'general',
        dueDate: '',
        followUp: false,
        followUpDate: '',
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('Failed to add task');
    }
  };

  const handleUpdateTodo = async (todoId: string, updates: Partial<Todo>) => {
    try {
      await api.put(`/todos/${todoId}`, updates);
      fetchDealer();
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/todos/${todoId}`);
      fetchDealer();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handlePrivacyPermissionChange = async (permission: string, granted: boolean) => {
    if (!id) return;

    setPrivacyPermissions(prev => ({ ...prev, [permission]: granted }));

    try {
      await api.put(`/dealers/${id}/privacy-permissions`, {
        permission,
        granted,
        action: granted ? 'granted' : 'revoked'
      });
      fetchDealer();
    } catch (error) {
      console.error('Failed to update privacy permission:', error);
    }
  };

  const handleAssignBuyingGroup = async () => {
    if (!id || !selectedBuyingGroupId) return;

    try {
      await api.post(`/buying-groups/${selectedBuyingGroupId}/assign`, { dealerId: id });
      setShowBuyingGroupModal(false);
      setSelectedBuyingGroupId('');
      setShowCreateBuyingGroup(false);
      setNewBuyingGroupName('');
      fetchDealer();
      fetchBuyingGroups(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to assign buying group:', error);
      alert(error.response?.data?.error || 'Failed to assign buying group');
    }
  };

  const handleCreateBuyingGroup = async () => {
    if (!newBuyingGroupName.trim()) {
      alert('Please enter a buying group name');
      return;
    }

    try {
      const response = await api.post('/buying-groups', { name: newBuyingGroupName.trim() });
      // Add the new buying group to the list
      setBuyingGroups([...buyingGroups, response.data]);
      // Automatically select the newly created buying group
      setSelectedBuyingGroupId(response.data.id);
      setShowCreateBuyingGroup(false);
      setNewBuyingGroupName('');
    } catch (error: any) {
      console.error('Failed to create buying group:', error);
      alert(error.response?.data?.error || 'Failed to create buying group');
    }
  };

  const handleRemoveBuyingGroup = async () => {
    if (!id || !dealer || !dealer.buyingGroup) return;

    const buyingGroupName = dealer.buyingGroup;
    const buyingGroupHistory = dealer.buyingGroupHistory;

    // Find the current buying group ID
    const currentHistory = buyingGroupHistory?.find(
      h => h.buyingGroup.name === buyingGroupName && !h.endDate
    );

    if (!currentHistory) {
      alert('Could not find current buying group assignment');
      return;
    }

    if (!confirm(`Remove this dealer from "${buyingGroupName}"? This will be recorded in history.`)) {
      return;
    }

    try {
      await api.delete(`/buying-groups/${currentHistory.buyingGroup.id}/assign/${id}`);
      setShowBuyingGroupModal(false);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const AccordionSection = ({ section }: { section: AccordionSection }) => {
    const isExpanded = sections.find(s => s.id === section.id)?.expanded || false;
    
    return (
      <button
        onClick={() => toggleSection(section.id)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-semibold text-gray-900">{section.title}</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
    );
  };

  return (
    <Layout>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dealers')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{dealer.companyName}</h1>
                {dealer.contactName && (
                  <p className="text-gray-600">{dealer.contactName}</p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Rating */}
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
              
              {/* Status Badge */}
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Dealer Information Section */}
        <div className="mb-4">
          <AccordionSection section={sections[0]} />
          {sections[0].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={dealerInfo.companyName}
                    onChange={(e) => handleDealerInfoChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {saving['dealer_companyName'] && <span className="text-xs text-gray-500">Saving...</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={dealerInfo.contactName}
                    onChange={(e) => handleDealerInfoChange('contactName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={dealerInfo.email}
                    onChange={(e) => handleDealerInfoChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={dealerInfo.phone}
                    onChange={(e) => handleDealerInfoChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={dealerInfo.address}
                    onChange={(e) => handleDealerInfoChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={dealerInfo.city}
                    onChange={(e) => handleDealerInfoChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={dealerInfo.state}
                    onChange={(e) => handleDealerInfoChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input
                    type="text"
                    value={dealerInfo.zip}
                    onChange={(e) => handleDealerInfoChange('zip', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={dealerInfo.country}
                    onChange={(e) => handleDealerInfoChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={dealerInfo.status}
                    onChange={(e) => handleDealerInfoChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buying Group</label>
                  <div className="flex items-center gap-2">
                    {dealer.buyingGroup ? (
                      <span className="text-gray-900">{dealer.buyingGroup}</span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                    <button
                      onClick={() => setShowBuyingGroupModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {dealer.buyingGroup ? 'Change' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="mb-4">
          <AccordionSection section={sections[1]} />
          {sections[1].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Enter product name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                />
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
              <div className="space-y-2">
                {dealer.products && dealer.products.length > 0 ? (
                  dealer.products.map((dp) => (
                    <div key={dp.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{dp.product.name}</span>
                      <button
                        onClick={() => handleDeleteProduct(dp.product.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No products added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="mb-4">
          <AccordionSection section={sections[2]} />
          {sections[2].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
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
                    <div className="flex justify-between items-start">
                      <p className="text-gray-900 flex-1">{note.content}</p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Business Cards & Photos Section */}
        <div className="mb-4">
          <AccordionSection section={sections[3]} />
          {sections[3].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Business Card</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, 'business_card_front');
                    }}
                    className="hidden"
                    id="business-card-front"
                  />
                  <label
                    htmlFor="business-card-front"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Front
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, 'business_card_back');
                    }}
                    className="hidden"
                    id="business-card-back"
                  />
                  <label
                    htmlFor="business-card-back"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Back
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dealer.photos.filter(p => p.type.includes('business_card')).map((photo) => (
                  <div key={photo.id} className="bg-gray-100 rounded-lg p-4 text-center relative">
                    <p className="text-sm text-gray-600">{photo.originalName}</p>
                    <p className="text-xs text-gray-500 mt-1">{photo.type}</p>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badge Scanning Section */}
        <div className="mb-4">
          <AccordionSection section={sections[4]} />
          {sections[4].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Badge Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file, 'badge');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dealer.photos.filter(p => p.type === 'badge').map((photo) => (
                  <div key={photo.id} className="bg-gray-100 rounded-lg p-4 text-center relative">
                    <p className="text-sm text-gray-600">{photo.originalName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(photo.createdAt)}</p>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks & Emails Section */}
        <div className="mb-4">
          <AccordionSection section={sections[5]} />
          {sections[5].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Add New Task</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    placeholder="Task title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                  <select
                    value={newTodo.type}
                    onChange={(e) => setNewTodo({ ...newTodo, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="general">General Task</option>
                    <option value="email">Email</option>
                    <option value="snail_mail">Snail Mail</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Due Date"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newTodo.followUp}
                        onChange={(e) => setNewTodo({ ...newTodo, followUp: e.target.checked })}
                      />
                      Follow-up
                    </label>
                  </div>
                  {newTodo.followUp && (
                    <input
                      type="date"
                      value={newTodo.followUpDate}
                      onChange={(e) => setNewTodo({ ...newTodo, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Follow-up Date"
                    />
                  )}
                  <button
                    onClick={handleAddTodo}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Task
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {dealer.todos.map((todo) => (
                  <div key={todo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={(e) => handleUpdateTodo(todo.id, { completed: e.target.checked })}
                          />
                          <span className={`font-semibold ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.title}
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {todo.type}
                          </span>
                        </div>
                        {todo.description && (
                          <p className="text-gray-600 mt-1">{todo.description}</p>
                        )}
                        {todo.type === 'email' && todo.emailSent && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-sm text-green-800">
                              Email sent: {todo.emailSentDate ? formatDate(todo.emailSentDate) : 'N/A'}
                            </p>
                            {todo.emailContent && (
                              <p className="text-xs text-gray-600 mt-1">{todo.emailContent}</p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {todo.dueDate && <span>Due: {formatDate(todo.dueDate)}</span>}
                          {todo.followUp && todo.followUpDate && (
                            <span>Follow-up: {formatDate(todo.followUpDate)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Permissions Section */}
        <div className="mb-4">
          <AccordionSection section={sections[6]} />
          {sections[6].expanded && (
            <div className="mt-2 bg-white rounded-lg shadow p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">
                  Checking any box below, signifies that the User of the App asked for specific permission from the Dealer to be able to eg. send emails, take a photo of the tradeshow badge etc.
                </p>
              </div>
              <div className="space-y-4">
                {Object.entries(privacyPermissions).map(([permission, granted]) => (
                  <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={granted}
                        onChange={(e) => handlePrivacyPermissionChange(permission, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-gray-900 capitalize">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              {dealer.privacyPermissionHistory && dealer.privacyPermissionHistory.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">History</h4>
                  <div className="space-y-2">
                    {dealer.privacyPermissionHistory.map((history) => (
                      <div key={history.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        <span className="capitalize">{history.permission.replace(/_/g, ' ')}</span>
                        {' '}
                        <span className="font-semibold">{history.action}</span>
                        {' '}
                        <span className="text-gray-500">{formatDate(history.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buying Group History Section - Always Visible */}
        {dealer.buyingGroupHistory && dealer.buyingGroupHistory.length > 0 && (
          <div className="mb-4 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Buying Group History
              </h3>
              <div className="space-y-3">
                {dealer.buyingGroupHistory.map((history) => (
                  <div key={history.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{history.buyingGroup.name}</p>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Start Date:</span>{' '}
                            {formatDate(history.startDate)}
                          </p>
                          {history.endDate ? (
                            <p>
                              <span className="font-medium">End Date:</span>{' '}
                              {formatDate(history.endDate)}
                            </p>
                          ) : (
                            <p className="text-green-600 font-medium">Currently Active</p>
                          )}
                        </div>
                      </div>
                      {!history.endDate && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buying Group Modal */}
      {showBuyingGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {dealer.buyingGroup ? 'Change Buying Group' : 'Assign Buying Group'}
            </h2>
            
            {/* Current Buying Group Display */}
            {dealer.buyingGroup && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Buying Group:</p>
                <p className="font-semibold text-gray-900">{dealer.buyingGroup}</p>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Buying Group
                </label>
                <button
                  onClick={() => {
                    setShowCreateBuyingGroup(!showCreateBuyingGroup);
                    setNewBuyingGroupName('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showCreateBuyingGroup ? 'Cancel' : '+ Create New'}
                </button>
              </div>
              
              {showCreateBuyingGroup ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newBuyingGroupName}
                    onChange={(e) => setNewBuyingGroupName(e.target.value)}
                    placeholder="Enter new buying group name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateBuyingGroup();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateBuyingGroup}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create & Assign
                  </button>
                </div>
              ) : (
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
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Remove Current Button - only show if dealer has a buying group */}
              {dealer.buyingGroup && (
                <button
                  onClick={handleRemoveBuyingGroup}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove Current Buying Group
                </button>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowBuyingGroupModal(false);
                    setSelectedBuyingGroupId('');
                    setShowCreateBuyingGroup(false);
                    setNewBuyingGroupName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignBuyingGroup}
                  disabled={!selectedBuyingGroupId && !showCreateBuyingGroup}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dealer.buyingGroup ? 'Change' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DealerDetail;
