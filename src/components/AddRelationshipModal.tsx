import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, User, Calendar, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FormData {
  display_name: string;
  relationship_type: string;
  notes: string;
  preferences: Array<{ key: string; value: string }>;
  important_dates: Array<{ name: string; date: string }>;
}

interface AddRelationshipModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRelationshipModal({ onClose, onSuccess }: AddRelationshipModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      display_name: '',
      relationship_type: 'FRIEND',
      notes: '',
      preferences: [{ key: '', value: '' }],
      important_dates: [{ name: '', date: '' }],
    }
  });

  const { fields: preferenceFields, append: appendPreference, remove: removePreference } = useFieldArray({
    control,
    name: 'preferences'
  });

  const { fields: dateFields, append: appendDate, remove: removeDate } = useFieldArray({
    control,
    name: 'important_dates'
  });

  const relationshipTypes = [
    { value: 'ROMANTIC', label: 'Romantic Partner', emoji: '💕' },
    { value: 'FAMILY', label: 'Family Member', emoji: '👨‍👩‍👧‍👦' },
    { value: 'FRIEND', label: 'Friend', emoji: '👫' },
    { value: 'PROFESSIONAL', label: 'Professional', emoji: '🤝' },
    { value: 'OTHER', label: 'Other', emoji: '❤️' },
  ];

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Please sign in to add relationships');
      return;
    }

    setLoading(true);
    try {
      // Ensure user profile exists first
      const { data: userCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1);

      if (!userCheck || userCheck.length === 0) {
        // Create user profile if it doesn't exist
        const { error: userCreateError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            },
          ]);

        if (userCreateError) {
          console.error('Error creating user profile:', userCreateError);
          toast.error('Failed to create user profile. Please try again.');
          return;
        }
      }

      // Process preferences
      const preferences = data.preferences
        .filter(p => p.key && p.value)
        .reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {});

      // Process important dates
      const importantDates = data.important_dates
        .filter(d => d.name && d.date)
        .reduce((acc, d) => ({ ...acc, [d.name]: d.date }), {});

      const { error } = await supabase
        .from('relationships')
        .insert([
          {
            user_id: user.id,
            display_name: data.display_name.trim(),
            relationship_type: data.relationship_type,
            notes: data.notes.trim() || null,
            key_preferences_json: preferences,
            important_dates_json: importantDates,
            relationship_strength_score: 50, // Starting score
          }
        ]);

      if (error) throw error;

      toast.success('Relationship added successfully! 💕');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding relationship:', error);
      toast.error(error.message || 'Failed to add relationship');
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add New Relationship</h2>
                <p className="text-sm text-gray-600">Let's start nurturing a new connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-500" />
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  {...register('display_name', { 
                    required: 'Name is required',
                    minLength: { value: 1, message: 'Name cannot be empty' }
                  })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g., Sarah, Mom, Best Friend John"
                />
                {errors.display_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.display_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {relationshipTypes.map((type) => (
                    <label key={type.value} className="relative">
                      <input
                        {...register('relationship_type', { required: 'Please select a type' })}
                        type="radio"
                        value={type.value}
                        className="sr-only peer"
                      />
                      <div className="p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-primary-300">
                        <div className="text-2xl mb-1">{type.emoji}</div>
                        <div className="text-xs font-medium text-gray-700">{type.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Any additional notes about this relationship..."
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-primary-500" />
                  Preferences & Interests
                </h3>
                <button
                  type="button"
                  onClick={() => appendPreference({ key: '', value: '' })}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>

              <div className="space-y-3">
                {preferenceFields.map((field, index) => (
                  <div key={field.id} className="flex space-x-3">
                    <input
                      {...register(`preferences.${index}.key`)}
                      type="text"
                      placeholder="e.g., Favorite food, Hobby, Love language"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <input
                      {...register(`preferences.${index}.value`)}
                      type="text"
                      placeholder="e.g., Italian cuisine, Reading, Acts of service"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {preferenceFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePreference(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Important Dates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                  Important Dates
                </h3>
                <button
                  type="button"
                  onClick={() => appendDate({ name: '', date: '' })}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>

              <div className="space-y-3">
                {dateFields.map((field, index) => (
                  <div key={field.id} className="flex space-x-3">
                    <input
                      {...register(`important_dates.${index}.name`)}
                      type="text"
                      placeholder="e.g., Birthday, Anniversary, First met"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <input
                      {...register(`important_dates.${index}.date`)}
                      type="date"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {dateFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDate(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
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
                {loading ? 'Adding...' : 'Add Relationship'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}