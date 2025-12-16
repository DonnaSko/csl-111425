import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import CSVUpload from '../components/CSVUpload';
import ErrorBoundary from '../components/ErrorBoundary';

interface BuyingGroup {
  id: string;
  name: string;
  _count?: {
    history: number;
  };
}

interface Dealer {
  id: string;
  companyName: string;
  contactName: string | null;
  buyingGroup: string | null;
}

const BuyingGroupMaintenance = () => {
  const navigate = useNavigate();
  const [buyingGroups, setBuyingGroups] = useState<BuyingGroup[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedBuyingGroup, setSelectedBuyingGroup] = useState<string>('');
  const [selectedDealers, setSelectedDealers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [newBuyingGroupName, setNewBuyingGroupName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBuyingGroups();
    fetchDealers();
  }, []);

  const fetchBuyingGroups = async () => {
    try {
      const response = await api.get('/buying-groups');
      setBuyingGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch buying groups:', error);
    }
  };

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dealers?limit=1000');
      setDealers(response.data.dealers || []);
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setLoading(false);
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
      setShowCreateModal(false);
      fetchBuyingGroups();
    } catch (error: any) {
      console.error('Failed to create buying group:', error);
      alert(error.response?.data?.error || 'Failed to create buying group');
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedBuyingGroup || selectedDealers.size === 0) {
      alert('Please select a buying group and at least one dealer');
      return;
    }

    try {
      await api.post(`/buying-groups/${selectedBuyingGroup}/bulk-assign`, {
        dealerIds: Array.from(selectedDealers)
      });
      alert(`Successfully assigned ${selectedDealers.size} dealers to buying group`);
      setSelectedDealers(new Set());
      fetchDealers();
      fetchBuyingGroups();
    } catch (error: any) {
      console.error('Failed to bulk assign:', error);
      alert(error.response?.data?.error || 'Failed to assign dealers');
    }
  };

  const toggleDealerSelection = (dealerId: string) => {
    const newSet = new Set(selectedDealers);
    if (newSet.has(dealerId)) {
      newSet.delete(dealerId);
    } else {
      newSet.add(dealerId);
    }
    setSelectedDealers(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDealers.size === dealers.length) {
      setSelectedDealers(new Set());
    } else {
      setSelectedDealers(new Set(dealers.map(d => d.id)));
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
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buying Group Maintenance</h1>
            <p className="text-gray-600 mt-1">Bulk manage buying group assignments</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCSVUpload(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              📤 Upload CSV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Create Buying Group
            </button>
            <button
              onClick={() => navigate('/dealers')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back to Dealers
            </button>
          </div>
        </div>

        {/* Create Buying Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Create Buying Group</h2>
              <div className="mb-4">
                <input
                  type="text"
                  value={newBuyingGroupName}
                  onChange={(e) => setNewBuyingGroupName(e.target.value)}
                  placeholder="Enter buying group name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateBuyingGroup();
                    }
                  }}
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBuyingGroupName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBuyingGroup}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Assignment Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Assign Dealers to Buying Group</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Buying Group
            </label>
            <select
              value={selectedBuyingGroup}
              onChange={(e) => setSelectedBuyingGroup(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a buying group --</option>
              {buyingGroups.map((bg) => (
                <option key={bg.id} value={bg.id}>
                  {bg.name} ({bg._count?.history || 0} dealers)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Select Dealers ({selectedDealers.size} selected)
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedDealers.size === dealers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
              {dealers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No dealers found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {dealers.map((dealer) => (
                    <label
                      key={dealer.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDealers.has(dealer.id)}
                        onChange={() => toggleDealerSelection(dealer.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{dealer.companyName}</div>
                        {dealer.contactName && (
                          <div className="text-sm text-gray-600">{dealer.contactName}</div>
                        )}
                        {dealer.buyingGroup && (
                          <div className="text-xs text-gray-500 mt-1">
                            Current: {dealer.buyingGroup}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleBulkAssign}
            disabled={!selectedBuyingGroup || selectedDealers.size === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign {selectedDealers.size} Dealer{selectedDealers.size !== 1 ? 's' : ''} to Buying Group
          </button>
        </div>

        {/* Buying Groups List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Buying Groups ({buyingGroups.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {buyingGroups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No buying groups yet. Create your first buying group to get started.
              </div>
            ) : (
              buyingGroups.map((bg) => (
                <div key={bg.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{bg.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {bg._count?.history || 0} dealer{bg._count?.history !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBuyingGroup(bg.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      Assign Dealers
                    </button>
                  </div>
                </div>
              ))
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
              fetchBuyingGroups();
            }}
            onCancel={() => setShowCSVUpload(false)}
          />
        </ErrorBoundary>
      )}
    </Layout>
  );
};

export default BuyingGroupMaintenance;




