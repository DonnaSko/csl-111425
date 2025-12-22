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

  // Debug: Log subscription data when it changes
  useEffect(() => {
    if (subscription) {
      console.log('📊 AccountSettings - Subscription data:', {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        canceledAt: subscription.canceledAt,
        canCancel: subscription.canCancel,
        fullObject: subscription
      });
    } else {
      console.log('📊 AccountSettings - No subscription found');
    }
  }, [subscription]);

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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:148',message:'Cancel subscription initiated from AccountSettings',data:{userId:user?.id,subscriptionId:subscription?.id,hasSubscription:!!subscription},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    try {
      // Step 1: Cancel subscription via API
      const cancelResponse = await api.post('/subscriptions/cancel');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:156',message:'Cancel subscription API call successful',data:{currentPeriodEnd:cancelResponse.data.currentPeriodEnd,message:cancelResponse.data.message},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      setShowCancelConfirm(false);
      await refreshSubscription();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:162',message:'Subscription refreshed after cancellation',data:{subscriptionStatus:subscription?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Step 2: Show success message acknowledging cancellation
      const periodEndDate = formatDate(cancelResponse.data.currentPeriodEnd);
      setMessage({ 
        type: 'success', 
        text: `✓ Future auto-renewals have been canceled. Your subscription will remain active until ${periodEndDate}, and you will continue to have full access until then. No future charges will be made after that date. Redirecting to Stripe to view your subscription details...` 
      });
      
      // Step 3: Wait 2 seconds to show message, then redirect to Stripe portal
      setTimeout(async () => {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:175',message:'Creating Stripe portal session after cancellation',data:{userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          const portalResponse = await api.post('/subscriptions/create-portal-session');
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:181',message:'Stripe portal session created successfully',data:{hasUrl:!!portalResponse.data.url},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          if (portalResponse.data.url) {
            window.location.href = portalResponse.data.url;
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:187',message:'Stripe portal session missing URL',data:{response:portalResponse.data},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            setMessage({ 
              type: 'error', 
              text: 'Subscription canceled successfully, but failed to open Stripe portal. You can access it from Account Settings.' 
            });
          }
        } catch (portalError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:194',message:'Failed to create Stripe portal session',data:{error:portalError.response?.data?.error || portalError.message,status:portalError.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.error('Failed to create portal session:', portalError);
          setMessage({ 
            type: 'success', 
            text: `✓ Future auto-renewals have been canceled successfully. Your subscription will remain active until ${periodEndDate}. You can view your subscription details in Stripe from Account Settings.` 
          });
        }
      }, 2000);
      
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:207',message:'Cancel subscription API call failed',data:{error:error.response?.data?.error || error.message,status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'account-settings-cancel',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
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
          
          {/* DEBUG: Always show subscription data */}
          {subscription && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
              <strong>DEBUG:</strong> Status={subscription.status}, cancelAtPeriodEnd={String(subscription.cancelAtPeriodEnd)}, 
              Should show button: {String((subscription.status === 'active' || subscription.status === 'trialing') && !subscription.cancelAtPeriodEnd)}
            </div>
          )}
          
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
              {/* Show cancel option for active or trialing subscriptions that aren't already set to cancel */}
              {(() => {
                // Handle null/undefined cancelAtPeriodEnd as false (not canceled)
                const isCanceled = subscription.cancelAtPeriodEnd === true;
                const isPaidUser = subscription.status === 'active' || subscription.status === 'trialing';
                const shouldShow = isPaidUser && !isCanceled;
                
                // Debug logging
                console.log('🔍 Subscription cancel button check:', {
                  status: subscription.status,
                  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                  isCanceled,
                  isPaidUser,
                  shouldShow,
                  fullSubscription: subscription
                });
                
                return shouldShow;
              })() ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={async () => {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:303',message:'Manage Payment Method button clicked',data:{userId:user?.id,hasSubscription:!!subscription},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
                        try {
                          const response = await api.post('/subscriptions/create-portal-session');
                          
                          // #region agent log
                          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:308',message:'Portal session API response received',data:{hasUrl:!!response.data.url,urlLength:response.data.url?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                          // #endregion
                          
                          if (response.data.url) {
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:312',message:'Redirecting to Stripe portal',data:{url:response.data.url},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                            // #endregion
                            window.location.href = response.data.url;
                          } else {
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:316',message:'Portal session missing URL',data:{response:response.data},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                            // #endregion
                            setMessage({ 
                              type: 'error', 
                              text: 'Failed to open subscription management. No URL received from server.' 
                            });
                          }
                        } catch (error: any) {
                          // #region agent log
                          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:323',message:'Portal session creation failed',data:{error:error.response?.data?.error || error.message,status:error.response?.status,code:error.response?.data?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                          // #endregion
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
                      Cancel Future Auto-Renewals
                    </button>
                  </div>
                  {showCancelConfirm && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 mb-4 font-medium">
                        Cancel Future Auto-Renewals?
                      </p>
                      <p className="text-sm text-yellow-700 mb-4">
                        This will cancel your subscription's automatic renewal. Your subscription will remain active until {formatDate(subscription.currentPeriodEnd)}. 
                        You will continue to have full access until then. After that date, your subscription will not automatically renew and no future charges will be made.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {canceling ? 'Canceling...' : 'Yes, Cancel Future Renewals'}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={canceling}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                          Keep Auto-Renewal
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>Cancel Future Auto-Renewals:</strong> Stop automatic subscription renewals. You'll keep full access until {formatDate(subscription.currentPeriodEnd)}. No future charges will be made after that date.
                    <br />
                    <strong>Manage Payment Method:</strong> Update your payment method or view invoices in Stripe.
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  {/* Show why cancel button is not available */}
                  {subscription.status !== 'active' && subscription.status !== 'trialing' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Cancel button is only available for active or trialing subscriptions. 
                        Current status: <strong>{subscription.status}</strong>
                      </p>
                    </div>
                  )}
                  {subscription.cancelAtPeriodEnd && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your subscription is already set to cancel at the end of the current period.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={async () => {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:387',message:'Manage Payment Method button clicked (canceled subscription)',data:{userId:user?.id,hasSubscription:!!subscription},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
                        try {
                          const response = await api.post('/subscriptions/create-portal-session');
                          
                          // #region agent log
                          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:392',message:'Portal session API response received (canceled subscription)',data:{hasUrl:!!response.data.url,urlLength:response.data.url?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                          // #endregion
                          
                          if (response.data.url) {
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:396',message:'Redirecting to Stripe portal (canceled subscription)',data:{url:response.data.url},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                            // #endregion
                            window.location.href = response.data.url;
                          } else {
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:400',message:'Portal session missing URL (canceled subscription)',data:{response:response.data},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                            // #endregion
                            setMessage({ 
                              type: 'error', 
                              text: 'Failed to open subscription management. No URL received from server.' 
                            });
                          }
                        } catch (error: any) {
                          // #region agent log
                          fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AccountSettings.tsx:407',message:'Portal session creation failed (canceled subscription)',data:{error:error.response?.data?.error || error.message,status:error.response?.status,code:error.response?.data?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'manage-payment',hypothesisId:'B'})}).catch(()=>{});
                          // #endregion
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
                    {subscription.cancelAtPeriodEnd 
                      ? 'Your subscription is scheduled to cancel at the end of the current period. You can reactivate it in Stripe if needed.'
                      : 'Use Stripe to manage your subscription settings.'}
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

