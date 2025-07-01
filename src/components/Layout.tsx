import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, Users, MessageCircle, Settings, LogOut, Sparkles, User, Bell, Menu, X, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from './NotificationCenter';
import SubscriptionModal from './SubscriptionModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, userProfile } = useAuth();
  const { subscriptionTier } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/relationships', icon: Users, label: 'Relationships' },
    { path: '/ai-studio', icon: Sparkles, label: 'AI Studio' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getSubscriptionBadge = () => {
    if (subscriptionTier === 'PLATINUM') {
      return (
        <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          <Crown className="h-3 w-3" />
          <span>Platinum</span>
        </div>
      );
    } else if (subscriptionTier === 'PREMIUM') {
      return (
        <div className="flex items-center space-x-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          <span>Premium</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-soft-cream to-soft-lavender">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-primary-100 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl shadow-lg"
              >
                <Heart className="h-6 w-6 text-white animate-heartbeat" />
              </motion.div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                  EverBloom
                </h1>
                <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Nurture Every Connection</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 py-2 px-4 rounded-xl transition-all ${
                      active
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-500 hover:bg-primary-25'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'animate-float' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Subscription Badge */}
              {getSubscriptionBadge()}

              {/* Upgrade Button for Free Users */}
              {subscriptionTier === 'FREE' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSubscriptionModal(true)}
                  className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
                >
                  <Crown className="h-4 w-4" />
                  <span>Upgrade</span>
                </motion.button>
              )}

              {/* Notification Bell */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                />
              </motion.button>

              {/* User Profile */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">
                    {userProfile?.name || user?.email || 'User'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500 capitalize">
                      {subscriptionTier.toLowerCase()} plan
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings & Sign Out */}
              <div className="hidden sm:flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/settings')}
                  className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white/95 backdrop-blur-md border-t border-primary-100"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 py-3 px-4 rounded-xl transition-all ${
                        active
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-500 hover:bg-primary-25'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Mobile Upgrade Button */}
                {subscriptionTier === 'FREE' && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowSubscriptionModal(true);
                    }}
                    className="w-full flex items-center space-x-3 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium"
                  >
                    <Crown className="h-5 w-5" />
                    <span>Upgrade to Premium</span>
                  </button>
                )}
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 py-3 px-4 rounded-xl text-gray-600 hover:text-primary-500 hover:bg-primary-25 transition-all"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center space-x-3 py-3 px-4 rounded-xl text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
}