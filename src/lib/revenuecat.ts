import Purchases, { PurchasesPackage, CustomerInfo, PurchasesOffering } from '@revenuecat/purchases-js';

// RevenueCat configuration
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

// Subscription tiers
export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  PLATINUM = 'PLATINUM'
}

// Feature entitlements
export enum Entitlement {
  UNLIMITED_RELATIONSHIPS = 'unlimited_relationships',
  ADVANCED_AI = 'advanced_ai',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  PRIORITY_SUPPORT = 'priority_support',
  AI_COACH_VIDEOS = 'ai_coach_videos',
  BLOCKCHAIN_TOKENS = 'blockchain_tokens',
  EXPORT_DATA = 'export_data',
  CUSTOM_THEMES = 'custom_themes'
}

// Package identifiers (these should match your RevenueCat dashboard)
export const PACKAGE_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  PLATINUM_MONTHLY: 'platinum_monthly',
  PLATINUM_YEARLY: 'platinum_yearly'
};

class RevenueCatService {
  private initialized = false;

  async initialize(userId: string): Promise<void> {
    if (!REVENUECAT_PUBLIC_KEY) {
      console.warn('RevenueCat public key not found, subscription features will be limited');
      return;
    }

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_KEY,
        appUserId: userId
      });
      
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) return null;

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[] | null> {
    if (!this.initialized) return null;

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all ? Object.values(offerings.all) : null;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.initialized) return null;

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!this.initialized) return null;

    try {
      return await Purchases.restorePurchases();
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return null;
    }
  }

  async getSubscriptionTier(customerInfo?: CustomerInfo): Promise<SubscriptionTier> {
    if (!this.initialized) return SubscriptionTier.FREE;

    try {
      const info = customerInfo || await this.getCustomerInfo();
      if (!info) return SubscriptionTier.FREE;

      // Check for Platinum entitlements first
      if (info.entitlements.active[Entitlement.AI_COACH_VIDEOS] || 
          info.entitlements.active[Entitlement.BLOCKCHAIN_TOKENS]) {
        return SubscriptionTier.PLATINUM;
      }

      // Check for Premium entitlements
      if (info.entitlements.active[Entitlement.UNLIMITED_RELATIONSHIPS] || 
          info.entitlements.active[Entitlement.ADVANCED_AI]) {
        return SubscriptionTier.PREMIUM;
      }

      return SubscriptionTier.FREE;
    } catch (error) {
      console.error('Failed to get subscription tier:', error);
      return SubscriptionTier.FREE;
    }
  }

  hasEntitlement(entitlement: Entitlement, customerInfo?: CustomerInfo): boolean {
    if (!this.initialized || !customerInfo) return false;
    return !!customerInfo.entitlements.active[entitlement];
  }

  async checkFeatureAccess(feature: Entitlement): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      const customerInfo = await this.getCustomerInfo();
      return this.hasEntitlement(feature, customerInfo);
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  // Feature-specific access checks
  async canAddUnlimitedRelationships(): Promise<boolean> {
    return await this.checkFeatureAccess(Entitlement.UNLIMITED_RELATIONSHIPS);
  }

  async canUseAdvancedAI(): Promise<boolean> {
    return await this.checkFeatureAccess(Entitlement.ADVANCED_AI);
  }

  async canUseSentimentAnalysis(): Promise<boolean> {
    return await this.checkFeatureAccess(Entitlement.SENTIMENT_ANALYSIS);
  }

  async canUseAICoachVideos(): Promise<boolean> {
    return await this.checkFeatureAccess(Entitlement.AI_COACH_VIDEOS);
  }

  async canUseBlockchainTokens(): Promise<boolean> {
    return await this.checkFeatureAccess(Entitlement.BLOCKCHAIN_TOKENS);
  }

  // Trial management
  async isInTrialPeriod(): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      // Check if any active entitlement is in trial period
      return Object.values(customerInfo.entitlements.active).some(
        entitlement => entitlement.willRenew && entitlement.periodType === 'trial'
      );
    } catch (error) {
      console.error('Failed to check trial status:', error);
      return false;
    }
  }

  // Subscription management
  async getSubscriptionExpirationDate(): Promise<Date | null> {
    if (!this.initialized) return null;

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return null;

      const activeEntitlements = Object.values(customerInfo.entitlements.active);
      if (activeEntitlements.length === 0) return null;

      // Get the latest expiration date
      const expirationDates = activeEntitlements
        .map(entitlement => new Date(entitlement.expirationDate))
        .filter(date => !isNaN(date.getTime()));

      return expirationDates.length > 0 ? new Date(Math.max(...expirationDates.map(d => d.getTime()))) : null;
    } catch (error) {
      console.error('Failed to get subscription expiration:', error);
      return null;
    }
  }

  async willRenew(): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      return Object.values(customerInfo.entitlements.active).some(
        entitlement => entitlement.willRenew
      );
    } catch (error) {
      console.error('Failed to check renewal status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const revenueCat = new RevenueCatService();

// Utility functions for feature limits
export const FEATURE_LIMITS = {
  FREE: {
    maxRelationships: 3,
    maxAIGenerationsPerDay: 5,
    maxInteractionsPerMonth: 50
  },
  PREMIUM: {
    maxRelationships: Infinity,
    maxAIGenerationsPerDay: 50,
    maxInteractionsPerMonth: Infinity
  },
  PLATINUM: {
    maxRelationships: Infinity,
    maxAIGenerationsPerDay: Infinity,
    maxInteractionsPerMonth: Infinity
  }
};

export function getFeatureLimits(tier: SubscriptionTier) {
  return FEATURE_LIMITS[tier];
}