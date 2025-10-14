import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Target, TrendingUp, Clock, Brain, Mic, Trophy, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';

const HostDashboard = () => {
  const navigate = useNavigate();

  // Mock data
  const participationData = [
    { name: 'Mon', participants: 45, accuracy: 85 },
    { name: 'Tue', participants: 52, accuracy: 78 },
    { name: 'Wed', participants: 38, accuracy: 92 },
    { name: 'Thu', participants: 61, accuracy: 86 },
    { name: 'Fri', participants: 48, accuracy: 89 },
    { name: 'Sat', participants: 35, accuracy: 91 },
    { name: 'Sun', participants: 42, accuracy: 87 },
  ];

  const confusionData = [
    { topic: 'React Hooks', confusion: 25 },
    { topic: 'State Management', confusion: 42 },
    { topic: 'API Integration', confusion: 18 },
    { topic: 'TypeScript', confusion: 35 },
    { topic: 'Testing', confusion: 28 },
  ];

  const statsCards = [
    {
      title: 'Total Polls',
      value: '1,247',
      change: '+12%',
      icon: Target,
      color: 'from-primary-500 to-purple-600',
    },
    {
      title: 'Accuracy Rate',
      value: '87.5%',
      change: '+5.2%',
      icon: TrendingUp,
      color: 'from-secondary-500 to-blue-600',
    },
    {
      title: 'Active Participants',
      value: '342',
      change: '+18%',
      icon: Users,
      color: 'from-accent-500 to-teal-600',
    },
    {
      title: 'Avg Response Time',
      value: '2.3s',
      change: '-0.5s',
      icon: Clock,
      color: 'from-orange-500 to-red-600',
    },
  ];

  const quickActions = [
    {
      title: 'Start Audio Capture',
      description: 'Begin recording and real-time transcription',
      icon: Mic,
      color: 'from-primary-500 to-purple-600',
      href: '/host/audio',
    },
    {
      title: 'AI Question Feed',
      description: 'Review and manage AI-generated questions',
      icon: Brain,
      color: 'from-secondary-500 to-blue-600',
      href: '/host/ai-questions',
    },
    {
      title: 'View Leaderboard',
      description: 'Check top performing participants',
      icon: Trophy,
      color: 'from-accent-500 to-teal-600',
      href: '/host/leaderboard',
    },
    {
      title: 'Generate Reports',
      description: 'Export detailed analytics and insights',
      icon: FileText,
      color: 'from-orange-500 to-red-600',
      href: '/host/reports',
    },
  ];

  return (
    <>
      <DashboardLayout>
        <div >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Classic Dashboard</h1>
                <p className="text-gray-400 text-sm sm:text-base">Welcome back! Here's your polling system overview.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {/* System Active Tag */}
                <div className="bg-green-500/20 text-green-400 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center">
                  System Active
                </div>
                {/* Switch to Student Button */}
                <button
                  onClick={() => navigate('/student')}
                  className="ml-0 sm:ml-4 mt-2 sm:mt-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center transition"
                >
                  Switch to Student
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{card.value}</div>
                        <div className="text-sm text-green-400">{card.change}</div>
                      </div>
                    </div>
                    <h3 className="text-gray-300 font-medium">{card.title}</h3>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Participation Trends */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Participation Trends</h3>
                  <div className="h-64 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={participationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="participants"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Confusion Analysis */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Confusion Analysis</h3>
                  <div className="h-64 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={confusionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="topic" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="confusion" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.a
                      key={action.title}
                      href={action.href}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-medium text-white mb-1">{action.title}</h4>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </motion.a>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'New poll created', time: '2 minutes ago', user: 'AI System' },
                    { action: 'Student joined session', time: '5 minutes ago', user: 'John Doe' },
                    { action: 'Audio capture started', time: '12 minutes ago', user: 'Host' },
                    { action: 'Question approved', time: '18 minutes ago', user: 'Host' },
                    { action: 'Report generated', time: '25 minutes ago', user: 'System' },
                  ].map((activity, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-1">
                      <div>
                        <p className="text-white font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-400">{activity.user}</p>
                      </div>
                      <div className="text-sm text-gray-400">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default HostDashboard;