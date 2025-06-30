import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, Gift, Activity, Heart, Wand2, Send, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateGiftIdeas, generateActivityIdeas, craftMessage, analyzeCommunication } from '../lib/ai';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Relationship {
  id: string;
  display_name: string;
  relationship_type: string;
  key_preferences_json: any;
}

type AITool = 'message' | 'gift' | 'activity' | 'analysis';

export default function AIStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedTool, setSelectedTool] = useState<AITool>('message');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [savedSuggestions, setSavedSuggestions] = useState<any[]>([]);

  // Message Crafter State
  const [messageGoal, setMessageGoal] = useState('');
  const [messageLength, setMessageLength] = useState('medium');
  const [messageKeywords, setMessageKeywords] = useState('');

  // Gift Ideas State
  const [giftMood, setGiftMood] = useState('thoughtful');
  const [giftBudget, setGiftBudget] = useState('medium');

  // Activity Ideas State
  const [activityMood, setActivityMood] = useState('fun');

  // Communication Analysis State
  const [analysisText, setAnalysisText] = useState('');

  useEffect(() => {
    if (user) {
      fetchRelationships();
      fetchSavedSuggestions();
    }
  }, [user]);

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('id, display_name, relationship_type, key_preferences_json')
        .eq('user_id', user!.id)
        .order('display_name');

      if (error) throw error;
      setRelationships(data || []);
      if (data && data.length > 0) {
        setSelectedRelationship(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load relationships');
    }
  };

  const fetchSavedSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*, relationships(display_name)')
        .eq('user_id', user!.id)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const getSelectedRelationshipData = () => {
    return relationships.find(r => r.id === selectedRelationship);
  };

  const handleGenerate = async () => {
    if (!selectedRelationship && selectedTool !== 'analysis') {
      toast.error('Please select a relationship first');
      return;
    }

    if (selectedTool === 'analysis' && !analysisText.trim()) {
      toast.error('Please enter text to analyze');
      return;
    }

    if (selectedTool === 'message' && !messageGoal.trim()) {
      toast.error('Please enter a communication goal');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const relationshipData = getSelectedRelationshipData();
      let aiResult = '';

      switch (selectedTool) {
        case 'message':
          aiResult = await craftMessage(
            relationshipData!.display_name,
            relationshipData!.relationship_type,
            relationshipData!.key_preferences_json,
            messageGoal,
            messageLength,
            messageKeywords
          );
          break;

        case 'gift':
          aiResult = await generateGiftIdeas(
            relationshipData!.display_name,
            relationshipData!.relationship_type,
            relationshipData!.key_preferences_json,
            giftMood,
            giftBudget
          );
          break;

        case 'activity':
          aiResult = await generateActivityIdeas(
            relationshipData!.display_name,
            relationshipData!.relationship_type,
            relationshipData!.key_preferences_json,
            activityMood
          );
          break;

        case 'analysis':
          aiResult = await analyzeCommunication(
            analysisText,
            relationshipData?.relationship_type || 'FRIEND',
            relationshipData?.key_preferences_json || {}
          );
          break;

        default:
          throw new Error('Invalid tool selected');
      }

      setResult(aiResult);

      // Save suggestion to database (except for analysis)
      if (selectedTool !== 'analysis') {
        const suggestionTypeMap = {
          'message': 'MESSAGE_PROMPT',
          'gift': 'GIFT',
          'activity': 'ACTIVITY'
        };

        await supabase.from('ai_suggestions').insert([
          {
            user_id: user!.id,
            relationship_id: selectedRelationship,
            suggestion_type: suggestionTypeMap[selectedTool] as any,
            suggestion_text: aiResult,
          }
        ]);

        fetchSavedSuggestions();
      }

    } catch (error) {
      console.error('Error generating AI content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success('Copied to clipboard! 📋');
  };

  const handleFeedback = async (suggestionId: string, score: number) => {
    try {
      await supabase
        .from('ai_suggestions')
        .update({ feedback_score: score })
        .eq('id', suggestionId);
      
      toast.success('Thank you for your feedback! 💖');
      fetchSavedSuggestions();
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const tools = [
    {
      id: 'message' as AITool,
      name: 'Message Crafter',
      description: 'Craft heartfelt messages with AI assistance',
      icon: MessageCircle,
      color: 'from-primary-400 to-primary-600',
    },
    {
      id: 'gift' as AITool,
      name: 'Gift Ideas',
      description: 'Get personalized gift suggestions',
      icon: Gift,
      color: 'from-secondary-400 to-secondary-600',
    },
    {
      id: 'activity' as AITool,
      name: 'Activity Planner',
      description: 'Discover meaningful activities to share',
      icon: Activity,
      color: 'from-accent-400 to-accent-600',
    },
    {
      id: 'analysis' as AITool,
      name: 'Communication Analysis',
      description: 'Analyze and improve your messages',
      icon: Wand2,
      color: 'from-purple-400 to-purple-600',
    },
  ];

  const messageLengths = [
    { value: 'short', label: 'Short & Sweet' },
    { value: 'medium', label: 'Just Right' },
    { value: 'long', label: 'Detailed & Heartfelt' },
  ];

  const moods = [
    { value: 'thoughtful', label: 'Thoughtful' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'fun', label: 'Fun & Playful' },
    { value: 'supportive', label: 'Supportive' },
    { value: 'celebratory', label: 'Celebratory' },
  ];

  const budgets = [
    { value: 'low', label: 'Budget-Friendly (₹100-500)' },
    { value: 'medium', label: 'Moderate (₹500-2000)' },
    { value: 'high', label: 'Premium (₹2000+)' },
  ];

  if (relationships.length === 0) {
    return (
      <div className="min-h-screen pb-20 sm:pb-0 sm:ml-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Relationships Yet</h2>
          <p className="text-gray-600 mb-6">Add some relationships first to start using AI Studio</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/relationships')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Add Your First Relationship
          </motion.button>
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
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-800">AI Studio</h1>
              <p className="text-gray-600">Your personal relationship assistant</p>
            </div>
          </div>
        </motion.div>

        {/* Tool Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            
            return (
              <motion.button
                key={tool.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTool(tool.id)}
                className={`p-6 rounded-2xl text-left transition-all border-2 ${
                  isSelected
                    ? 'bg-white border-primary-300 shadow-lg'
                    : 'bg-white/60 border-gray-200 hover:border-primary-200'
                }`}
              >
                <div className={`p-3 bg-gradient-to-r ${tool.color} rounded-xl w-fit mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {tools.find(t => t.id === selectedTool)?.name}
            </h2>

            {/* Relationship Selection (not for analysis) */}
            {selectedTool !== 'analysis' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Relationship
                </label>
                <select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/70"
                >
                  {relationships.map((relationship) => (
                    <option key={relationship.id} value={relationship.id}>
                      {relationship.display_name} ({relationship.relationship_type.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tool-specific inputs */}
            {selectedTool === 'message' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication Goal *
                  </label>
                  <input
                    type="text"
                    value={messageGoal}
                    onChange={(e) => setMessageGoal(e.target.value)}
                    placeholder="e.g., express gratitude, apologize, share good news"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {messageLengths.map((length) => (
                      <button
                        key={length.value}
                        type="button"
                        onClick={() => setMessageLength(length.value)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          messageLength === length.value
                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                            : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-primary-200'
                        }`}
                      >
                        {length.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={messageKeywords}
                    onChange={(e) => setMessageKeywords(e.target.value)}
                    placeholder="e.g., our trip to Goa, your cooking, that funny moment"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {selectedTool === 'gift' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood & Occasion
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setGiftMood(mood.value)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          giftMood === mood.value
                            ? 'bg-secondary-100 text-secondary-700 border-2 border-secondary-300'
                            : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-secondary-200'
                        }`}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <div className="space-y-2">
                    {budgets.map((budget) => (
                      <button
                        key={budget.value}
                        type="button"
                        onClick={() => setGiftBudget(budget.value)}
                        className={`w-full p-3 rounded-lg text-sm font-medium transition-all text-left ${
                          giftBudget === budget.value
                            ? 'bg-secondary-100 text-secondary-700 border-2 border-secondary-300'
                            : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-secondary-200'
                        }`}
                      >
                        {budget.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTool === 'activity' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Mood
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setActivityMood(mood.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        activityMood === mood.value
                          ? 'bg-accent-100 text-accent-700 border-2 border-accent-300'
                          : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-accent-200'
                      }`}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTool === 'analysis' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Analyze *
                </label>
                <textarea
                  value={analysisText}
                  onChange={(e) => setAnalysisText(e.target.value)}
                  rows={6}
                  placeholder="Paste your message here for AI analysis and suggestions..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  <span>AI is thinking...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Generate</span>
                </>
              )}
            </motion.button>

            {/* Result Panel */}
            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Result</h3>
                <div className="bg-gradient-to-r from-soft-pink to-soft-lavender rounded-xl p-6">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {result}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/50 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span>Generated with love by AI</span>
                    </div>
                    <button
                      onClick={handleCopyResult}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Saved Suggestions Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recent Suggestions</h2>
              <button
                onClick={fetchSavedSuggestions}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {savedSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Your AI suggestions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {suggestion.suggestion_type.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(suggestion.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {suggestion.suggestion_text.slice(0, 100)}...
                    </p>
                    {suggestion.relationships && (
                      <p className="text-xs text-gray-500 mb-2">
                        For: {suggestion.relationships.display_name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFeedback(suggestion.id, 5)}
                          className="p-1 text-green-500 hover:text-green-600 transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFeedback(suggestion.id, 1)}
                          className="p-1 text-red-500 hover:text-red-600 transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(suggestion.suggestion_text)}
                        className="text-primary-600 hover:text-primary-700 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}