import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Heart, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface SettingsFormData {
  name: string;
  email: string;
  preferred_ai_tone: string;
  locale: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    frequency: string;
  };
}

export default function Settings() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SettingsFormData>();

  useEffect(() => {
    if (userProfile) {
      setValue('name', userProfile.name || '');
      setValue('email', userProfile.email || '');
      setValue('preferred_ai_tone', userProfile.preferred_ai_tone || 'WARM');
      setValue('locale', userProfile.locale || 'en-US');
      setValue('notification_preferences', userProfile.notification_preferences || {
        email: true,
        push: true,
        frequency: 'daily'
      });
    }
  }, [userProfile, setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          preferred_ai_tone: data.preferred_ai_tone,
          locale: data.locale,
          notification_preferences: data.notification_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshUserProfile();
      toast.success('Settings updated successfully! 💖');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'AI Preferences', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const aiTones = [
    { value: 'WARM', label: 'Warm & Friendly', description: 'Caring and supportive tone' },
    { value: 'EMPATHETIC', label: 'Empathetic', description: 'Understanding and compassionate' },
    { value: 'PRACTICAL', label: 'Practical', description: 'Direct and solution-focused' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'never', label: 'Never' },
  ];

  const locales = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'hi-IN', label: 'Hindi (India)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
  ];

  return (
    <div className="min-h-screen pb-20 sm:pb-0 sm:ml-64">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-800">Settings</h1>
              <p className="text-gray-600">Customize your EverBloom experience</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 py-3 px-4 rounded-xl transition-all text-left ${
                        isActive
                          ? 'text-primary-600 bg-primary-50 shadow-sm'
                          : 'text-gray-600 hover:text-primary-500 hover:bg-primary-25'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <User className="h-6 w-6 text-primary-500" />
                      <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          {...register('name', { required: 'Name is required' })}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          {...register('email')}
                          type="email"
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          {...register('locale')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          {locales.map((locale) => (
                            <option key={locale.value} value={locale.value}>
                              {locale.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subscription Plan
                        </label>
                        <div className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                          <span className="capitalize font-medium text-gray-700">
                            {userProfile?.subscription_status?.toLowerCase() || 'Free'}
                          </span>
                          {userProfile?.subscription_status === 'FREE' && (
                            <button
                              type="button"
                              className="ml-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Upgrade
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Bell className="h-6 w-6 text-primary-500" />
                      <h2 className="text-xl font-semibold text-gray-800">Notification Preferences</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-800">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            {...register('notification_preferences.email')}
                            type="checkbox"
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-800">Push Notifications</h3>
                          <p className="text-sm text-gray-600">Receive push notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            {...register('notification_preferences.push')}
                            type="checkbox"
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notification Frequency
                        </label>
                        <select
                          {...register('notification_preferences.frequency')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          {frequencies.map((freq) => (
                            <option key={freq.value} value={freq.value}>
                              {freq.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Palette className="h-6 w-6 text-primary-500" />
                      <h2 className="text-xl font-semibold text-gray-800">AI Preferences</h2>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        AI Communication Tone
                      </label>
                      <div className="space-y-3">
                        {aiTones.map((tone) => (
                          <label key={tone.value} className="relative">
                            <input
                              {...register('preferred_ai_tone')}
                              type="radio"
                              value={tone.value}
                              className="sr-only peer"
                            />
                            <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-primary-300">
                              <div className="font-medium text-gray-800 mb-1">{tone.label}</div>
                              <div className="text-sm text-gray-600">{tone.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Shield className="h-6 w-6 text-primary-500" />
                      <h2 className="text-xl font-semibold text-gray-800">Privacy & Security</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-medium text-gray-800 mb-2">Data Privacy</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Your relationship data is encrypted and stored securely. We never share your personal information with third parties.
                        </p>
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Privacy Policy
                        </button>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-medium text-gray-800 mb-2">Export Data</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Download a copy of all your relationship data and interactions.
                        </p>
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Request Data Export
                        </button>
                      </div>

                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
                        <p className="text-sm text-red-600 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Save className="h-5 w-5" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}