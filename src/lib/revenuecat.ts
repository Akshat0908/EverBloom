import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from "@revenuecat/purchases-js";

// RevenueCat configuration
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  PLATINUM = 'PLATINUM'
}

export interface SubscriptionFeatures {
  maxRelationships: number;
  unlimitedAI: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  customReminders: boolean;
  exportData: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  [SubscriptionTier.FREE]: {
    maxRelationships: 3,
    unlimitedAI: false,
    prioritySupport: false,
    advancedAnalytics: false,
    customReminders: false,
    exportData: false,
  },
  [SubscriptionTier.PREMIUM]: {
    maxRelationships: -1, // unlimited
    unlimitedAI: true,
    prioritySupport: false,
    advancedAnalytics: true,
    customReminders: true,
    exportData: true,
  },
  [SubscriptionTier.PLATINUM]: {
    maxRelationships: -1, // unlimited
    unlimitedAI: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customReminders: true,
    exportData: true,
  },
};

class RevenueCatService {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized || !REVENUECAT_PUBLIC_KEY) {
      return;
    }

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_KEY,
        appUserId: userId,
      });
      
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error) {
      console.error('Failed to purchase package:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  getSubscriptionTier(customerInfo: CustomerInfo): SubscriptionTier {
    const activeEntitlements = customerInfo.entitlements.active;
    
    if (activeEntitlements['platinum']) {
      return SubscriptionTier.PLATINUM;
    } else if (activeEntitlements['premium']) {
      return SubscriptionTier.PREMIUM;
    } else {
      return SubscriptionTier.FREE;
    }
  }

  getFeatures(tier: SubscriptionTier): SubscriptionFeatures {
    return SUBSCRIPTION_FEATURES[tier];
  }

  async logout(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();