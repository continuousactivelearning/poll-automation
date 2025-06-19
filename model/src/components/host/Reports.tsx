import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, BarChart, Users, Clock, Filter } from 'lucide-react';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  lastGenerated?: Date;
}

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'session-summary',
      name: 'Session Summary',
      description: 'Comprehensive overview of session performance, participation, and outcomes',
      icon: BarChart,
      color: 'electric-cyan',
      lastGenerated: new Date(Date.now() - 86400000),
    },
    {
      id: 'participant-analysis',
      name: 'Participant Analysis',
      description: 'Individual student performance metrics and engagement patterns',
      icon: Users,
      color: 'vibrant-magenta',
      lastGenerated: new Date(Date.now() - 172800000),
    },
    {
      id: 'poll-analytics',
      name: 'Poll Analytics',
      description: 'Detailed analysis of poll results, response patterns, and accuracy rates',
      icon: FileText,
      color: 'vibrant-yellow',
      lastGenerated: new Date(Date.now() - 259200000),
    },
    {
      id: 'attendance-report',
      name: 'Attendance Report',
      description: 'Attendance tracking, join/leave times, and session duration analysis',
      icon: Clock,
      color: 'electric-cyan',
    },
  ];

  const generateReport = async (reportId: string, reportName: string) => {
    setIsGenerating(reportId);
    toast.loading(`Generating ${reportName}...`, { id: reportId });

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsGenerating(null);
    toast.success(`${reportName} generated successfully!`, { id: reportId });
    
    // Update last generated time
    // In a real app, this would be handled by the backend
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      'electric-cyan': 'text-electric-cyan border-electric-cyan/30 bg-electric-cyan/10',
      'vibrant-magenta': 'text-vibrant-magenta border-vibrant-magenta/30 bg-vibrant-magenta/10',
      'vibrant-yellow': 'text-vibrant-yellow border-vibrant-yellow/30 bg-vibrant-yellow/10',
    };
    return colorMap[color] || colorMap['electric-cyan'];
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-gray-300">Generate comprehensive reports and export your data</p>
      </div>

      {/* Quick Filters */}
      <GlassCard className="p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-electric-cyan" />
          Report Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="glass-input w-full"
            >
              <option value="session">Current Session</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="glass-input w-full"
            >
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV Data</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Include Data
            </label>
            <select className="glass-input w-full">
              <option value="all">All Data</option>
              <option value="summary">Summary Only</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="raw">Raw Data</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Report Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {reportTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className={`p-6 border-2 ${getColorClasses(template.color)} hover-glow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg ${getColorClasses(template.color)} flex items-center justify-center mr-4`}>
                    <template.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <p className="text-gray-300 text-sm mt-1">{template.description}</p>
                  </div>
                </div>
              </div>
              
              {template.lastGenerated && (
                <div className="mb-4 text-sm text-gray-400">
                  Last generated: {template.lastGenerated.toLocaleDateString()} at {template.lastGenerated.toLocaleTimeString()}
                </div>
              )}
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => generateReport(template.id, template.name)}
                  disabled={isGenerating === template.id}
                  className="flex-1 btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isGenerating === template.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </motion.button>
                
                {template.lastGenerated && (
                  <motion.button
                    className="btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Recent Reports */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-electric-cyan" />
          Recent Reports
        </h3>
        
        <div className="space-y-4">
          {[
            {
              name: 'Session Summary - Advanced Calculus',
              type: 'PDF Report',
              generated: new Date(Date.now() - 86400000),
              size: '2.4 MB',
              status: 'completed',
            },
            {
              name: 'Participant Analysis - Week 3',
              type: 'Excel Spreadsheet',
              generated: new Date(Date.now() - 172800000),
              size: '1.8 MB',
              status: 'completed',
            },
            {
              name: 'Poll Analytics - Physics 101',
              type: 'CSV Data',
              generated: new Date(Date.now() - 259200000),
              size: '524 KB',
              status: 'completed',
            },
            {
              name: 'Monthly Attendance Report',
              type: 'PDF Report',
              generated: new Date(Date.now() - 300000),
              size: 'Generating...',
              status: 'processing',
            },
          ].map((report, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-electric-cyan/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-electric-cyan" />
                </div>
                
                <div>
                  <h4 className="text-white font-medium">{report.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{report.type}</span>
                    <span>{report.generated.toLocaleDateString()}</span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`status-indicator ${
                  report.status === 'completed' ? 'status-completed' : 'status-pending'
                }`}>
                  {report.status}
                </span>
                
                {report.status === 'completed' && (
                  <motion.button
                    className="p-2 bg-electric-cyan/20 text-electric-cyan rounded-lg hover:bg-electric-cyan/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button className="btn-secondary">
            View All Reports
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Reports;