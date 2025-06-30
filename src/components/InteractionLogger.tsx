import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageCircle, Gift, Coffee, Phone, Heart, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface InteractionLoggerProps {
  relationshipId: string;
  relationshipName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  interaction_type: string;
  description: string;
  timestamp: string;
}

export default function InteractionLogger({ relationshipId, relationshipName, onClose, onSuccess }: InteractionLoggerProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      timestamp: new Date().toISOString().slice(0, 16),
    }
  });

  const interactionTypes = [
    { value: 'CONVERSATION', label: 'Had a conversation', icon: MessageCircle, color: 'text-blue-500' },
    { value: 'MESSAGE_SENT', label: 'Sent a message', icon: MessageCircle, color: 'text-green-500' },
    { value: 'GIFT_SENT', label: 'Gave a gift', icon: Gift, color: 'text-purple-500' },
    { value: 'DATE_PLANNED', label: 'Spent time together', icon: Coffee, color: 'text-orange-500' },
    { value: 'REMINDER_RECEIVED', label: 'Received reminder', icon: Calendar, color: 'text-indigo-500' },
    { value: 'OTHER', label: 'Other interaction', icon: Heart, color: 'text-pink-500' },
  ];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Log the interaction
      const { error: logError } = await supabase
        .from('interaction_logs')
        .insert([
          {
            relationship_id: relationshipId,
            interaction_type: data.interaction_type,
            description: data.description,
            timestamp: data.timestamp,
          }
        ]);

      if (logError) throw logError;

      // Update relationship's last interaction date
      const { error: updateError } = await supabase
        .from('relationships')
        .update({ 
          last_interaction_date: data.timestamp,
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId);

      if (updateError) throw updateError;

      toast.success('Interaction logged successfully! 💕');
      onSuccess();
    } catch (error: any) {
      console.error('Error logging interaction:', error);
      toast.error(error.message || 'Failed to log interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Log Interaction</h2>
                <p className="text-sm text-gray-600">with {relationshipName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What did you do together?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {interactionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label key={type.value} className="relative">
                      <input
                        {...register('interaction_type', { required: 'Please select an interaction type' })}
                        type="radio"
                        value={type.value}
                        className="sr-only peer"
                      />
                      <div className="p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-primary-300">
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${type.color}`} />
                        <div className="text-xs font-medium text-gray-700">{type.label}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.interaction_type && (
                <p className="mt-1 text-sm text-red-600">{errors.interaction_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When did this happen?
              </label>
              <input
                {...register('timestamp', { required: 'Please select a date and time' })}
                type="datetime-local"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {errors.timestamp && (
                <p className="mt-1 text-sm text-red-600">{errors.timestamp.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us more about it
              </label>
              <textarea
                {...register('description', { 
                  required: 'Please describe the interaction',
                  minLength: { value: 5, message: 'Please provide more details' }
                })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Had coffee and caught up about work, Sent birthday wishes, Gave a thoughtful book..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging...' : 'Log Interaction'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}