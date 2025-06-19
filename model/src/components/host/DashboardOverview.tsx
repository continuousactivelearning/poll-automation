import React from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, BarChart, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import StatCard from '../StatCard';
import GlassCard from '../GlassCard';
import { useSocket } from '../../contexts/SocketContext';

const DashboardOverview: React.FC = () => {
  const { participants, isConnected } = useSocket();

  const attendanceData = [
    { time: '9:00', participants: 15 },
    { time: '9:15', participants: 28 },
    { time: '9:30', participants: 42 },
    { time: '9:45', participants: 38 },
    { time: '10:00', participants: 45 },
    { time: '10:15', participants: 41 },
    { time: '10:30', participants: 39 },
  ];

  const confusionData = [
    { topic: 'Calculus', confusion: 20 },
    { topic: 'Physics', confusion: 45 },
    { topic: 'Chemistry', confusion: 30 },
    { topic: 'Biology', confusion: 25 },
    { topic: 'Statistics', confusion: 55 },
    { topic: 'Programming', confusion: 35 },
  ];

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-300">Monitor your session performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Participants"
          value={participants}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          color="cyan"
        />
        <StatCard
          title="Questions Generated"
          value="127"
          icon={MessageSquare}
          trend={{ value: 8, isPositive: true }}
          color="magenta"
        />
        <StatCard
          title="Response Rate"
          value="94%"
          icon={BarChart}
          trend={{ value: 3, isPositive: true }}
          color="yellow"
        />
        <StatCard
          title="Session Duration"
          value="2h 15m"
          icon={Clock}
          color="cyan"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Attendance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
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
                dataKey="participants"
                stroke="url(#colorGradient)"
                strokeWidth={3}
                dot={{ fill: '#00FFFF', strokeWidth: 2, r: 4 }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00FFFF" />
                  <stop offset="100%" stopColor="#FF00FF" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Confusion Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={confusionData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="topic" className="text-gray-300 text-sm" />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" />
              <Radar
                name="Confusion Level"
                dataKey="confusion"
                stroke="#FF00FF"
                fill="rgba(255, 0, 255, 0.1)"
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard className="p-6 mt-6">
        <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { time: '10:32 AM', event: 'New poll launched: "Understanding Derivatives"', type: 'poll' },
            { time: '10:28 AM', event: '3 new participants joined the session', type: 'join' },
            { time: '10:25 AM', event: 'AI generated 5 new questions from audio transcript', type: 'ai' },
            { time: '10:20 AM', event: 'Poll completed: 89% response rate', type: 'complete' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center p-3 bg-white/5 rounded-lg"
            >
              <div className={`w-2 h-2 rounded-full mr-4 ${
                activity.type === 'poll' ? 'bg-electric-cyan' :
                activity.type === 'join' ? 'bg-vibrant-yellow' :
                activity.type === 'ai' ? 'bg-vibrant-magenta' : 'bg-green-400'
              }`} />
              <div className="flex-1">
                <p className="text-white text-sm">{activity.event}</p>
                <p className="text-gray-400 text-xs">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardOverview;