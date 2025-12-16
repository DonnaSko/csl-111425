import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const CaptureLead = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    address: '',
    buyingGroup: '',
    status: 'Prospect',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/dealers', formData);
      navigate(`/dealers/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create dealer:', error);
      alert(error.response?.data?.error || 'Failed to create dealer');
    } finally {
      setLoading(false);
    }
  };

  const handleScanBadge = () => {
    // TODO: Implement badge scanning with OCR
    alert('Badge scanning feature coming soon. For now, please enter dealer information manually.');
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Capture Lead</h1>
        <p className="text-gray-600 mb-8">Find a dealer to view their profile or add a new one.</p>

        {/* Step 1: Find or Create Dealer */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Step 1: Find or Create Dealer
          </h2>
          <p className="text-gray-600 mb-6">
            Search for an existing dealer, scan a badge, or add a new one.
          </p>

          {/* Scan Badge Option */}
          <div className="mb-6">
            <button
              onClick={handleScanBadge}
              className="w-full border-2 border-green-300 rounded-lg p-6 text-left hover:bg-green-50 transition-colors"
            >
              <span className="text-2xl mr-3">📷</span>
              <span className="font-medium">Scan Badge to Auto-Fill Information</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">— OR —</span>
            </div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                placeholder="Search by company or contact..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Prospect</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buying Group</label>
              <input
                type="text"
                name="buyingGroup"
                value={formData.buyingGroup}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Dealer'}
            </button>
          </form>
        </div>

        {/* Lead Capture Guide */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <span className="mr-2">📷</span>
            Lead Capture Guide
          </h3>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <div>
              <p className="text-gray-700">
                I received the attendee's OK to scan their badge.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Ask: "Can I take a photo of your badge for follow-up?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CaptureLead;

