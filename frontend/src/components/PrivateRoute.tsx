import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface PrivateRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
}

const PrivateRoute = ({ children, requireSubscription = false }: PrivateRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();

  // Always wait for auth to finish loading before checking user
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If auth finished loading and no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If subscription is required, wait for subscription check
  if (requireSubscription && subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If subscription is required but user doesn't have one, redirect to subscription
  if (requireSubscription && !hasActiveSubscription) {
    return <Navigate to="/subscription" replace />;
  }

  // User is authenticated (and has subscription if required)
  return <>{children}</>;
};

export default PrivateRoute;

