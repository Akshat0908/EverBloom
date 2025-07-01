import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomerInfo } from '@revenuecat/purchases-js';
import { revenueCatService, SubscriptionTier, SubscriptionFeatures } from '../lib/revenuecat';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SubscriptionContextType {
  customerInfo: CustomerInfo | null;
  subscriptionTier: SubscriptionTier;
  features: SubscriptionFeatures;
  loading: boolean;
  refreshCustomerInfo: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      initializeRevenueCat();
    } else {
      // Reset state when user logs out
      setCustomerInfo(null);
      setSubscriptionTier(SubscriptionTier.FREE);
      setLoading(false);
    }
  }, [user]);

  const initializeRevenueCat = async () => {
    try {
      setLoading(true);
      await revenueCatService.initialize(user?.id);
      await refreshCustomerInfo();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      // Continue with free tier if RevenueCat fails
      setSubscriptionTier(SubscriptionTier.FREE);
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomerInfo = async () => {
    try {
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);
      
      const tier = revenueCatService.getSubscriptionTier(info);
      setSubscriptionTier(tier);
    } catch (error) {
      console.error('Failed to refresh customer info:', error);
      // Fallback to free tier
      setSubscriptionTier(SubscriptionTier.FREE);
    }
  };

  const restorePurchases = async () => {
    try {
      setLoading(true);
      const info = await revenueCatService.restorePurchases();
      setCustomerInfo(info);
      
      const tier = revenueCatService.getSubscriptionTier(info);
      setSubscriptionTier(tier);
      
      toast.success('Purchases restored successfully! 🎉');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      toast.error('Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const features = revenueCatService.getFeatures(subscriptionTier);

  const value = {
    customerInfo,
    subscriptionTier,
    features,
    loading,
    refreshCustomerInfo,
    restorePurchases,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}