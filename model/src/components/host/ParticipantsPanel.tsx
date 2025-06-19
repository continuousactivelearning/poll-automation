import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, Eye, MessageSquare, Award, TrendingUp } from 'lucide-react';
import GlassCard from '../GlassCard';

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinTime: Date;
  pollsAnswered: number;
  correctAnswers: number;
  averageResponseTime: number;
  isActive: boolean;
  lastActivity: Date;
}

const ParticipantsPanel: React.FC = () => {
  const [participants] = useState<Participant[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@university.edu',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      joinTime: new Date(Date.now() - 1800000),
      pollsAnswered: 8,
      correctAnswers: 7,
      averageResponseTime: 12.5,
      isActive: true,
      lastActivity: new Date(Date.now() - 120000),
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.c@university.edu',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150',
      joinTime: new Date(Date.now() - 2100000),
      pollsAnswered: 8,
      correctAnswers: 8,
      averageResponseTime: 8.3,
      isActive: true,
      lastActivity: new Date(Date.now() - 60000),
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma.d@university.edu',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      joinTime: new Date(Date.now() - 1500000),
      pollsAnswered: 6,
      correctAnswers: 5,
      averageResponseTime: 15.7,
      isActive: false,
      lastActivity: new Date(Date.now() - 900000),
    },
    {
      id: '4',
      name: 'James Wilson',
      email: 'james.w@university.edu',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      joinTime: new Date(Date.now() - 2400000),
      pollsAnswered: 7,
      correctAnswers: 6,
      averageResponseTime: 11.2,
      isActive: true,
      lastActivity: new Date(Date.now() - 180000),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' ||
                         (filterActive === 'active' && participant.isActive) ||
                         (filterActive === 'inactive' && !participant.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const calculateAccuracy = (participant: Participant) => {
    return participant.pollsAnswered > 0 
      ? ((participant.correctAnswers / participant.pollsAnswered) * 100).toFixed(1)
      : '0';
  };

  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-400';
    if (accuracy >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Participants</h1>
        <p className="text-gray-300">Monitor and analyze student engagement</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard className="p-6 text-center border-2 border-electric-cyan/30">
          <Users className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">{participants.length}</div>
          <div className="text-gray-300 text-sm">Total Participants</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-vibrant-magenta/30">
          <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {participants.filter(p => p.isActive).length}
          </div>
          <div className="text-gray-300 text-sm">Active Now</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-vibrant-yellow/30">
          <Award className="w-8 h-8 text-vibrant-yellow mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(participants.reduce((acc, p) => acc + (p.correctAnswers / Math.max(p.pollsAnswered, 1) * 100), 0) / participants.length)}%
          </div>
          <div className="text-gray-300 text-sm">Avg Accuracy</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-electric-cyan/30">
          <TrendingUp className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(participants.reduce((acc, p) => acc + p.averageResponseTime, 0) / participants.length)}s
          </div>
          <div className="text-gray-300 text-sm">Avg Response Time</div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-12"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="glass-input"
            >
              <option value="all">All Participants</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredParticipants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard 
                className="p-6 hover-glow cursor-pointer"
                onClick={() => setExpandedParticipant(
                  expandedParticipant === participant.id ? null : participant.id
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="relative">
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-charcoal ${
                        participant.isActive ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-semibold">{participant.name}</h3>
                      <p className="text-gray-400 text-sm">{participant.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getPerformanceColor(parseFloat(calculateAccuracy(participant)))}`}>
                      {calculateAccuracy(participant)}%
                    </div>
                    <div className="text-gray-400 text-xs">Accuracy</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-white font-semibold">{participant.pollsAnswered}</div>
                    <div className="text-gray-400 text-xs">Polls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{participant.correctAnswers}</div>
                    <div className="text-gray-400 text-xs">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{participant.averageResponseTime}s</div>
                    <div className="text-gray-400 text-xs">Avg Time</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Joined {formatTimeAgo(participant.joinTime)}</span>
                  <span>Active {formatTimeAgo(participant.lastActivity)}</span>
                </div>

                <AnimatePresence>
                  {expandedParticipant === participant.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Session Duration:</span>
                          <span className="text-white">{formatTimeAgo(participant.joinTime)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Response Rate:</span>
                          <span className="text-green-400">
                            {Math.round((participant.pollsAnswered / 8) * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Engagement Level:</span>
                          <span className={participant.isActive ? 'text-green-400' : 'text-yellow-400'}>
                            {participant.isActive ? 'High' : 'Moderate'}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button className="flex-1 btn-secondary text-sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          <button className="flex-1 btn-secondary text-sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No participants found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Participants will appear here when they join'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;