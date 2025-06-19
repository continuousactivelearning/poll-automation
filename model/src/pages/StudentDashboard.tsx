import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, Clock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import PollModal from '../components/student/PollModal';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, activePoll, participants } = useSocket();
  const [showPoll, setShowPoll] = useState(false);

  useEffect(() => {
    if (activePoll) {
      setShowPoll(true);
      toast.success('New poll available!');
    }
  }, [activePoll]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen animated-gradient p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name}!
              </h1>
              <div className="flex items-center space-x-6 text-gray-300">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {participants} participants
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            className="glass-card p-6 text-center border-2 border-electric-cyan/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Trophy className="w-8 h-8 text-vibrant-yellow mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-2">12</div>
            <div className="text-gray-300">Polls Answered</div>
          </motion.div>

          <motion.div
            className="glass-card p-6 text-center border-2 border-vibrant-magenta/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Clock className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-2">85%</div>
            <div className="text-gray-300">Accuracy Rate</div>
          </motion.div>

          <motion.div
            className="glass-card p-6 text-center border-2 border-vibrant-yellow/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Users className="w-8 h-8 text-vibrant-magenta mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-2">#3</div>
            <div className="text-gray-300">Class Ranking</div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="glass-card p-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              Waiting for polls...
            </h2>
            <p className="text-gray-300 mb-8">
              Stay tuned! New polls will appear here when your instructor launches them.
            </p>
            
            <div className="flex items-center justify-center">
              <motion.div
                className="w-4 h-4 bg-electric-cyan rounded-full mr-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="w-4 h-4 bg-vibrant-magenta rounded-full mr-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-4 h-4 bg-vibrant-yellow rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Simulate a poll for demo */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowPoll(true)}
            className="btn-primary"
          >
            Simulate Poll (Demo)
          </button>
        </div>
      </div>

      {/* Poll Modal */}
      <AnimatePresence>
        {showPoll && (
          <PollModal
            isOpen={showPoll}
            onClose={() => setShowPoll(false)}
            poll={activePoll || {
              id: 'demo-poll',
              question: 'What is the capital of France?',
              options: ['London', 'Berlin', 'Paris', 'Madrid'],
              duration: 30,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;