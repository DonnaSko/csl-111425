import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import CSVUpload from '../components/CSVUpload';
import ErrorBoundary from '../components/ErrorBoundary';

interface Group {
  id: string;
  name: string;
  _count?: {
    dealers: number;
  };
}

interface DealerGroup {
  id: string;
  group: Group;
}

interface Dealer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  buyingGroup: string | null;
  groups?: DealerGroup[];
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
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [buyingGroups, setBuyingGroups] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showBuyingGroupsModal, setShowBuyingGroupsModal] = useState(false);
  const [showCreateBuyingGroupModal, setShowCreateBuyingGroupModal] = useState(false);
  const [newBuyingGroupName, setNewBuyingGroupName] = useState('');
  const [editingBuyingGroup, setEditingBuyingGroup] = useState<{ id: string; name: string } | null>(null);
  const [buyingGroupsList, setBuyingGroupsList] = useState<Array<{ id: string; name: string; _count?: { history: number } }>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDealers();
    fetchBuyingGroups();
    fetchGroups();
    if (showBuyingGroupsModal) {
      fetchBuyingGroupsList();
    }
  }, [search, statusFilter, buyingGroupFilter, groupFilter, showBuyingGroupsModal]);

  const fetchDealers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'All Statuses') params.append('status', statusFilter);
      if (buyingGroupFilter !== 'All Buying Groups') params.append('buyingGroup', buyingGroupFilter);
      if (groupFilter !== 'All Groups') params.append('groupId', groupFilter);

      const response = await api.get(`/dealers?${params.toString()}`);
      const dealersData = response.data.dealers || [];
      console.log(`[DEALERS PAGE] Fetched ${dealersData.length} dealers`);
      if (dealersData.length > 0) {
        console.log(`[DEALERS PAGE] Sample dealer IDs:`, dealersData.slice(0, 3).map((d: any) => ({ id: d.id, name: d.companyName })));
      }
      setDealers(dealersData);
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyingGroups = async () => {
    try {
      // Use the new BuyingGroup model endpoint - only shows buying groups for this company
      // New users will see empty list until they create/assign buying groups
      const response = await api.get('/buying-groups');
      // Extract just the names for the dropdown (backward compatible with old string format)
      const buyingGroupNames = response.data.map((bg: { name: string }) => bg.name);
      setBuyingGroups(buyingGroupNames);
    } catch (error) {
      console.error('Failed to fetch buying groups:', error);
      // Fallback to old endpoint if new one fails
      try {
        const fallbackResponse = await api.get('/dealers/buying-groups/list');
        setBuyingGroups(fallbackResponse.data);
      } catch (fallbackError) {
        console.error('Failed to fetch buying groups (fallback):', fallbackError);
        setBuyingGroups([]);
      }
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      await api.post('/groups', { name: newGroupName.trim() });
      setNewGroupName('');
      setShowCreateGroupModal(false);
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) {
      return;
    }

    try {
      await api.put(`/groups/${editingGroup.id}`, { name: newGroupName.trim() });
      setEditingGroup(null);
      setNewGroupName('');
      fetchGroups();
      fetchDealers();
    } catch (error: any) {
      console.error('Failed to update group:', error);
      alert(error.response?.data?.error || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Dealers will be removed from this group.')) {
      return;
    }

    try {
      await api.delete(`/groups/${groupId}`);
      fetchGroups();
      fetchDealers();
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const openEditGroupModal = (group: Group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setShowCreateGroupModal(true);
  };

  const fetchBuyingGroupsList = async () => {
    try {
      const response = await api.get('/buying-groups');
      setBuyingGroupsList(response.data);
    } catch (error) {
      console.error('Failed to fetch buying groups:', error);
    }
  };

  const handleCreateBuyingGroup = async () => {
    if (!newBuyingGroupName.trim()) {
      alert('Please enter a buying group name');
      return;
    }

    try {
      await api.post('/buying-groups', { name: newBuyingGroupName.trim() });
      setNewBuyingGroupName('');
      setShowCreateBuyingGroupModal(false);
      fetchBuyingGroupsList();
      fetchBuyingGroups(); // Refresh filter dropdown
    } catch (error: any) {
      console.error('Failed to create buying group:', error);
      alert(error.response?.data?.error || 'Failed to create buying group');
    }
  };

  const handleEditBuyingGroup = async () => {
    if (!editingBuyingGroup || !newBuyingGroupName.trim()) {
      return;
    }

    try {
      await api.put(`/buying-groups/${editingBuyingGroup.id}`, { name: newBuyingGroupName.trim() });
      setEditingBuyingGroup(null);
      setNewBuyingGroupName('');
      fetchBuyingGroupsList();
      fetchBuyingGroups();
      fetchDealers();
    } catch (error: any) {
      console.error('Failed to update buying group:', error);
      alert(error.response?.data?.error || 'Failed to update buying group');
    }
  };

  const handleDeleteBuyingGroup = async (buyingGroupId: string) => {
    if (!confirm('Are you sure you want to delete this buying group? Dealers will be moved to history.')) {
      return;
    }

    try {
      await api.delete(`/buying-groups/${buyingGroupId}`);
      fetchBuyingGroupsList();
      fetchBuyingGroups();
      fetchDealers();
    } catch (error: any) {
      console.error('Failed to delete buying group:', error);
      alert(error.response?.data?.error || 'Failed to delete buying group');
    }
  };

  const openEditBuyingGroupModal = (buyingGroup: { id: string; name: string }) => {
    setEditingBuyingGroup(buyingGroup);
    setNewBuyingGroupName(buyingGroup.name);
    setShowCreateBuyingGroupModal(true);
  };

  const handleBulkUpload = () => {
    setShowCSVUpload(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this dealer? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/dealers/${id}`);
      // Remove from list
      setDealers(dealers.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete dealer:', error);
      alert('Failed to delete dealer. Please try again.');
    } finally {
      setDeletingId(null);
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

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dealers</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your dealer database</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowGroupsModal(true)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
            >
              👥 Manage Groups
            </button>
            <button
              onClick={() => setShowBuyingGroupsModal(true)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
            >
              🏢 Manage Buying Groups
            </button>
            <button
              onClick={handleBulkUpload}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
            >
              📤 Upload Files
            </button>
            <button
              onClick={() => navigate('/capture-lead')}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
            >
              ➕ Add New Dealer
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by company name, contact name, email, phone, buying group, or group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>All Statuses</option>
              <option>Prospect</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select
              value={buyingGroupFilter}
              onChange={(e) => setBuyingGroupFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>All Buying Groups</option>
              {buyingGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group._count?.dealers || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dealers List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold">Dealer List ({dealers.length} total)</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Click on any company or contact name to view details and add notes.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {dealers.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
                No dealers found. Add your first dealer to get started.
              </div>
            ) : (
              dealers.map((dealer) => {
                if (!dealer.id) {
                  console.error('[DEALERS PAGE] Dealer missing ID:', dealer);
                }
                return (
                  <Link
                    key={dealer.id}
                    to={`/dealers/${dealer.id}`}
                    onClick={() => console.log(`[DEALERS PAGE] Navigating to dealer: id="${dealer.id}", name="${dealer.companyName}"`)}
                    className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                          {dealer.companyName}
                        </h3>
                        {dealer.contactName && (
                          <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">{dealer.contactName}</p>
                        )}
                        {dealer.email && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 break-all">{dealer.email}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {dealer.buyingGroup && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {dealer.buyingGroup}
                            </span>
                          )}
                          {dealer.groups && dealer.groups.length > 0 && (
                            <>
                              {dealer.groups.map((dg) => (
                                <span
                                  key={dg.id}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                >
                                  {dg.group.name}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-start gap-2 sm:gap-3 sm:text-right">
                        <div className="flex-1 sm:flex-none">
                          <span
                            className={`inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full whitespace-nowrap ${
                              dealer.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : dealer.status === 'Prospect'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {dealer.status}
                          </span>
                          <div className="mt-2 text-xs text-gray-500 whitespace-nowrap">
                            {dealer._count.dealerNotes} notes • {dealer._count.photos} photos •{' '}
                            {dealer._count.voiceRecordings} recordings
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(dealer.id, e)}
                          disabled={deletingId === dealer.id}
                          className="px-2 sm:px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50 flex-shrink-0"
                          title="Delete dealer"
                        >
                          {deletingId === dealer.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
      {showCSVUpload && (
        <ErrorBoundary>
          <CSVUpload
            onSuccess={() => {
              setShowCSVUpload(false);
              fetchDealers();
            }}
            onCancel={() => setShowCSVUpload(false)}
          />
        </ErrorBoundary>
      )}

      {/* Groups Management Modal */}
      {showGroupsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Manage Groups</h2>
              <button
                onClick={() => {
                  setShowGroupsModal(false);
                  setShowCreateGroupModal(false);
                  setEditingGroup(null);
                  setNewGroupName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setNewGroupName('');
                  setShowCreateGroupModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➕ Create New Group
              </button>
            </div>

            {showCreateGroupModal && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {editingGroup ? 'Edit Group' : 'Create New Group'}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name (e.g., Product Category X, Region West, Account Size)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        editingGroup ? handleEditGroup() : handleCreateGroup();
                      }
                    }}
                  />
                  <button
                    onClick={editingGroup ? handleEditGroup : handleCreateGroup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingGroup ? 'Save' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateGroupModal(false);
                      setEditingGroup(null);
                      setNewGroupName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No groups yet. Create your first group to get started.
                </p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-semibold">{group.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({group._count?.dealers || 0} dealers)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditGroupModal(group)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Groups allow you to organize dealers by buying groups, regions, 
                product categories, or any other criteria important to your business. Dealers can belong 
                to multiple groups. If you have existing buyingGroup values, they will be automatically 
                migrated to Groups.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Buying Groups Management Modal */}
      {showBuyingGroupsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Manage Buying Groups</h2>
              <button
                onClick={() => {
                  setShowBuyingGroupsModal(false);
                  setShowCreateBuyingGroupModal(false);
                  setEditingBuyingGroup(null);
                  setNewBuyingGroupName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => {
                  setEditingBuyingGroup(null);
                  setNewBuyingGroupName('');
                  setShowCreateBuyingGroupModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➕ Create New Buying Group
              </button>
            </div>

            {showCreateBuyingGroupModal && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {editingBuyingGroup ? 'Edit Buying Group' : 'Create New Buying Group'}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBuyingGroupName}
                    onChange={(e) => setNewBuyingGroupName(e.target.value)}
                    placeholder="Enter buying group name (e.g., Your Buying Group Name)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        editingBuyingGroup ? handleEditBuyingGroup() : handleCreateBuyingGroup();
                      }
                    }}
                  />
                  <button
                    onClick={editingBuyingGroup ? handleEditBuyingGroup : handleCreateBuyingGroup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingBuyingGroup ? 'Save' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateBuyingGroupModal(false);
                      setEditingBuyingGroup(null);
                      setNewBuyingGroupName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {buyingGroupsList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No buying groups yet. Create your first buying group to get started.
                </p>
              ) : (
                buyingGroupsList.map((buyingGroup) => (
                  <div
                    key={buyingGroup.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-semibold">{buyingGroup.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({buyingGroup._count?.history || 0} dealers)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditBuyingGroupModal(buyingGroup)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBuyingGroup(buyingGroup.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Buying groups allow you to organize dealers by buying group affiliations. 
                When a buying group is deleted, dealers are moved to history with date ranges. 
                Dealers can be assigned to buying groups individually or via CSV upload.
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dealers;

