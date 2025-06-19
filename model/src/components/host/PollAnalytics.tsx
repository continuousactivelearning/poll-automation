import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Users, Clock, TrendingUp, Filter, Download } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

interface PollData {
  id: string;
  question: string;
  totalResponses: number;
  correctAnswers: number;
  launchedAt: Date;
  duration: number;
  status: 'active' | 'completed';
  responses: { option: string; count: number; percentage: number }[];
}

const PollAnalytics: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);

  const pollData: PollData[] = [
    {
      id: '1',
      question: 'What is the derivative of x²?',
      totalResponses: 42,
      correctAnswers: 38,
      launchedAt: new Date(Date.now() - 300000),
      duration: 30,
      status: 'completed',
      responses: [
        { option: '2x', count: 38, percentage: 90.5 },
        { option: 'x', count: 2, percentage: 4.8 },
        { option: '2', count: 1, percentage: 2.4 },
        { option: 'x²', count: 1, percentage: 2.4 },
      ],
    },
    {
      id: '2',
      question: 'Which represents Newton\'s second law?',
      totalResponses: 39,
      correctAnswers: 35,
      launchedAt: new Date(Date.now() - 600000),
      duration: 45,
      status: 'completed',
      responses: [
        { option: 'F = ma', count: 35, percentage: 89.7 },
        { option: 'E = mc²', count: 2, percentage: 5.1 },
        { option: 'PV = nRT', count: 1, percentage: 2.6 },
        { option: 'F = kx', count: 1, percentage: 2.6 },
      ],
    },
    {
      id: '3',
      question: 'What is the pH of pure water?',
      totalResponses: 41,
      correctAnswers: 39,
      launchedAt: new Date(Date.now() - 900000),
      duration: 25,
      status: 'completed',
      responses: [
        { option: '6', count: 1, percentage: 2.4 },
        { option: '7', count: 39, percentage: 95.1 },
        { option: '8', count: 1, percentage: 2.4 },
        { option: '14', count: 0, percentage: 0 },
      ],
    },
  ];

  const performanceData = [
    { time: '9:00', accuracy: 85, participation: 92 },
    { time: '9:15', accuracy: 78, participation: 88 },
    { time: '9:30', accuracy: 92, participation: 95 },
    { time: '9:45', accuracy: 89, participation: 91 },
    { time: '10:00', accuracy: 94, participation: 97 },
    { time: '10:15', accuracy: 87, participation: 89 },
  ];

  const responseTimeData = [
    { poll: 'Poll 1', avgTime: 12.5 },
    { poll: 'Poll 2', avgTime: 18.3 },
    { poll: 'Poll 3', avgTime: 8.7 },
    { poll: 'Poll 4', avgTime: 15.2 },
    { poll: 'Poll 5', avgTime: 11.8 },
  ];

  const COLORS = ['#00FFFF', '#FF00FF', '#FFD700', '#FF6B6B'];

  const exportAnalytics = () => {
    toast.success('Analytics exported successfully!');
  };

  const calculateAccuracy = (poll: PollData) => {
    return ((poll.correctAnswers / poll.totalResponses) * 100).toFixed(1);
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Poll Analytics</h1>
            <p className="text-gray-300">Detailed insights into your polling performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="glass-input"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            
            <motion.button
              onClick={exportAnalytics}
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard className="p-6 text-center border-2 border-electric-cyan/30">
          <BarChart className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">{pollData.length}</div>
          <div className="text-gray-300 text-sm">Total Polls</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-vibrant-magenta/30">
          <Users className="w-8 h-8 text-vibrant-magenta mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(pollData.reduce((acc, poll) => acc + poll.totalResponses, 0) / pollData.length)}
          </div>
          <div className="text-gray-300 text-sm">Avg Responses</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-vibrant-yellow/30">
          <TrendingUp className="w-8 h-8 text-vibrant-yellow mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(pollData.reduce((acc, poll) => acc + (poll.correctAnswers / poll.totalResponses * 100), 0) / pollData.length)}%
          </div>
          <div className="text-gray-300 text-sm">Avg Accuracy</div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-2 border-electric-cyan/30">
          <Clock className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(pollData.reduce((acc, poll) => acc + poll.duration, 0) / pollData.length)}s
          </div>
          <div className="text-gray-300 text-sm">Avg Duration</div>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Over Time */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(27, 38, 59, 0.9)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#00FFFF',
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#00FFFF"
                strokeWidth={3}
                dot={{ fill: '#00FFFF', strokeWidth: 2, r: 4 }}
                name="Accuracy %"
              />
              <Line
                type="monotone"
                dataKey="participation"
                stroke="#FF00FF"
                strokeWidth={3}
                dot={{ fill: '#FF00FF', strokeWidth: 2, r: 4 }}
                name="Participation %"
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Response Time Analysis */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Average Response Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="poll" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(27, 38, 59, 0.9)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#00FFFF',
                }}
              />
              <Bar dataKey="avgTime" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00FFFF" />
                  <stop offset="100%" stopColor="#FF00FF" />
                </linearGradient>
              </defs>
            </RechartsBarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Detailed Poll Results */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Poll Results</h3>
        
        <div className="space-y-6">
          {pollData.map((poll, index) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-6 border border-white/10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">{poll.question}</h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-400 font-medium">
                        {calculateAccuracy(poll)}% Accuracy
                      </span>
                      <span className="text-gray-400 text-sm">
                        {poll.totalResponses} responses
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {poll.responses.map((response, idx) => (
                      <div key={idx} className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white">{response.option}</span>
                            <span className="text-gray-400 text-sm">
                              {response.count} ({response.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="progress-bar">
                            <motion.div
                              className="h-full bg-gradient-to-r from-electric-cyan to-vibrant-magenta"
                              initial={{ width: 0 }}
                              animate={{ width: `${response.percentage}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={poll.responses}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {poll.responses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(27, 38, 59, 0.9)',
                          border: '1px solid rgba(0, 255, 255, 0.3)',
                          borderRadius: '8px',
                          color: '#00FFFF',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-400">
                <span>Launched: {poll.launchedAt.toLocaleString()}</span>
                <span>Duration: {poll.duration}s</span>
                <span className="status-indicator status-completed">Completed</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default PollAnalytics;