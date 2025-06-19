import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Download, Trash2, Eye, Plus } from 'lucide-react';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

interface Meeting {
  id: string;
  title: string;
  date: Date;
  duration: number;
  participants: number;
  polls: number;
  status: 'active' | 'completed' | 'scheduled';
}

const MeetingTracker: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Advanced Calculus - Derivatives',
      date: new Date(),
      duration: 85,
      participants: 42,
      polls: 8,
      status: 'active',
    },
    {
      id: '2',
      title: 'Physics 101 - Newton\'s Laws',
      date: new Date(Date.now() - 86400000),
      duration: 75,
      participants: 38,
      polls: 6,
      status: 'completed',
    },
    {
      id: '3',
      title: 'Chemistry Basics - Atomic Structure',
      date: new Date(Date.now() - 172800000),
      duration: 90,
      participants: 45,
      polls: 12,
      status: 'completed',
    },
    {
      id: '4',
      title: 'Biology Lab - Cell Division',
      date: new Date(Date.now() + 86400000),
      duration: 0,
      participants: 0,
      polls: 0,
      status: 'scheduled',
    },
  ]);

  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  const deleteMeeting = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    toast.success('Meeting deleted');
  };

  const exportMeeting = (meeting: Meeting) => {
    // Simulate export
    toast.success(`Exporting data for: ${meeting.title}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'scheduled': return 'status-pending';
      default: return 'status-pending';
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meeting Tracker</h1>
            <p className="text-gray-300">Track and manage your teaching sessions</p>
          </div>
          
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </motion.button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard className="p-6 text-center border-2 border-electric-cyan/30">
          <Calendar className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">{meetings.length}</div>
          <div className="text-gray-300 text-sm">Total Meetings</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-vibrant-magenta/30">
          <Clock className="w-8 h-8 text-vibrant-magenta mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {formatDuration(meetings.reduce((acc, m) => acc + m.duration, 0))}
          </div>
          <div className="text-gray-300 text-sm">Total Duration</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-vibrant-yellow/30">
          <Users className="w-8 h-8 text-vibrant-yellow mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(meetings.reduce((acc, m) => acc + m.participants, 0) / meetings.filter(m => m.participants > 0).length || 0)}
          </div>
          <div className="text-gray-300 text-sm">Avg Participants</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-electric-cyan/30">
          <div className="w-8 h-8 bg-gradient-to-r from-electric-cyan to-vibrant-magenta rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold">
            P
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {meetings.reduce((acc, m) => acc + m.polls, 0)}
          </div>
          <div className="text-gray-300 text-sm">Total Polls</div>
        </GlassCard>
      </div>

      {/* Meetings List */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Recent Meetings</h3>
        
        <div className="space-y-4">
          <AnimatePresence>
            {meetings.map((meeting, index) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedMeeting(
                    expandedMeeting === meeting.id ? null : meeting.id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-white mr-4">
                          {meeting.title}
                        </h4>
                        <span className={`status-indicator ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-gray-300 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {meeting.date.toLocaleDateString()}
                        </div>
                        
                        {meeting.duration > 0 && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(meeting.duration)}
                          </div>
                        )}
                        
                        {meeting.participants > 0 && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {meeting.participants} participants
                          </div>
                        )}
                        
                        {meeting.polls > 0 && (
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-vibrant-magenta rounded mr-1"></div>
                            {meeting.polls} polls
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          // View meeting details
                        }}
                        className="p-2 bg-electric-cyan/20 text-electric-cyan rounded-lg hover:bg-electric-cyan/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      
                      {meeting.status === 'completed' && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportMeeting(meeting);
                          }}
                          className="p-2 bg-vibrant-yellow/20 text-vibrant-yellow rounded-lg hover:bg-vibrant-yellow/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>
                      )}
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMeeting(meeting.id);
                        }}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedMeeting === meeting.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/10 p-6 bg-white/5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Session Details</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Start Time:</span>
                              <span className="text-white">{meeting.date.toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white">{formatDuration(meeting.duration)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Status:</span>
                              <span className={`${getStatusColor(meeting.status).includes('active') ? 'text-green-400' : 
                                getStatusColor(meeting.status).includes('completed') ? 'text-blue-400' : 'text-yellow-400'}`}>
                                {meeting.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Engagement</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Participants:</span>
                              <span className="text-white">{meeting.participants}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Polls Launched:</span>
                              <span className="text-white">{meeting.polls}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Response Rate:</span>
                              <span className="text-green-400">94%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Quick Actions</h5>
                          <div className="space-y-2">
                            <button className="w-full btn-secondary text-sm">
                              View Full Report
                            </button>
                            <button className="w-full btn-secondary text-sm">
                              Export Data
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {meetings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No meetings yet</h3>
            <p className="text-gray-500">Start your first session to see it here</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default MeetingTracker;