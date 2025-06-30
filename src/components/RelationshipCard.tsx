import React, { useState } from 'react';
import { Heart, Calendar, MessageCircle, Gift, Clock, MoreVertical, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format, isWithinInterval, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import RelationshipDetail from './RelationshipDetail';
import InteractionLogger from './InteractionLogger';

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

interface RelationshipCardProps {
  relationship: Relationship;
  onClick: () => void;
  onUpdate?: () => void;
}

export default function RelationshipCard({ relationship, onClick, onUpdate }: RelationshipCardProps) {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  const [showInteractionLogger, setShowInteractionLogger] = useState(false);

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

  const hasUpcomingEvent = () => {
    const dates = relationship.important_dates_json;
    if (!dates) return false;
    
    const today = new Date();
    const nextMonth = addDays(today, 30);
    
    return Object.values(dates).some((dateStr: any) => {
      if (typeof dateStr !== 'string') return false;
      const date = new Date(dateStr);
      date.setFullYear(today.getFullYear());
      if (date < today) {
        date.setFullYear(today.getFullYear() + 1);
      }
      return isWithinInterval(date, { start: today, end: nextMonth });
    });
  };

  const getNextEvent = () => {
    const dates = relationship.important_dates_json;
    if (!dates) return null;
    
    const today = new Date();
    let nextEvent = null;
    let minDays = Infinity;
    
    Object.entries(dates).forEach(([name, dateStr]: [string, any]) => {
      if (typeof dateStr !== 'string') return;
      const date = new Date(dateStr);
      date.setFullYear(today.getFullYear());
      if (date < today) {
        date.setFullYear(today.getFullYear() + 1);
      }
      const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < minDays && daysUntil <= 30) {
        minDays = daysUntil;
        nextEvent = { name, date, daysUntil };
      }
    });
    
    return nextEvent;
  };

  const handleCardClick = () => {
    setShowDetail(true);
  };

  const handleQuickMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInteractionLogger(true);
  };

  const handleQuickGift = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/ai-studio');
  };

  const handleInteractionLogged = () => {
    setShowInteractionLogger(false);
    if (onUpdate) onUpdate();
  };

  const handleDetailUpdate = () => {
    if (onUpdate) onUpdate();
  };

  const nextEvent = getNextEvent();
  const needsAttention = relationship.relationship_strength_score < 50 || 
    (relationship.last_interaction_date && 
     Math.floor((Date.now() - new Date(relationship.last_interaction_date).getTime()) / (1000 * 60 * 60 * 24)) > 14);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-100 cursor-pointer group relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-25 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {getRelationshipIcon(relationship.relationship_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                {relationship.display_name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {relationship.relationship_type.toLowerCase()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {needsAttention && (
              <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                ⚠️ Needs Care
              </div>
            )}
            {nextEvent && (
              <div className="bg-accent-100 text-accent-600 px-2 py-1 rounded-full text-xs font-medium">
                🎉 {nextEvent.name} in {nextEvent.daysUntil}d
              </div>
            )}
            {relationship.relationship_strength_score >= 80 && (
              <div className="text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
              </div>
            )}
          </div>
        </div>

        {/* Relationship Strength */}
        <div className="mb-4 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Connection Strength
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {getStrengthText(relationship.relationship_strength_score)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${relationship.relationship_strength_score}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-2 rounded-full bg-gradient-to-r ${getStrengthColor(relationship.relationship_strength_score)}`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {relationship.relationship_strength_score}% strength
          </div>
        </div>

        {/* Last Interaction */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4 relative z-10">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>
              {relationship.last_interaction_date
                ? `${formatDistanceToNow(new Date(relationship.last_interaction_date))} ago`
                : 'No recent interactions'
              }
            </span>
          </div>
          {relationship.relationship_strength_score >= 70 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="h-4 w-4 text-red-400 fill-current" />
            </motion.div>
          )}
        </div>

        {/* Preferences Preview */}
        {relationship.key_preferences_json && Object.keys(relationship.key_preferences_json).length > 0 && (
          <div className="mb-4 relative z-10">
            <div className="text-xs text-gray-500 mb-1">Preferences</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(relationship.key_preferences_json).slice(0, 2).map(([key, value]: [string, any]) => (
                <span key={key} className="bg-primary-50 text-primary-600 px-2 py-1 rounded text-xs">
                  {key}: {typeof value === 'string' ? value.slice(0, 10) : value}
                </span>
              ))}
              {Object.keys(relationship.key_preferences_json).length > 2 && (
                <span className="text-xs text-gray-400">+{Object.keys(relationship.key_preferences_json).length - 2} more</span>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickMessage}
            className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-600 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Log Chat</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickGift}
            className="flex-1 bg-secondary-50 hover:bg-secondary-100 text-secondary-600 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Gift className="h-4 w-4" />
            <span>Gift Ideas</span>
          </motion.button>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      </motion.div>

      {/* Relationship Detail Modal */}
      {showDetail && (
        <RelationshipDetail
          relationship={relationship}
          onClose={() => setShowDetail(false)}
          onUpdate={handleDetailUpdate}
        />
      )}

      {/* Interaction Logger Modal */}
      {showInteractionLogger && (
        <InteractionLogger
          relationshipId={relationship.id}
          relationshipName={relationship.display_name}
          onClose={() => setShowInteractionLogger(false)}
          onSuccess={handleInteractionLogged}
        />
      )}
    </>
  );
}