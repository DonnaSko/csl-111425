import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  canCancel: boolean;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<{ isActive: boolean; subscription: Subscription | null }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!user) {
      setLoading(false);
      return { isActive: false, subscription: null };
    }

    try {
      const response = await api.get('/subscriptions/status');
      if (response.data.hasSubscription) {
        setSubscription(response.data.subscription);
        setHasActiveSubscription(response.data.isActive);
        return { isActive: response.data.isActive, subscription: response.data.subscription };
      } else {
        setSubscription(null);
        setHasActiveSubscription(false);
        return { isActive: false, subscription: null };
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
      setHasActiveSubscription(false);
      return { isActive: false, subscription: null };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        hasActiveSubscription,
        loading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

