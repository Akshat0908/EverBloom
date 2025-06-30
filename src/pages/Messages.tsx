import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Search, Filter, Heart, Clock, User, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  relationship_id: string;
  relationship_name: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received' | 'draft';
  interaction_log_id?: string;
}

interface Relationship {
  id: string;
  display_name: string;
  relationship_type: string;
}

interface Draft {
  id: string;
  relationship_id: string;
  content: string;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'drafts'>('messages');

  useEffect(() => {
    if (user) {
      fetchRelationships();
      fetchMessages();
      fetchDrafts();
    }
  }, [user]);

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('id, display_name, relationship_type')
        .eq('user_id', user!.id)
        .order('display_name');

      if (error) throw error;
      setRelationships(data || []);
      if (data && data.length > 0) {
        setSelectedRelationship(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Fetch interaction logs that are message-related
      const { data, error } = await supabase
        .from('interaction_logs')
        .select(`
          id,
          relationship_id,
          description,
          timestamp,
          interaction_type,
          relationships(display_name)
        `)
        .eq('interaction_type', 'MESSAGE_SENT')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const messageData: Message[] = (data || []).map(log => ({
        id: log.id,
        relationship_id: log.relationship_id,
        relationship_name: log.relationships?.display_name || 'Unknown',
        content: log.description,
        timestamp: log.timestamp,
        type: 'sent' as const,
        interaction_log_id: log.id
      }));

      setMessages(messageData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      // For now, we'll store drafts in localStorage
      // In a real app, you might want a separate drafts table
      const savedDrafts = localStorage.getItem(`drafts_${user!.id}`);
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const saveDraft = () => {
    if (!newMessage.trim() || !selectedRelationship) return;

    const draft: Draft = {
      id: Date.now().toString(),
      relationship_id: selectedRelationship,
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    const updatedDrafts = [...drafts, draft];
    setDrafts(updatedDrafts);
    localStorage.setItem(`drafts_${user!.id}`, JSON.stringify(updatedDrafts));
    
    setNewMessage('');
    toast.success('Draft saved! 📝');
  };

  const deleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem(`drafts_${user!.id}`, JSON.stringify(updatedDrafts));
    toast.success('Draft deleted');
  };

  const loadDraft = (draft: Draft) => {
    setSelectedRelationship(draft.relationship_id);
    setNewMessage(draft.content);
    setActiveTab('messages');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRelationship) return;

    const selectedRel = relationships.find(r => r.id === selectedRelationship);
    if (!selectedRel) return;

    try {
      // Log this as an interaction
      const { data, error } = await supabase
        .from('interaction_logs')
        .insert([
          {
            relationship_id: selectedRelationship,
            interaction_type: 'MESSAGE_SENT',
            description: newMessage.trim(),
            timestamp: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update relationship's last interaction date
      await supabase
        .from('relationships')
        .update({ 
          last_interaction_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRelationship);

      // Add to local messages
      const message: Message = {
        id: data.id,
        relationship_id: selectedRelationship,
        relationship_name: selectedRel.display_name,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'sent',
        interaction_log_id: data.id
      };

      setMessages(prev => [message, ...prev]);
      setNewMessage('');
      toast.success('Message sent! 💌');

      // Remove any drafts with the same content
      const updatedDrafts = drafts.filter(d => d.content !== newMessage.trim());
      setDrafts(updatedDrafts);
      localStorage.setItem(`drafts_${user!.id}`, JSON.stringify(updatedDrafts));

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.relationship_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrafts = drafts.filter(draft => {
    const relationship = relationships.find(r => r.id === draft.relationship_id);
    return draft.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           relationship?.display_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRelationshipIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'romantic': return '💕';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'friend': return '👫';
      case 'professional': return '🤝';
      default: return '❤️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0 sm:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-800">Messages</h1>
              <p className="text-gray-600">Stay connected with meaningful conversations</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Message Composer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Compose Message</h2>
              
              {relationships.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No relationships added yet</p>
                  <button
                    onClick={() => window.location.href = '/relationships'}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Add relationships to start messaging
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send to
                    </label>
                    <select
                      value={selectedRelationship}
                      onChange={(e) => setSelectedRelationship(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/70"
                    >
                      {relationships.map((relationship) => (
                        <option key={relationship.id} value={relationship.id}>
                          {getRelationshipIcon(relationship.relationship_type)} {relationship.display_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Type your heartfelt message..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {newMessage.length} characters
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Send className="h-5 w-5" />
                      <span>Send</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveDraft}
                      disabled={!newMessage.trim()}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save as draft"
                    >
                      <Plus className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Message History & Drafts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100">
              {/* Tabs */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'messages'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Messages ({filteredMessages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('drafts')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'drafts'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Drafts ({drafts.length})
                  </button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/70 text-sm"
                  />
                </div>
              </div>

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <>
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h3>
                      <p className="text-gray-600 mb-6">Start a conversation to see your message history</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-primary-50 border border-primary-200 ml-8"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-800">
                                To: {message.relationship_name}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                sent
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(message.timestamp))} ago</span>
                            </div>
                          </div>
                          <p className="text-gray-700">{message.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Drafts Tab */}
              {activeTab === 'drafts' && (
                <>
                  {filteredDrafts.length === 0 ? (
                    <div className="text-center py-12">
                      <Edit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No drafts saved</h3>
                      <p className="text-gray-600">Save message drafts to continue writing later</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredDrafts.map((draft) => {
                        const relationship = relationships.find(r => r.id === draft.relationship_id);
                        return (
                          <motion.div
                            key={draft.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-gray-50 border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-800">
                                  To: {relationship?.display_name || 'Unknown'}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  draft
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => loadDraft(draft)}
                                  className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteDraft(draft.id)}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm">{draft.content}</p>
                            <div className="text-xs text-gray-500 mt-2">
                              Saved {formatDistanceToNow(new Date(draft.created_at))} ago
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-800">💡 Message Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong>Be Authentic:</strong> Share genuine thoughts and feelings to strengthen your connection.
            </div>
            <div>
              <strong>Ask Questions:</strong> Show interest in their life and experiences.
            </div>
            <div>
              <strong>Share Memories:</strong> Reference shared experiences to deepen your bond.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}