import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, Heart, Gift, MessageCircle, Check, Star, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, isWithinInterval, addDays, startOfDay, format } from 'date-fns';

interface Notification {
  id: string;
  type: 'birthday' | 'anniversary' | 'reminder' | 'suggestion' | 'milestone';
  title: string;
  message: string;
  relationshipName?: string;
  relationshipId?: string;
  date: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      generateNotifications();
    }
  }, [isOpen, user]);

  const generateNotifications = async () => {
    try {
      setLoading(true);
      const notifications: Notification[] = [];

      // Fetch relationships
      const { data: relationships, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      const today = startOfDay(new Date());
      const nextWeek = addDays(today, 7);
      const nextMonth = addDays(today, 30);

      // Generate birthday and anniversary notifications
      relationships?.forEach((relationship) => {
        const dates = relationship.important_dates_json;
        if (dates) {
          Object.entries(dates).forEach(([name, dateStr]: [string, any]) => {
            const date = new Date(dateStr);
            // Adjust to current year
            date.setFullYear(today.getFullYear());
            
            // If the date has passed this year, check next year
            if (date < today) {
              date.setFullYear(today.getFullYear() + 1);
            }

            // Check if within next 30 days
            if (isWithinInterval(date, { start: today, end: nextMonth })) {
              const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              let priority: 'low' | 'medium' | 'high' = 'low';
              if (daysUntil <= 3) priority = 'high';
              else if (daysUntil <= 7) priority = 'medium';
              
              notifications.push({
                id: `${relationship.id}-${name}`,
                type: name.toLowerCase().includes('birthday') ? 'birthday' : 'anniversary',
                title: `${name} coming up!`,
                message: `${relationship.display_name}'s ${name.toLowerCase()} is ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
                relationshipName: relationship.display_name,
                relationshipId: relationship.id,
                date: date,
                isRead: false,
                priority,
                actionUrl: '/ai-studio'
              });
            }
          });
        }

        // Generate interaction reminders for relationships that haven't been contacted recently
        const lastInteraction = relationship.last_interaction_date 
          ? new Date(relationship.last_interaction_date)
          : null;

        const daysSinceLastInteraction = lastInteraction 
          ? Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastInteraction >= 7) {
          let priority: 'low' | 'medium' | 'high' = 'low';
          if (daysSinceLastInteraction >= 30) priority = 'high';
          else if (daysSinceLastInteraction >= 14) priority = 'medium';

          notifications.push({
            id: `reminder-${relationship.id}`,
            type: 'reminder',
            title: 'Time to reconnect!',
            message: `You haven't connected with ${relationship.display_name} in ${daysSinceLastInteraction} days`,
            relationshipName: relationship.display_name,
            relationshipId: relationship.id,
            date: today,
            isRead: false,
            priority,
            actionUrl: '/messages'
          });
        }

        // Generate milestone notifications for strong relationships
        if (relationship.relationship_strength_score >= 80) {
          const createdDate = new Date(relationship.created_at);
          const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreated === 30 || daysSinceCreated === 100 || daysSinceCreated === 365) {
            notifications.push({
              id: `milestone-${relationship.id}-${daysSinceCreated}`,
              type: 'milestone',
              title: 'Relationship milestone! 🎉',
              message: `You've been nurturing your connection with ${relationship.display_name} for ${daysSinceCreated} days!`,
              relationshipName: relationship.display_name,
              relationshipId: relationship.id,
              date: today,
              isRead: false,
              priority: 'medium'
            });
          }
        }
      });

      // Fetch recent AI suggestions
      const { data: suggestions } = await supabase
        .from('ai_suggestions')
        .select('*, relationships(display_name)')
        .eq('user_id', user!.id)
        .eq('is_acted_on', false)
        .gte('generated_at', addDays(today, -3).toISOString())
        .order('generated_at', { ascending: false })
        .limit(3);

      suggestions?.forEach((suggestion) => {
        notifications.push({
          id: `suggestion-${suggestion.id}`,
          type: 'suggestion',
          title: 'New AI suggestion',
          message: suggestion.suggestion_text.slice(0, 100) + '...',
          relationshipName: suggestion.relationships?.display_name,
          relationshipId: suggestion.relationship_id,
          date: new Date(suggestion.generated_at),
          isRead: false,
          priority: 'low',
          actionUrl: '/ai-studio'
        });
      });

      // Sort by priority and date
      notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.date.getTime() - b.date.getTime();
      });

      setNotifications(notifications);
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'birthday':
      case 'anniversary':
        return Calendar;
      case 'reminder':
        return MessageCircle;
      case 'suggestion':
        return Gift;
      case 'milestone':
        return Star;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'text-red-500 bg-red-100';
    }
    
    switch (type) {
      case 'birthday':
        return 'text-accent-500 bg-accent-100';
      case 'anniversary':
        return 'text-pink-500 bg-pink-100';
      case 'reminder':
        return 'text-blue-500 bg-blue-100';
      case 'suggestion':
        return 'text-purple-500 bg-purple-100';
      case 'milestone':
        return 'text-yellow-500 bg-yellow-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityCount = notifications.filter(n => !n.isRead && n.priority === 'high').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full relative">
                  <Bell className="h-5 w-5 text-white" />
                  {highPriorityCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {unreadCount} unread {highPriorityCount > 0 && `(${highPriorityCount} urgent)`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">All caught up!</p>
                  <p className="text-sm text-gray-500">No new notifications</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type, notification.priority);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          notification.isRead 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-white border-primary-200 shadow-sm hover:shadow-md'
                        } ${notification.priority === 'high' ? 'ring-2 ring-red-200' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-800 truncate flex items-center">
                                {notification.title}
                                {notification.priority === 'high' && (
                                  <AlertTriangle className="h-3 w-3 text-red-500 ml-1" />
                                )}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              {notification.relationshipName && (
                                <span className="text-xs text-gray-500">
                                  {notification.relationshipName}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(notification.date)} ago
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={markAllAsRead}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}