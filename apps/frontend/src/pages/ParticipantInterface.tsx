import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ActivePoll from '../components/student/ActivePoll';
import MyProgress from '../components/student/MyProgress';
import PollHistory from '../components/student/PollHistory';
import Achievements from '../components/student/Achievements';
import StudyMaterials from '../components/student/StudyMaterials';
import Leaderboard from '../components/student/Leaderboard';
import EnhancedNavbar from '../components/navigation/EnhancedNavbar';
import SideNavigation from '../components/navigation/SideNavigation';

const ParticipantInterface: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const location = useLocation();
  const [notifications] = useState(3);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  // Mock student stats
  const studentStats = {
    totalPolls: 45,
    correctAnswers: 38,
    accuracy: 84,
    currentStreak: 7,
    rank: 3,
    totalPoints: 1250,
    badges: ['🎯', '⚡', '🔥'],
    level: 'Advanced'
  };

  const getCurrentPageName = () => {
    switch (location.pathname) {
      case '/participant': return 'Active Poll';
      case '/participant/progress': return 'My Progress';
      case '/participant/history': return 'Poll History';
      case '/participant/achievements': return 'Achievements';
      case '/participant/study': return 'Study Materials';
      case '/participant/leaderboard': return 'Leaderboard';
      default: return 'Student Dashboard';
    }
  };

  const navigationItems = [
    {
      id: 'active-poll',
      label: 'Active Poll',
      icon: '📊',
      description: 'Join and answer live polls',
      badge: notifications > 0 ? notifications.toString() : undefined,
      isActive: location.pathname === '/participant',
      onClick: () => window.location.href = '/participant'
    },
    {
      id: 'my-progress',
      label: 'My Progress',
      icon: '📈',
      description: 'Track your learning journey',
      isActive: location.pathname === '/participant/progress',
      onClick: () => window.location.href = '/participant/progress'
    },
    {
      id: 'poll-history',
      label: 'Poll History',
      icon: '📋',
      description: 'Review past poll responses',
      isActive: location.pathname === '/participant/history',
      onClick: () => window.location.href = '/participant/history'
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: '🏆',
      description: 'View badges and rewards',
      badge: studentStats.badges.length.toString(),
      isActive: location.pathname === '/participant/achievements',
      onClick: () => window.location.href = '/participant/achievements'
    },
    {
      id: 'study-materials',
      label: 'Study Materials',
      icon: '📚',
      description: 'Access learning resources',
      isActive: location.pathname === '/participant/study',
      onClick: () => window.location.href = '/participant/study'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: '🥇',
      description: 'Compare with other students',
      isActive: location.pathname === '/participant/leaderboard',
      onClick: () => window.location.href = '/participant/leaderboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50">
      {/* Enhanced Navbar */}
      <EnhancedNavbar
        onMenuToggle={setIsSideNavOpen}
        currentPage={getCurrentPageName()}
      />

      {/* Side Navigation */}
      <SideNavigation
        isOpen={isSideNavOpen}
        items={navigationItems}
        userRole="participant"
        onClose={() => setIsSideNavOpen(false)}
      />

      {/* Main Container with Fixed Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Line 1: Student Performance Header */}
        <div className="mb-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 hover-lift fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🎓</span>
              </div>
              <div>
                <h2 className="text-lg font-heading gradient-text-green">Student Performance</h2>
                <p className="text-gray-600 text-sm">Track your learning progress and achievements</p>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-lg mr-1">🎯</span>
                </div>
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="text-lg font-bold gradient-text-green">{studentStats.accuracy}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-lg mr-1">🔥</span>
                </div>
                <p className="text-xs text-gray-500">Streak</p>
                <p className="text-lg font-bold gradient-text-purple">{studentStats.currentStreak}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-lg mr-1">⭐</span>
                </div>
                <p className="text-xs text-gray-500">Points</p>
                <p className="text-lg font-bold gradient-text-blue">{studentStats.totalPoints}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-lg mr-1">🏆</span>
                </div>
                <p className="text-xs text-gray-500">Rank</p>
                <p className="text-lg font-bold gradient-text-purple">#{studentStats.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line 2: Navigation Tabs */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg border border-white/20">
            <ul className="flex space-x-1 overflow-x-auto">
              {navigationItems.map((item, index) => (
                <li key={item.id} className={`fade-in-up stagger-${index + 1}`}>
                  <Link
                    to={item.id === 'active-poll' ? '/participant' : `/participant/${item.id.replace('-', '')}`}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 hover-scale ${
                      item.isActive
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Line 3: Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 page-transition">
              <Routes>
                <Route path="/" element={<ActivePoll />} />
                <Route path="/progress" element={<MyProgress />} />
                <Route path="/history" element={<PollHistory />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/study" element={<StudyMaterials />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </div>
          </div>

          {/* Compact Sidebar */}
          <div className="space-y-4 slide-in-right">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 hover-lift fade-in-up stagger-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-sm font-heading gradient-text-blue">Quick Stats</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <span className="text-gray-700 text-sm font-medium">Rank</span>
                  <span className="text-lg font-bold gradient-text-blue">#{studentStats.rank}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <span className="text-gray-700 text-sm font-medium">Level</span>
                  <span className="text-lg font-bold gradient-text-purple">{studentStats.level}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                  <span className="text-gray-700 text-sm font-medium">Total Polls</span>
                  <span className="text-lg font-bold text-gray-900">{studentStats.totalPolls}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <span className="text-gray-700 text-sm font-medium">Correct</span>
                  <span className="text-lg font-bold gradient-text-green">{studentStats.correctAnswers}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 hover-lift fade-in-up stagger-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔔</span>
                </div>
                <h3 className="text-sm font-heading gradient-text-green">Recent Activity</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover-scale">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-md flex items-center justify-center mr-2">
                    <span className="text-white text-xs">✅</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-900">Answered correctly</span>
                  </div>
                  <span className="text-xs text-gray-500">2m</span>
                </div>
                <div className="flex items-center p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover-scale">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md flex items-center justify-center mr-2">
                    <span className="text-white text-xs">🏆</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-900">Earned badge</span>
                  </div>
                  <span className="text-xs text-gray-500">5m</span>
                </div>
                <div className="flex items-center p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover-scale">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-md flex items-center justify-center mr-2">
                    <span className="text-white text-xs">📊</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-900">Joined session</span>
                  </div>
                  <span className="text-xs text-gray-500">10m</span>
                </div>
              </div>
            </div>

            {/* Study Streak */}
            <div className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-2xl shadow-xl p-4 text-white hover-lift fade-in-up stagger-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Study Streak</h3>
                    <p className="text-xs opacity-90">Keep going!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{studentStats.currentStreak}</p>
                  <p className="text-xs opacity-90">days</p>
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xs font-medium">🎯 Goal: Reach 10 days!</p>
                <div className="mt-1 bg-white/20 rounded-full h-1.5">
                  <div
                    className="bg-white rounded-full h-1.5 transition-all duration-500"
                    style={{ width: `${(studentStats.currentStreak / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 hover-lift fade-in-up stagger-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏅</span>
                </div>
                <h3 className="text-sm font-heading gradient-text-purple">My Badges</h3>
              </div>
              <div className="flex justify-center space-x-2">
                {studentStats.badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-lg shadow-lg hover-scale stagger-${index + 1} fade-in-up`}
                  >
                    {badge}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-600 mt-3 font-medium">
                {studentStats.badges.length} badges earned
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantInterface;
