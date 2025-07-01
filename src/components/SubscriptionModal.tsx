import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Star, Zap, Check, Loader } from 'lucide-react';
import { PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-js';
import { revenueCatService } from '../lib/revenuecat';
import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { refreshCustomerInfo } = useSubscription();
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchOfferings();
    }
  }, [isOpen]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const fetchedOfferings = await revenueCatService.getOfferings();
      setOfferings(fetchedOfferings);
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
      toast.error('Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setPurchasing(packageToPurchase.identifier);
      await revenueCatService.purchasePackage(packageToPurchase);
      await refreshCustomerInfo();
      toast.success('Subscription activated! Welcome to premium! 🎉');
      onClose();
    } catch (error: any) {
      console.error('Purchase failed:', error);
      if (error.userCancelled) {
        toast.error('Purchase cancelled');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (identifier: string) => {
    if (identifier.toLowerCase().includes('platinum')) {
      return Crown;
    } else if (identifier.toLowerCase().includes('premium')) {
      return Star;
    }
    return Zap;
  };

  const getPackageColor = (identifier: string) => {
    if (identifier.toLowerCase().includes('platinum')) {
      return 'from-purple-400 to-purple-600';
    } else if (identifier.toLowerCase().includes('premium')) {
      return 'from-primary-400 to-primary-600';
    }
    return 'from-blue-400 to-blue-600';
  };

  const getPackageFeatures = (identifier: string) => {
    if (identifier.toLowerCase().includes('platinum')) {
      return [
        'Unlimited relationships',
        'Unlimited AI suggestions',
        'Priority support',
        'Advanced analytics',
        'Custom reminders',
        'Data export',
        'Early access to new features'
      ];
    } else if (identifier.toLowerCase().includes('premium')) {
      return [
        'Unlimited relationships',
        'Unlimited AI suggestions',
        'Advanced analytics',
        'Custom reminders',
        'Data export'
      ];
    }
    return [];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Choose Your Plan</h2>
                <p className="text-gray-600">Unlock the full potential of EverBloom</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-primary-500" />
                  <span className="ml-3 text-gray-600">Loading subscription options...</span>
                </div>
              ) : offerings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No subscription options available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {offerings.map((offering) => 
                    offering.availablePackages.map((pkg) => {
                      const Icon = getPackageIcon(pkg.identifier);
                      const colorClass = getPackageColor(pkg.identifier);
                      const features = getPackageFeatures(pkg.identifier);
                      const isPurchasing = purchasing === pkg.identifier;

                      return (
                        <motion.div
                          key={pkg.identifier}
                          whileHover={{ scale: 1.02 }}
                          className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all"
                        >
                          {/* Popular badge for premium */}
                          {pkg.identifier.toLowerCase().includes('premium') && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                Most Popular
                              </span>
                            </div>
                          )}

                          <div className="text-center mb-6">
                            <div className={`w-16 h-16 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              {pkg.product.title}
                            </h3>
                            <div className="text-3xl font-bold text-gray-800 mb-1">
                              {pkg.product.priceString}
                            </div>
                            <p className="text-sm text-gray-600">
                              {pkg.packageType}
                            </p>
                          </div>

                          <div className="space-y-3 mb-6">
                            {features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePurchase(pkg)}
                            disabled={isPurchasing}
                            className={`w-full bg-gradient-to-r ${colorClass} text-white py-3 px-6 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                          >
                            {isPurchasing ? (
                              <>
                                <Loader className="h-5 w-5 animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <span>Subscribe Now</span>
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  All subscriptions include a 7-day free trial. Cancel anytime.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await revenueCatService.restorePurchases();
                      await refreshCustomerInfo();
                      toast.success('Purchases restored!');
                    } catch (error) {
                      toast.error('No purchases to restore');
                    }
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Restore Purchases
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}