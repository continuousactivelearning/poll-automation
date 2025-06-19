import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart3,
  Mic,
  Brain,
  Calendar,
  PieChart,
  Users,
  Trophy,
  FileText,
  Settings,
  LogOut,
  Zap
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/host/dashboard' },
    { icon: Mic, label: 'Audio Capture', path: '/host/audio' },
    { icon: Brain, label: 'AI Questions', path: '/host/ai-questions' },
    { icon: Calendar, label: 'Meetings', path: '/host/meetings' },
    { icon: PieChart, label: 'Analytics', path: '/host/analytics' },
    { icon: Users, label: 'Participants', path: '/host/participants' },
    { icon: Trophy, label: 'Leaderboard', path: '/host/leaderboard' },
    { icon: FileText, label: 'Reports', path: '/host/reports' },
    { icon: Settings, label: 'Settings', path: '/host/settings' },
  ];

  return (
    <div className="w-64 glass-sidebar h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-electric-cyan to-vibrant-magenta rounded-full flex items-center justify-center mr-3">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">EngageSphere</h1>
            <p className="text-xs text-gray-400">Host Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-electric-cyan/20 text-electric-cyan border-r-2 border-electric-cyan'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-electric-cyan' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-electric-cyan rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;