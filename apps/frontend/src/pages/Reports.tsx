// apps/frontend/src/pages/Reports.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Clock,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';

const Reports = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [reportType, setReportType] = useState('overview');

  // Mock data
  const performanceData = [
    { date: '2024-01-01', accuracy: 85, participation: 45, avgTime: 2.3 },
    { date: '2024-01-02', accuracy: 87, participation: 52, avgTime: 2.1 },
    { date: '2024-01-03', accuracy: 82, participation: 38, avgTime: 2.8 },
    { date: '2024-01-04', accuracy: 89, participation: 61, avgTime: 2.0 },
    { date: '2024-01-05', accuracy: 91, participation: 48, avgTime: 1.9 },
    { date: '2024-01-06', accuracy: 88, participation: 55, avgTime: 2.2 },
    { date: '2024-01-07', accuracy: 93, participation: 42, avgTime: 1.8 },
  ];

  const topicDistribution = [
    { name: 'React Hooks', value: 35, color: '#8B5CF6' },
    { name: 'State Management', value: 25, color: '#3B82F6' },
    { name: 'API Integration', value: 20, color: '#14B8A6' },
    { name: 'TypeScript', value: 15, color: '#F59E0B' },
    { name: 'Testing', value: 5, color: '#EF4444' },
  ];

  const difficultyBreakdown = [
    { difficulty: 'Easy', correct: 145, incorrect: 23, total: 168 },
    { difficulty: 'Medium', correct: 98, incorrect: 45, total: 143 },
    { difficulty: 'Hard', correct: 34, incorrect: 28, total: 62 },
  ];

  const reportTemplates = [
    {
      id: 'overview',
      name: 'Overview Report',
      description: 'Comprehensive summary of all polling activities',
      icon: BarChart3,
      color: 'from-primary-500 to-purple-600'
    },
    {
      id: 'performance',
      name: 'Performance Analysis',
      description: 'Detailed participant performance metrics',
      icon: TrendingUp,
      color: 'from-secondary-500 to-blue-600'
    },
    {
      id: 'engagement',
      name: 'Engagement Report',
      description: 'Participation rates and engagement patterns',
      icon: Users,
      color: 'from-accent-500 to-teal-600'
    },
    {
      id: 'topics',
      name: 'Topic Analysis',
      description: 'Question topics and difficulty distribution',
      icon: PieChart,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const handleExportReport = (format: string) => {
    console.log(`Exporting ${reportType} report as ${format}`);
    // Implementation for exporting reports
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'custom': return 'Custom Range';
      default: return 'Last 7 Days';
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <p className="text-gray-400">Generate detailed reports and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7days" className="bg-gray-800">Last 7 Days</option>
              <option value="30days" className="bg-gray-800">Last 30 Days</option>
              <option value="90days" className="bg-gray-800">Last 90 Days</option>
              <option value="custom" className="bg-gray-800">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Report Templates */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">Report Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTemplates.map((template) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setReportType(template.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  reportType === template.id
                    ? 'border-primary-500 bg-primary-500/20'
                    : 'border-gray-600 bg-white/5 hover:border-gray-500'
                }`}
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center mb-3`}>
                  <template.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">{template.name}</h4>
                <p className="text-sm text-gray-400">{template.description}</p>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* Export Options */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Export Options</h3>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">{getDateRangeLabel(dateRange)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {['PDF', 'CSV', 'Excel', 'JSON'].map((format) => (
              <motion.button
                key={format}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExportReport(format)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>{format}</span>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* Report Content */}
        {reportType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Performance Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    {/* <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    /> */}
                    {/* <Bar dataKey="accuracy" fill="#8B5CF6" radius={[4, 4, 0, 0]} /> */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Topic Distribution */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Topic Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    {/* <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    /> */}
                    <RechartsPieChart data={topicDistribution} cx="50%" cy="50%" outerRadius={80}>
                      {topicDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {topicDistribution.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: topic.color }}
                      />
                      <span className="text-gray-300 text-sm">{topic.name}</span>
                    </div>
                    <span className="text-white font-medium">{topic.value}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Questions</p>
                <p className="text-2xl font-bold text-white">1,247</p>
                <p className="text-green-400 text-sm">+12% from last period</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Accuracy</p>
                <p className="text-2xl font-bold text-white">87.5%</p>
                <p className="text-green-400 text-sm">+2.3% improvement</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">342</p>
                <p className="text-green-400 text-sm">+18% growth</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">2.3s</p>
                <p className="text-green-400 text-sm">-0.5s faster</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Difficulty Analysis */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">Difficulty Analysis</h3>
          <div className="space-y-4">
            {difficultyBreakdown.map((item, index) => (
              <motion.div
                key={item.difficulty}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{item.difficulty}</h4>
                  <span className="text-gray-400 text-sm">{item.total} questions</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-400 text-sm">Correct: {item.correct}</span>
                      <span className="text-red-400 text-sm">Incorrect: {item.incorrect}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2" 
                        style={{ width: `${(item.correct / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">
                      {Math.round((item.correct / item.total) * 100)}%
                    </span>
                    <p className="text-gray-400 text-xs">accuracy</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;