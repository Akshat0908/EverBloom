import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CustomerInfo } from '@revenuecat/purchases-js';
import { revenueCat, SubscriptionTier, Entitlement, getFeatureLimits } from '../lib/revenuecat';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface SubscriptionContextType {
  customerInfo: CustomerInfo | null;
  subscriptionTier: SubscriptionTier;
  loading: boolean;
  isInTrial: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
  
  // Feature access methods
  canAddUnlimitedRelationships: boolean;
  canUseAdvancedAI: boolean;
  canUseSentimentAnalysis: boolean;
  canUseAICoachVideos: boolean;
  canUseBlockchainTokens: boolean;
  
  // Usage tracking
  relationshipCount: number;
  aiGenerationsToday: number;
  interactionsThisMonth: number;
  
  // Feature limits
  featureLimits: {
    maxRelationships: number;
    maxAIGenerationsPerDay: number;
    maxInteractionsPerMonth: number;
  };
  
  // Actions
  refreshSubscription: () => Promise<void>;
  checkFeatureAccess: (feature: Entitlement) => boolean;
  canPerformAction: (action: 'add_relationship' | 'ai_generation' | 'interaction') => boolean;
  trackUsage: (action: 'ai_generation' | 'interaction') => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [loading, setLoading] = useState(true);
  const [isInTrial, setIsInTrial] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [willRenew, setWillRenew] = useState(false);
  
  // Usage tracking
  const [relationshipCount, setRelationshipCount] = useState(0);
  const [aiGenerationsToday, setAiGenerationsToday] = useState(0);
  const [interactionsThisMonth, setInteractionsThisMonth] = useState(0);

  useEffect(() => {
    if (user) {
      initializeSubscription();
      fetchUsageData();
    }
  }, [user]);

  const initializeSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Initialize RevenueCat
      await revenueCat.initialize(user.id);
      
      // Get customer info
      await refreshSubscription();
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    try {
      const info = await revenueCat.getCustomerInfo();
      setCustomerInfo(info);

      if (info) {
        const tier = await revenueCat.getSubscriptionTier(info);
        setSubscriptionTier(tier);
        
        const trial = await revenueCat.isInTrialPeriod();
        setIsInTrial(trial);
        
        const expiration = await revenueCat.getSubscriptionExpirationDate();
        setExpirationDate(expiration);
        
        const renewal = await revenueCat.willRenew();
        setWillRenew(renewal);

        // Update user profile in Supabase
        await supabase
          .from('users')
          .update({ 
            subscription_status: tier,
            updated_at: new Date().toISOString()
          })
          .eq('id', user!.id);
      }
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  const fetchUsageData = async () => {
    if (!user) return;

    try {
      // Fetch relationship count
      const { count: relCount } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setRelationshipCount(relCount || 0);

      // Fetch AI generations today
      const today = new Date().toISOString().split('T')[0];
      const { count: aiCount } = await supabase
        .from('ai_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today);
      
      setAiGenerationsToday(aiCount || 0);

      // Fetch interactions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: interactionCount } = await supabase
        .from('interaction_logs')
        .select('*, relationships!inner(user_id)', { count: 'exact', head: true })
        .eq('relationships.user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());
      
      setInteractionsThisMonth(interactionCount || 0);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };

  const checkFeatureAccess = (feature: Entitlement): boolean => {
    return revenueCat.hasEntitlement(feature, customerInfo);
  };

  const canPerformAction = (action: 'add_relationship' | 'ai_generation' | 'interaction'): boolean => {
    const limits = getFeatureLimits(subscriptionTier);
    
    switch (action) {
      case 'add_relationship':
        return relationshipCount < limits.maxRelationships;
      case 'ai_generation':
        return aiGenerationsToday < limits.maxAIGenerationsPerDay;
      case 'interaction':
        return interactionsThisMonth < limits.maxInteractionsPerMonth;
      default:
        return false;
    }
  };

  const trackUsage = async (action: 'ai_generation' | 'interaction') => {
    switch (action) {
      case 'ai_generation':
        setAiGenerationsToday(prev => prev + 1);
        break;
      case 'interaction':
        setInteractionsThisMonth(prev => prev + 1);
        break;
    }
  };

  const featureLimits = getFeatureLimits(subscriptionTier);

  const value: SubscriptionContextType = {
    customerInfo,
    subscriptionTier,
    loading,
    isInTrial,
    expirationDate,
    willRenew,
    
    // Feature access
    canAddUnlimitedRelationships: checkFeatureAccess(Entitlement.UNLIMITED_RELATIONSHIPS),
    canUseAdvancedAI: checkFeatureAccess(Entitlement.ADVANCED_AI),
    canUseSentimentAnalysis: checkFeatureAccess(Entitlement.SENTIMENT_ANALYSIS),
    canUseAICoachVideos: checkFeatureAccess(Entitlement.AI_COACH_VIDEOS),
    canUseBlockchainTokens: checkFeatureAccess(Entitlement.BLOCKCHAIN_TOKENS),
    
    // Usage tracking
    relationshipCount,
    aiGenerationsToday,
    interactionsThisMonth,
    featureLimits,
    
    // Actions
    refreshSubscription,
    checkFeatureAccess,
    canPerformAction,
    trackUsage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}