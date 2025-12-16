import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';

const Subscription = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { refreshSubscription, hasActiveSubscription, loading: subscriptionLoading, subscription } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  // Make sure we have the freshest subscription status when landing on this page
  useEffect(() => {
    refreshSubscription();
    // We intentionally call this once on mount to ensure freshest status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user already has an active subscription, inform and redirect them to the dashboard
  useEffect(() => {
    if (!subscriptionLoading && hasActiveSubscription) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [subscriptionLoading, hasActiveSubscription, navigate]);

  const subscriptionEndsOn = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const subscriptionDaysLeft = subscription?.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    // Extra guard: prevent paid users from starting a new checkout
    if (hasActiveSubscription) {
      const suffix =
        subscriptionDaysLeft !== null
          ? ` You have ${subscriptionDaysLeft} day${subscriptionDaysLeft === 1 ? '' : 's'} remaining.`
          : '';
      alert(`You already have an active subscription.${suffix} Redirecting you to your dashboard.`);
      navigate('/dashboard');
      return;
    }

    setLoadingPlan(plan);
    try {
      const response = await api.post('/subscriptions/create-checkout-session', { plan });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create checkout session';

      if (error.response?.data?.code === 'SUBSCRIPTION_EXISTS') {
        const daysLeft = error.response?.data?.daysLeft;
        const currentPeriodEnd = error.response?.data?.currentPeriodEnd;
        const readableEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : null;
        const suffix =
          daysLeft !== undefined
            ? ` You have ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining${readableEnd ? ` (through ${readableEnd})` : ''}.`
            : '';
        await refreshSubscription();
        alert(`${errorMessage}${suffix} Redirecting you to your dashboard.`);
        navigate('/dashboard');
      } else {
        alert(errorMessage);
        setLoadingPlan(null);
      }
    }
  };

  const handleSyncFromStripe = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/subscriptions/sync-from-stripe');
      
      // Refresh subscription status
      await refreshSubscription();
      
      // Check if subscription is active after sync
      if (response.data.subscription?.isActive) {
        // If user has paid (subscription is active), redirect based on auth status
        // If user is authenticated, redirect to dashboard
        // If user is NOT authenticated, redirect to login (as requested)
        if (user) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } else {
        // Subscription synced but not active
        alert(response.data.message || 'Subscription synced successfully, but it is not active. Please contact support.');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to sync subscription from Stripe. Please contact support.';
      alert(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking your subscription...</div>
      </div>
    );
  }

  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-green-900 mb-2">You're already subscribed</h2>
            <p className="text-green-800 mb-4">
              Thank you! Your subscription is active
              {subscriptionEndsOn ? ` through ${subscriptionEndsOn}` : ''}.
              {subscriptionDaysLeft !== null ? ` (${subscriptionDaysLeft} day${subscriptionDaysLeft === 1 ? '' : 's'} remaining).` : ''}{' '}
              We'll take you to your dashboard.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
            >
              Go to Dashboard
            </button>
            {redirecting && (
              <p className="text-sm text-green-700 mt-3">Redirecting...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select a subscription plan to start managing your trade show leads
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Plan</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$99</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Unlimited trade show lead captures</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Smart badge scanning with OCR</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">All premium features included</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Cancel anytime (5+ days before renewal)</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loadingPlan !== null || hasActiveSubscription}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Annual Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
              BEST VALUE
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Annual Plan</h2>
            <div className="mb-2">
              <span className="text-4xl font-bold text-gray-900">$920</span>
              <span className="text-gray-600">/year</span>
            </div>
            <div className="mb-6">
              <span className="text-lg font-semibold text-green-600">
                Only $76.67/month when paid annually
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Unlimited trade show lead captures</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Smart badge scanning with OCR</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">All premium features included</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Save $268 per year</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Cancel anytime (5+ days before renewal)</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('annual')}
              disabled={loadingPlan !== null || hasActiveSubscription}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === 'annual' ? 'Processing...' : 'Subscribe Annually'}
            </button>
          </div>
        </div>

        {/* Billing Terms - Clear before checkout */}
        <div className="mt-8 bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📋 Billing Terms & Cancellation Policy
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <p><strong>No Refunds:</strong> All fees are non-refundable, including for partially used subscription periods.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <p><strong>Easy Cancellation:</strong> Cancel at least 5 days before your renewal date from your Account Settings. After cancellation, you'll have 5 days of continued access.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">•</span>
              <p><strong>Renewal Reminder:</strong> We'll email you 5 days before your subscription renews so you can cancel if needed.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <p><strong>Auto-Renewal:</strong> Subscriptions automatically renew at the end of each billing period until canceled.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <p><strong>Billing Errors:</strong> Contact us within 7 days of any billing error for correction or refund.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            By subscribing, you agree to our{' '}
            <a href="/terms-of-service" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Already Paid? Sync Your Subscription
          </h3>
          <p className="text-sm text-yellow-800 mb-4">
            If you've already paid but are seeing this page, your subscription may not be synced from Stripe. 
            Click the button below to manually sync your subscription.
          </p>
          <button
            onClick={handleSyncFromStripe}
            disabled={syncing}
            className="bg-yellow-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Subscription from Stripe'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

