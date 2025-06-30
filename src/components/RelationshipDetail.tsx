import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Calendar, MessageCircle, Gift, TrendingUp, Clock, Edit, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import InteractionLogger from './InteractionLogger';
import toast from 'react-hot-toast';

interface Relationship {
  id: string;
  display_name: string;
  relationship_type: string;
  relationship_strength_score: number;
  last_interaction_date: string | null;
  important_dates_json: any;
  key_preferences_json: any;
  notes: string | null;
  created_at: string;
}

interface InteractionLog {
  id: string;
  timestamp: string;
  interaction_type: string;
  description: string;
}

interface RelationshipDetailProps {
  relationship: Relationship;
  onClose: () => void;
  onUpdate: () => void;
}

export default function RelationshipDetail({ relationship, onClose, onUpdate }: RelationshipDetailProps) {
  const [interactions, setInteractions] = useState<InteractionLog[]>([]);
  const [showInteractionLogger, setShowInteractionLogger] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInteractions();
  }, [relationship.id]);

  const fetchInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('interaction_logs')
        .select('*')
        .eq('relationship_id', relationship.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'romantic': return '💕';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'friend': return '👫';
      case 'professional': return '🤝';
      default: return '❤️';
    }
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-500';
    if (score >= 60) return 'from-yellow-400 to-yellow-500';
    if (score >= 40) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  const getStrengthText = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'CONVERSATION': return MessageCircle;
      case 'MESSAGE_SENT': return MessageCircle;
      case 'GIFT_SENT': return Gift;
      case 'DATE_PLANNED': return Calendar;
      default: return Heart;
    }
  };

  const handleInteractionLogged = () => {
    setShowInteractionLogger(false);
    fetchInteractions();
    onUpdate();
  };

  const renderImportantDates = () => {
    const dates = relationship.important_dates_json;
    if (!dates || Object.keys(dates).length === 0) return null;

    return (
      <div className="space-y-2">
        {Object.entries(dates).map(([name, date]: [string, any]) => (
          <div key={name} className="flex justify-between items-center p-3 bg-accent-50 rounded-lg">
            <span className="font-medium text-gray-700 capitalize">{name}</span>
            <span className="text-sm text-gray-600">{format(new Date(date), 'MMM dd')}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderPreferences = () => {
    const preferences = relationship.key_preferences_json;
    if (!preferences || Object.keys(preferences).length === 0) return null;

    return (
      <div className="space-y-2">
        {Object.entries(preferences).map(([key, value]: [string, any]) => (
          <div key={key} className="p-3 bg-primary-50 rounded-lg">
            <div className="font-medium text-gray-700 capitalize mb-1">{key}</div>
            <div className="text-sm text-gray-600">{value}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getRelationshipIcon(relationship.relationship_type)}</div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{relationship.display_name}</h2>
                <p className="text-gray-600 capitalize">{relationship.relationship_type.toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInteractionLogger(true)}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Log Interaction</span>
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Overview */}
            <div className="lg:col-span-1 space-y-6">
              {/* Relationship Strength */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
                    Connection Strength
                  </h3>
                  <span className="text-sm font-semibold text-gray-700">
                    {getStrengthText(relationship.relationship_strength_score)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${relationship.relationship_strength_score}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-3 rounded-full bg-gradient-to-r ${getStrengthColor(relationship.relationship_strength_score)}`}
                  />
                </div>
                <p className="text-sm text-gray-600">{relationship.relationship_strength_score}% strength</p>
              </div>

              {/* Last Interaction */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary-500" />
                  Last Interaction
                </h3>
                <p className="text-gray-600">
                  {relationship.last_interaction_date
                    ? formatDistanceToNow(new Date(relationship.last_interaction_date)) + ' ago'
                    : 'No recent interactions'
                  }
                </p>
              </div>

              {/* Important Dates */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                  Important Dates
                </h3>
                {renderImportantDates() || (
                  <p className="text-gray-500 text-sm">No important dates added</p>
                )}
              </div>

              {/* Preferences */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-primary-500" />
                  Preferences
                </h3>
                {renderPreferences() || (
                  <p className="text-gray-500 text-sm">No preferences added</p>
                )}
              </div>

              {/* Notes */}
              {relationship.notes && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Notes</h3>
                  <p className="text-gray-600 text-sm">{relationship.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Interaction History */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-6 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary-500" />
                  Recent Interactions
                </h3>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : interactions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No interactions logged yet</p>
                    <button
                      onClick={() => setShowInteractionLogger(true)}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Log Your First Interaction
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interactions.map((interaction) => {
                      const Icon = getInteractionIcon(interaction.interaction_type);
                      return (
                        <motion.div
                          key={interaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-primary-100 rounded-full">
                              <Icon className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 capitalize">
                                  {interaction.interaction_type.toLowerCase().replace('_', ' ')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(interaction.timestamp), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{interaction.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interaction Logger Modal */}
        {showInteractionLogger && (
          <InteractionLogger
            relationshipId={relationship.id}
            relationshipName={relationship.display_name}
            onClose={() => setShowInteractionLogger(false)}
            onSuccess={handleInteractionLogged}
          />
        )}
      </div>
    </AnimatePresence>
  );
}