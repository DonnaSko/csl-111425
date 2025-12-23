import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Refresh subscription status
      refreshSubscription().then((subStatus) => {
        setTimeout(() => {
          // Navigate to dashboard if subscription is active
          if (subStatus.isActive) {
            navigate('/dashboard');
          } else {
            // Fallback to subscription page if something went wrong
            navigate('/subscription');
          }
        }, 2000);
      });
    }
  }, [searchParams, navigate, refreshSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Subscription Successful!
        </h1>
        <p className="text-gray-600 mb-4">
          Your subscription has been activated. A confirmation email has been sent to your email address.
        </p>
        
        {/* Billing reminder */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
          <p className="font-semibold text-gray-800 mb-2">📋 Quick Reminder:</p>
          <ul className="text-gray-600 space-y-1">
            <li>• <strong>Automatic renewal</strong> - your subscription renews at the end of each billing period</li>
            <li>• You can cancel up to and including the date of renewal from <strong>Account Settings</strong></li>
            <li>• <strong>Once renewed, NO REFUNDS available</strong></li>
          </ul>
        </div>
        
        <p className="text-gray-500 text-sm mb-4">Redirecting to dashboard...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;

