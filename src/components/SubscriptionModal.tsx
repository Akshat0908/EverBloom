import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Star, Zap, Check, Sparkles, Heart, Shield, Gift } from 'lucide-react';
import { PurchasesPackage, PurchasesOffering } from '@revenuecat/purchases-js';
import { revenueCat, SubscriptionTier } from '../lib/revenuecat';
import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'premium' | 'platinum';
}

export default function SubscriptionModal({ isOpen, onClose, initialPlan = 'premium' }: SubscriptionModalProps) {
  const { subscriptionTier, refreshSubscription } = useSubscription();
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'platinum'>(initialPlan);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOfferings();
    }
  }, [isOpen]);

  const fetchOfferings = async () => {
    setLoading(true);
    try {
      const offers = await revenueCat.getOfferings();
      if (offers) {
        setOfferings(offers);
      }
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchaseLoading(true);
    try {
      await revenueCat.purchasePackage(packageToPurchase);
      await refreshSubscription();
      toast.success('🎉 Welcome to premium! Your subscription is now active.');
      onClose();
    } catch (error: any) {
      console.error('Purchase failed:', error);
      if (error.userCancelled) {
        toast.error('Purchase was cancelled');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      await revenueCat.restorePurchases();
      await refreshSubscription();
      toast.success('Purchases restored successfully!');
      onClose();
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Failed to restore purchases');
    }
  };

  const plans = {
    premium: {
      name: 'Premium',
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      price: '$9.99',
      yearlyPrice: '$99.99',
      features: [
        'Unlimited relationships',
        'Advanced AI suggestions',
        'Detailed sentiment analysis',
        'Priority support',
        'Export your data',
        'Custom themes'
      ]
    },
    platinum: {
      name: 'Platinum',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      price: '$19.99',
      yearlyPrice: '$199.99',
      features: [
        'Everything in Premium',
        'AI Coach video sessions',
        'Blockchain appreciation tokens',
        'Advanced analytics',
        'White-glove onboarding',
        'Early access to new features'
      ]
    }
  };

  const getPackageForPlan = (plan: 'premium' | 'platinum', billing: 'monthly' | 'yearly'): PurchasesPackage | null => {
    if (offerings.length === 0) return null;
    
    const packageId = `${plan}_${billing}`;
    
    for (const offering of offerings) {
      const pkg = offering.availablePackages.find(p => p.identifier === packageId);
      if (pkg) return pkg;
    }
    
    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="relative p-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-t-3xl">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">Unlock Premium Features</h2>
              <p className="text-white/90 text-lg">
                Take your relationship nurturing to the next level
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-xl p-1 flex">
                <button
                  onClick={() => setSelectedBilling('monthly')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedBilling === 'monthly'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling('yearly')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                    selectedBilling === 'yearly'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(plans).map(([planKey, plan]) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === planKey;
                const pkg = getPackageForPlan(planKey as 'premium' | 'platinum', selectedBilling);
                const price = selectedBilling === 'monthly' ? plan.price : plan.yearlyPrice;
                
                return (
                  <motion.div
                    key={planKey}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedPlan(planKey as 'premium' | 'platinum')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {planKey === 'platinum' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-800">{price}</span>
                      <span className="text-gray-600">/{selectedBilling === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pkg) handlePurchase(pkg);
                      }}
                      disabled={!pkg || purchaseLoading}
                      className={`w-full mt-6 py-3 px-6 rounded-xl font-medium transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:shadow-xl`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {purchaseLoading ? 'Processing...' : `Choose ${plan.name}`}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            {/* Features Comparison */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Why upgrade from Free?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-red-500" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">Free Plan Limits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Only 3 relationships</li>
                    <li>5 AI suggestions/day</li>
                    <li>Basic features only</li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-purple-500" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">Premium Benefits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Unlimited relationships</li>
                    <li>50 AI suggestions/day</li>
                    <li>Advanced analytics</li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">Platinum Exclusive</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>AI Coach videos</li>
                    <li>Blockchain tokens</li>
                    <li>VIP support</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                All plans include a 7-day free trial. Cancel anytime.
              </p>
              <button
                onClick={handleRestore}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Already purchased? Restore purchases
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}