import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Heart, Calendar, MessageCircle, Edit, Trash2, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RelationshipCard from '../components/RelationshipCard';
import AddRelationshipModal from '../components/AddRelationshipModal';
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

export default function Relationships() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [filteredRelationships, setFilteredRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');

  const relationshipTypes = ['ALL', 'ROMANTIC', 'FAMILY', 'FRIEND', 'PROFESSIONAL', 'OTHER'];
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'strength', label: 'Connection Strength' },
    { value: 'recent', label: 'Recent Interaction' },
    { value: 'created', label: 'Date Added' },
  ];

  useEffect(() => {
    if (user) {
      fetchRelationships();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortRelationships();
  }, [relationships, searchTerm, filterType, sortBy]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRelationships = () => {
    let filtered = relationships;

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(r => r.relationship_type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort relationships
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.display_name.localeCompare(b.display_name);
        case 'strength':
          return b.relationship_strength_score - a.relationship_strength_score;
        case 'recent':
          const aDate = a.last_interaction_date ? new Date(a.last_interaction_date).getTime() : 0;
          const bDate = b.last_interaction_date ? new Date(b.last_interaction_date).getTime() : 0;
          return bDate - aDate;
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredRelationships(filtered);
  };

  const handleRelationshipAdded = () => {
    fetchRelationships();
    setShowAddModal(false);
    toast.success('Relationship added successfully! 💕');
  };

  const handleRelationshipClick = (relationship: Relationship) => {
    // Navigate to relationship detail page
    console.log('Navigate to relationship:', relationship.id);
  };

  const handleDeleteRelationship = async (relationshipId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete your relationship with ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
      
      toast.success(`Relationship with ${name} has been removed`);
      fetchRelationships();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast.error('Failed to delete relationship');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary-500 animate-heartbeat mx-auto mb-4" />
          <p className="text-gray-600">Loading your relationships...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">
                Your Relationships
              </h1>
              <p className="text-gray-600">
                Nurture the connections that bring joy to your life
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="mt-4 sm:mt-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Add Relationship</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search, Filter, and Sort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-primary-100"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search relationships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/70"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/70 appearance-none min-w-[150px]"
              >
                {relationshipTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/70 appearance-none min-w-[150px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Total: {relationships.length}</span>
              <span>Showing: {filteredRelationships.length}</span>
              <span>Strong connections: {relationships.filter(r => r.relationship_strength_score >= 70).length}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Heart className="h-4 w-4 text-red-400" />
              <span>Average strength: {relationships.length > 0 ? Math.round(relationships.reduce((sum, r) => sum + r.relationship_strength_score, 0) / relationships.length) : 0}%</span>
            </div>
          </div>
        </motion.div>

        {/* Relationships Grid */}
        {filteredRelationships.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary-100"
          >
            {relationships.length === 0 ? (
              <>
                <div className="text-6xl mb-4">💝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Your Journey</h3>
                <p className="text-gray-600 mb-6">Add your first relationship to begin nurturing meaningful connections.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5 inline mr-2" />
                  Add Your First Relationship
                </motion.button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRelationships.map((relationship, index) => (
              <motion.div
                key={relationship.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group"
              >
                <RelationshipCard
                  relationship={relationship}
                  onClick={() => handleRelationshipClick(relationship)}
                  onUpdate={fetchRelationships}
                />
                
                {/* Quick Actions Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-primary-600 rounded-lg shadow-sm transition-colors"
                      title="Edit relationship"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRelationship(relationship.id, relationship.display_name);
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600 rounded-lg shadow-sm transition-colors"
                      title="Delete relationship"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Relationship Modal */}
        {showAddModal && (
          <AddRelationshipModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleRelationshipAdded}
          />
        )}
      </div>
    </div>
  );
}