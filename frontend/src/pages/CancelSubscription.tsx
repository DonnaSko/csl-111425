import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CancelSubscription = () => {
  const { subscription, hasActiveSubscription, refreshSubscription, loading: subscriptionLoading } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no active subscription
  useEffect(() => {
    if (!subscriptionLoading && !hasActiveSubscription) {
      navigate('/subscription');
    }
  }, [subscriptionLoading, hasActiveSubscription, navigate]);

  // Redirect if already canceled
  useEffect(() => {
    if (subscription?.cancelAtPeriodEnd) {
      setCanceled(true);
    }
  }, [subscription]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const endDate = new Date(dateString);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleCancel = async () => {
    setCanceling(true);
    setError(null);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CancelSubscription.tsx:58',message:'Cancel subscription request initiated',data:{userId:user?.id,subscriptionId:subscription?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'cancel-subscription',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    try {
      const response = await api.post('/subscriptions/cancel');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CancelSubscription.tsx:66',message:'Cancel subscription API call successful',data:{currentPeriodEnd:response.data.currentPeriodEnd,message:response.data.message},timestamp:Date.now(),sessionId:'debug-session',runId:'cancel-subscription',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      await refreshSubscription();
      setCanceled(true);
      setShowConfirm(false);
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c00397ca-8385-4dae-b4eb-3c3289803dbd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CancelSubscription.tsx:75',message:'Cancel subscription API call failed',data:{error:err.response?.data?.error || err.message,status:err.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'cancel-subscription',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      console.error('Cancel subscription error:', err);
      setError(err.response?.data?.error || 'Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCanceling(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading subscription information...</div>
        </div>
      </Layout>
    );
  }

  if (!hasActiveSubscription) {
    return null; // Will redirect via useEffect
  }

  const periodEndDate = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : null;
  const daysRemaining = subscription?.currentPeriodEnd ? getDaysRemaining(subscription.currentPeriodEnd) : null;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Cancel Subscription</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {canceled ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-yellow-900 mb-2">✓ Subscription Cancellation Confirmed</h2>
                  <p className="text-yellow-800 mb-2">
                    Your subscription has been successfully canceled. You will continue to have full access until{' '}
                    <strong>{periodEndDate}</strong>.
                  </p>
                  {daysRemaining !== null && (
                    <p className="text-yellow-700">
                      You have <strong>{daysRemaining} day{daysRemaining === 1 ? '' : 's'}</strong> remaining in your current billing period.
                    </p>
                  )}
                  <p className="text-yellow-700 mt-4">
                    Your subscription will not renew after {periodEndDate}. No further charges will be made.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">What happens next?</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>You'll keep full access to all features until {periodEndDate}</li>
                    <li>No further charges will be made to your payment method</li>
                    <li>You can reactivate your subscription anytime before {periodEndDate} by contacting support</li>
                    <li>After {periodEndDate}, your account will be downgraded and you'll lose access to premium features</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => navigate('/account-settings')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Go to Account Settings
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-blue-900 mb-2">Current Subscription</h2>
                  <p className="text-blue-800 mb-2">
                    <strong>Status:</strong> Active
                  </p>
                  {periodEndDate && (
                    <p className="text-blue-800 mb-2">
                      <strong>Current period ends:</strong> {periodEndDate}
                    </p>
                  )}
                  {daysRemaining !== null && (
                    <p className="text-blue-800">
                      <strong>Days remaining:</strong> {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                    </p>
                  )}
                </div>

                {!showConfirm ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3">Before You Cancel</h3>
                      <ul className="list-disc list-inside space-y-2 text-yellow-800">
                        <li>You'll continue to have full access until {periodEndDate}</li>
                        <li>No refunds are available for the current billing period</li>
                        <li>You can reactivate your subscription anytime before {periodEndDate}</li>
                        <li>After cancellation, you'll lose access to premium features on {periodEndDate}</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowConfirm(true)}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                      >
                        Cancel Subscription
                      </button>
                      <button
                        onClick={() => navigate('/account-settings')}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                      >
                        Keep Subscription
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-4">Confirm Cancellation</h3>
                      <p className="text-red-800 mb-4">
                        Are you sure you want to cancel your subscription? This action will prevent future renewals.
                      </p>
                      <div className="bg-white p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>What will happen:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          <li>Your subscription will remain active until {periodEndDate}</li>
                          <li>You'll keep full access to all features until then</li>
                          <li>No further charges will be made after {periodEndDate}</li>
                          <li>You can reactivate before {periodEndDate} by contacting support</li>
                        </ul>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleCancel}
                          disabled={canceling}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {canceling ? 'Canceling...' : 'Yes, Cancel My Subscription'}
                        </button>
                        <button
                          onClick={() => setShowConfirm(false)}
                          disabled={canceling}
                          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                        >
                          Keep Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help? Contact us at{' '}
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
        </div>
      </div>
    </Layout>
  );
};

export default CancelSubscription;


