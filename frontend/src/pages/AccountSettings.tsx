import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface UserPreferences {
  dailyEmailReminders: boolean;
  marketingEmails: boolean;
}

const AccountSettings = () => {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [preferences, setPreferences] = useState<UserPreferences>({
    dailyEmailReminders: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Check if user came from email link to manage subscription
  useEffect(() => {
    if (searchParams.get('action') === 'cancel' && subscription) {
      // Scroll to subscription section and open Stripe portal
      setTimeout(() => {
        const subscriptionSection = document.getElementById('subscription-section');
        if (subscriptionSection) {
          subscriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Open Stripe portal for subscription management
        api.post('/subscriptions/create-portal-session')
          .then((response) => {
            if (response.data.url) {
              window.location.href = response.data.url;
            }
          })
          .catch((error) => {
            console.error('Failed to create portal session:', error);
            setMessage({ 
              type: 'error', 
              text: 'Failed to open subscription management. Please try again.' 
            });
          });
        // Remove query param from URL
        setSearchParams({});
      }, 500);
    }
  }, [searchParams, subscription, setSearchParams]);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/auth/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      // Use defaults if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/auth/preferences', preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportDealers = async () => {
    setExporting(true);
    try {
      const response = await api.get('/reports/export/dealers', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dealers-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage({ type: 'success', text: 'Dealers exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export dealers. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllData = async () => {
    setExportingAll(true);
    try {
      const response = await api.get('/reports/export/all-data', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `capture-show-leads-full-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage({ type: 'success', text: 'All data exported successfully!' });
    } catch (error: any) {
      console.error('Full export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export all data. Please try again.' });
    } finally {
      setExportingAll(false);
    }
  };

  const handleRequestAccountDeletion = async () => {
    try {
      await api.post('/auth/request-deletion');
      setDeleteRequested(true);
      setShowDeleteConfirm(false);
      setMessage({ type: 'success', text: 'Account deletion request submitted. We will process it within 48 hours and send a confirmation email.' });
    } catch (error) {
      console.error('Deletion request failed:', error);
      setMessage({ type: 'error', text: 'Failed to submit deletion request. Please contact support@captureshowleads.com' });
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setMessage(null);
    try {
      const response = await api.post('/subscriptions/cancel');
      setShowCancelConfirm(false);
      await refreshSubscription();
      setMessage({ 
        type: 'success', 
        text: `Your subscription will be canceled at the end of the current period (${formatDate(response.data.currentPeriodEnd)}). You will continue to have access until then.` 
      });
    } catch (error: any) {
      console.error('Cancel subscription failed:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to cancel subscription. Please try again or contact support.' 
      });
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Company</label>
              <p className="text-gray-900">{user?.company?.name || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div id="subscription-section" className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💳 Subscription Status</h2>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                  subscription.cancelAtPeriodEnd ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {subscription.cancelAtPeriodEnd ? '⏸️ Canceling at period end' :
                   subscription.status === 'active' ? '✓ Active' : 
                   subscription.status === 'trialing' ? '🔄 Trial' : 
                   subscription.status}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <strong>Current period ends:</strong> {formatDate(subscription.currentPeriodEnd)}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      ⚠️ Your subscription will be canceled at the end of the current period ({formatDate(subscription.currentPeriodEnd)}). 
                      You will have access until then.
                    </p>
                  )}
                </div>
              )}
              {!subscription.cancelAtPeriodEnd ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.post('/subscriptions/create-portal-session');
                          if (response.data.url) {
                            window.location.href = response.data.url;
                          }
                        } catch (error: any) {
                          console.error('Failed to create portal session:', error);
                          setMessage({ 
                            type: 'error', 
                            text: error.response?.data?.error || 'Failed to open subscription management. Please try again.' 
                          });
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                    >
                      Manage Payment Method in Stripe →
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-center"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                  {showCancelConfirm && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 mb-4 font-medium">
                        Are you sure you want to cancel your subscription?
                      </p>
                      <p className="text-sm text-yellow-700 mb-4">
                        Your subscription will remain active until {formatDate(subscription.currentPeriodEnd)}. 
                        You will continue to have full access until then. After that date, your subscription will not renew.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {canceling ? 'Canceling...' : 'Yes, Cancel Subscription'}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={canceling}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                          Keep Subscription
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>Cancel Subscription:</strong> Cancel your subscription to prevent future renewals. You'll keep access until {formatDate(subscription.currentPeriodEnd)}.
                    <br />
                    <strong>Manage Payment Method:</strong> Update your payment method or view invoices in Stripe.
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.post('/subscriptions/create-portal-session');
                          if (response.data.url) {
                            window.location.href = response.data.url;
                          }
                        } catch (error: any) {
                          console.error('Failed to create portal session:', error);
                          setMessage({ 
                            type: 'error', 
                            text: error.response?.data?.error || 'Failed to open subscription management. Please try again.' 
                          });
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                    >
                      Manage Payment Method in Stripe →
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your subscription is scheduled to cancel at the end of the current period. You can reactivate it in Stripe if needed.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">No active subscription found.</p>
              <button
                onClick={() => navigate('/subscription')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Subscribe Now
              </button>
            </div>
          )}
        </div>

        {/* Email Preferences */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Email Preferences</h2>
          {loading ? (
            <p className="text-gray-500">Loading preferences...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Daily To-Do Reminders</p>
                  <p className="text-sm text-gray-600">Receive an email at 8 AM with your incomplete tasks and follow-ups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.dailyEmailReminders}
                    onChange={(e) => setPreferences({ ...preferences, dailyEmailReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Marketing Communications</p>
                  <p className="text-sm text-gray-600">Receive product updates, tips, and promotional offers from Capture Show Leads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketingEmails}
                    onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Note: You will always receive important account and security notifications regardless of these settings.
              </p>
              
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📥 Export Your Data</h2>
          <p className="text-gray-600 mb-4">
            Download all your data at any time. Your data belongs to you.
          </p>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportDealers}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>Exporting...</>
                ) : (
                  <>📄 Export Dealers (CSV)</>
                )}
              </button>
              <button
                onClick={handleExportAllData}
                disabled={exportingAll}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exportingAll ? (
                  <>Exporting...</>
                ) : (
                  <>📦 Export All Data (JSON)</>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              CSV export includes all dealer information. JSON export includes everything: dealers, notes, trade shows, todos, groups, and account data.
            </p>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-red-100">
          <h2 className="text-xl font-semibold text-red-600 mb-4">⚠️ Delete Account</h2>
          <p className="text-gray-600 mb-4">
            Request deletion of your account and all associated data. This action cannot be undone.
            We recommend exporting your data before requesting deletion.
          </p>
          
          {deleteRequested ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ✓ Deletion request submitted. We will process your request within 48 hours and send a confirmation to your email.
              </p>
            </div>
          ) : showDeleteConfirm ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 mb-4 font-medium">
                Are you sure? This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-red-700 mb-4 space-y-1">
                <li>Your account and login credentials</li>
                <li>All dealer/lead data you've captured</li>
                <li>All notes, photos, and voice recordings</li>
                <li>All trade shows and todos</li>
                <li>Your subscription (will be canceled)</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestAccountDeletion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
            >
              Request Account Deletion
            </button>
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gray-50 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h2>
          <p className="text-gray-600">
            Contact us at{' '}
            <a href="mailto:support@captureshowleads.com" className="text-blue-600 hover:underline">
              support@captureshowleads.com
            </a>
            {' '}or call{' '}
            <a href="tel:973-467-0680" className="text-blue-600 hover:underline">
              973-467-0680
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AccountSettings;

