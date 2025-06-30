import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Plus, Sparkles, Heart, Users, Calendar, TrendingUp, ArrowRight, Star, Zap, Target, Award, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RelationshipCard from '../components/RelationshipCard';
import AddRelationshipModal from '../components/AddRelationshipModal';
import SplineScene from '../components/SplineScene';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Relationship {
  id: string;
  display_name: string;
  relationship_type: string;
  relationship_strength_score: number;
  last_interaction_date: string | null;
  important_dates_json: any;
  key_preferences_json: any;
}

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRelationships: 0,
    strongConnections: 0,
    interactionsThisWeek: 0,
    upcomingDates: 0,
  });

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], [0, -200]);
  const textY = useTransform(scrollY, [0, 600], [0, -100]);
  const splineY = useTransform(scrollY, [0, 800], [0, 100]);
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const textScale = useTransform(scrollY, [0, 400], [1, 0.98]);

  useEffect(() => {
    if (user) {
      fetchRelationships();
    }
  }, [user]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', user!.id)
        .order('relationship_strength_score', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching relationships:', error);
        return;
      }

      setRelationships(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (relationshipsData: Relationship[]) => {
    const totalRelationships = relationshipsData.length;
    const strongConnections = relationshipsData.filter(r => r.relationship_strength_score >= 70).length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const interactionsThisWeek = relationshipsData.filter(r => 
      r.last_interaction_date && new Date(r.last_interaction_date) > oneWeekAgo
    ).length;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const upcomingDates = relationshipsData.reduce((count, relationship) => {
      const dates = relationship.important_dates_json;
      if (!dates) return count;
      
      Object.values(dates).forEach((dateStr: any) => {
        if (typeof dateStr === 'string') {
          const date = new Date(dateStr);
          date.setFullYear(today.getFullYear());
          if (date < today) {
            date.setFullYear(today.getFullYear() + 1);
          }
          if (date <= thirtyDaysFromNow) {
            count++;
          }
        }
      });
      
      return count;
    }, 0);

    setStats({
      totalRelationships,
      strongConnections,
      interactionsThisWeek,
      upcomingDates,
    });
  };

  const handleRelationshipAdded = () => {
    fetchRelationships();
    setShowAddModal(false);
    toast.success('Relationship added successfully! 💕');
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Get personalized suggestions to strengthen your relationships with thoughtful gestures and meaningful conversations.",
      color: "from-purple-400 to-purple-600"
    },
    {
      icon: Heart,
      title: "Relationship Tracking",
      description: "Monitor connection strength and interaction history to maintain meaningful bonds with everyone you care about.",
      color: "from-pink-400 to-pink-600"
    },
    {
      icon: Calendar,
      title: "Smart Reminders",
      description: "Never miss important dates or forget to reach out. Get intelligent nudges to stay connected.",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: Target,
      title: "Personalized Suggestions",
      description: "Receive tailored gift ideas, activity recommendations, and conversation starters based on individual preferences.",
      color: "from-green-400 to-green-600"
    }
  ];

  const achievements = [
    { icon: Star, label: "Relationship Expert", value: stats.strongConnections, suffix: " strong bonds" },
    { icon: Zap, label: "Active Connector", value: stats.interactionsThisWeek, suffix: " this week" },
    { icon: Award, label: "Thoughtful Friend", value: stats.upcomingDates, suffix: " upcoming events" },
  ];

  // Get user's display name
  const getUserDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Beautiful Soul';
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section with Spline */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Spline 3D Scene Background with parallax */}
        <motion.div 
          style={{ y: splineY }}
          className="absolute inset-0 z-0"
        >
          <SplineScene 
            className="w-full h-full scale-110" 
            fallbackHeight="100vh"
          />
        </motion.div>

        {/* Content positioned strategically with transparent text effect */}
        <motion.div 
          style={{ 
            y: textY, 
            opacity: textOpacity,
            scale: textScale
          }}
          className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {relationships.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl border border-white/30"
              >
                <Heart className="h-16 w-16 text-white animate-heartbeat drop-shadow-2xl" />
              </motion.div>
              
              {/* Transparent text effect - see through to Spline scene */}
              <div className="mb-8 max-w-6xl">
                <h1 className="text-5xl lg:text-8xl font-display font-black mb-6 leading-tight">
                  {/* Transparent text with stroke outline */}
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      WebkitTextStroke: '2px rgba(255, 255, 255, 0.8)',
                      textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                  >
                    Welcome to{' '}
                  </span>
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      WebkitTextStroke: '2px rgba(236, 72, 153, 0.9)',
                      textShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                      filter: 'drop-shadow(0 4px 8px rgba(236, 72, 153, 0.2))'
                    }}
                  >
                    EverBloom
                  </span>
                </h1>
                
                <p 
                  className="text-xl lg:text-3xl font-semibold leading-relaxed text-transparent"
                  style={{
                    WebkitTextStroke: '1px rgba(255, 255, 255, 0.7)',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                  }}
                >
                  Your AI-powered companion for nurturing meaningful relationships. 
                  Start by adding your first connection and watch your bonds flourish.
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="bg-white/20 backdrop-blur-xl text-white px-12 py-6 rounded-2xl font-semibold text-lg flex items-center space-x-3 shadow-2xl hover:shadow-3xl transition-all border border-white/30 hover:bg-white/30"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                <Plus className="h-6 w-6" />
                <span>Begin Your Journey</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center"
            >
              {/* Transparent welcome message with see-through effect */}
              <div className="max-w-6xl mb-8">
                <h1 className="text-4xl lg:text-7xl font-display font-black mb-6 leading-tight">
                  {/* Transparent "Welcome back," */}
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      WebkitTextStroke: '2px rgba(255, 255, 255, 0.8)',
                      textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                  >
                    Welcome back,{' '}
                  </span>
                  
                  {/* Transparent username with colorful stroke */}
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      WebkitTextStroke: '2px rgba(236, 72, 153, 0.9)',
                      textShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                      filter: 'drop-shadow(0 4px 8px rgba(236, 72, 153, 0.2))'
                    }}
                  >
                    {getUserDisplayName()}
                  </span>
                  
                  {/* Transparent exclamation and emoji */}
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      WebkitTextStroke: '2px rgba(255, 255, 255, 0.8)',
                      textShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                  >
                    ! 
                  </span>
                  <span className="text-4xl ml-2 drop-shadow-lg">🌸</span>
                </h1>
                
                <p 
                  className="text-xl lg:text-2xl font-semibold text-transparent"
                  style={{
                    WebkitTextStroke: '1px rgba(255, 255, 255, 0.7)',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                  }}
                >
                  Let's nurture the connections that matter most to you today.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Clean scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-md bg-white/20 shadow-lg">
            <div className="w-1 h-3 bg-white/80 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      {relationships.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 bg-white/50 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-4">
                Your Relationship Journey
              </h2>
              <p className="text-xl text-gray-600">
                Track your progress and celebrate your connections
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Users, value: stats.totalRelationships, label: "Relationships", color: "text-primary-500", action: () => navigate('/relationships') },
                { icon: TrendingUp, value: stats.strongConnections, label: "Strong Bonds", color: "text-green-500" },
                { icon: Heart, value: stats.interactionsThisWeek, label: "This Week", color: "text-red-500", action: () => navigate('/messages') },
                { icon: Calendar, value: stats.upcomingDates, label: "Upcoming", color: "text-accent-500" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={stat.action}
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all ${stat.action ? 'cursor-pointer' : ''}`}
                  >
                    <Icon className={`h-12 w-12 ${stat.color} mx-auto mb-4`} />
                    <div className="text-4xl font-bold text-gray-800 mb-2">{stat.value}</div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-br from-primary-25 to-secondary-25"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-4">
              Powerful Features for Meaningful Connections
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how EverBloom helps you build stronger, more meaningful relationships through intelligent insights and personalized guidance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Daily Nudge Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl p-8 lg:p-12 border border-primary-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-semibold text-gray-800">Your Daily Dose of Connection</h2>
                  <p className="text-gray-600">AI-powered suggestion to brighten someone's day</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/ai-studio')}
                className="bg-white/70 hover:bg-white text-primary-600 px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg"
              >
                <span>Get Ideas</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
            
            <div className="bg-white/60 rounded-2xl p-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {relationships.length === 0 
                  ? "Add your first relationship to get personalized suggestions!"
                  : "💡 Consider reaching out to someone you haven't connected with recently. A simple 'thinking of you' message can brighten their day and strengthen your bond."
                }
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Actions Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-br from-secondary-25 to-accent-25"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <p className="text-xl text-gray-600">
              Jump into the tools that help you connect
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI Studio",
                description: "Get personalized suggestions",
                color: "from-purple-400 to-purple-600",
                action: () => navigate('/ai-studio')
              },
              {
                icon: MessageCircle,
                title: "Send Messages",
                description: "Craft meaningful messages",
                color: "from-blue-400 to-blue-600",
                action: () => navigate('/messages')
              },
              {
                icon: Plus,
                title: "Add Relationship",
                description: "Start nurturing a new connection",
                color: "from-green-400 to-green-600",
                action: () => setShowAddModal(true)
              }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all group text-left"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600">{action.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Relationships Section */}
      {relationships.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 bg-white/50 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-2">Your Relationships</h2>
                <p className="text-xl text-gray-600">The connections that matter most</p>
              </motion.div>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/relationships')}
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-2"
                >
                  <span>View All</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Relationship</span>
                </motion.button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/80 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relationships.map((relationship, index) => (
                  <motion.div
                    key={relationship.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RelationshipCard
                      relationship={relationship}
                      onClick={() => {}}
                      onUpdate={fetchRelationships}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Achievements Section */}
      {relationships.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 bg-gradient-to-br from-accent-25 to-primary-25"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-4">
                Your Achievements
              </h2>
              <p className="text-xl text-gray-600">
                Celebrate your relationship milestones
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{achievement.label}</h3>
                    <div className="text-3xl font-bold text-gray-800 mb-2">
                      {achievement.value}
                      <span className="text-lg text-gray-600">{achievement.suffix}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-6">
              Ready to Bloom?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Start nurturing your relationships today and watch them flourish with the power of AI-guided insights.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all"
            >
              {relationships.length === 0 ? 'Add Your First Relationship' : 'Add Another Connection'}
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Add Relationship Modal */}
      {showAddModal && (
        <AddRelationshipModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRelationshipAdded}
        />
      )}
    </div>
  );
}