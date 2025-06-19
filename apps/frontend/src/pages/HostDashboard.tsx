import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LiveMeeting from '../components/host/LiveMeeting';
import PollControl from '../components/host/PollControl';
import PerformanceDashboard from '../components/host/PerformanceDashboard';
import ParticipantsView from '../components/host/ParticipantsView';
import ResponsesView from '../components/host/ResponsesView';
import LeaderboardView from '../components/host/LeaderboardView';
import EnhancedNavbar from '../components/navigation/EnhancedNavbar';
import SideNavigation from '../components/navigation/SideNavigation';
import UploadWAV from '../components/UploadWAV';

const HostDashboard: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const location = useLocation();
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const getCurrentPageName = () => {
    switch (location.pathname) {
      case '/host': return 'Live Meeting';
      case '/host/polls': return 'Poll Control';
      case '/host/participants': return 'Participants';
      case '/host/responses': return 'Responses';
      case '/host/leaderboard': return 'Leaderboard';
      case '/host/performance': return 'Analytics';
      case '/host/upload': return 'Upload Audio';
      default: return 'Dashboard';
    }
  };

  const navigationItems = [
    {
      id: 'live-meeting',
      label: 'Live Meeting',
      icon: '🎥',
      description: 'Connect and manage your meeting',
      isActive: location.pathname === '/host',
      onClick: () => window.location.href = '/host'
    },
    {
      id: 'poll-control',
      label: 'Poll Control',
      icon: '📊',
      description: 'Create and manage polls',
      isActive: location.pathname === '/host/polls',
      onClick: () => window.location.href = '/host/polls'
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: '👥',
      description: 'View participant activity',
      badge: '12',
      isActive: location.pathname === '/host/participants',
      onClick: () => window.location.href = '/host/participants'
    },
    {
      id: 'responses',
      label: 'Responses',
      icon: '✅',
      description: 'Monitor poll responses',
      isActive: location.pathname === '/host/responses',
      onClick: () => window.location.href = '/host/responses'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: '🏆',
      description: 'View top performers',
      isActive: location.pathname === '/host/leaderboard',
      onClick: () => window.location.href = '/host/leaderboard'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Performance insights',
      isActive: location.pathname === '/host/performance',
      onClick: () => window.location.href = '/host/performance'
    },
    {
      id: 'upload',
      label: 'Upload Audio',
      icon: '🎵',
      description: 'Upload WAV files for processing',
      isActive: location.pathname === '/host/upload',
      onClick: () => window.location.href = '/host/upload'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Navbar */}
      <EnhancedNavbar
        onMenuToggle={setIsSideNavOpen}
        currentPage={getCurrentPageName()}
      />

      {/* Side Navigation */}
      <SideNavigation
        isOpen={isSideNavOpen}
        items={navigationItems}
        userRole="host"
        onClose={() => setIsSideNavOpen(false)}
      />

      {/* Main Container with Responsive Layout */}
      <div className="w-full max-w-full mx-auto px-3 sm:px-4 md:px-6 py-4">

        {/* Line 1: AI Status Header */}
        <div className="mb-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 hover-lift fade-in-up">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-heading gradient-text">AI Poll Generation</h2>
                <p className="text-gray-600 text-base">
                  {isMeetingActive
                    ? "🟢 AI is actively generating polls from your meeting conversation"
                    : "⚪ Connect to a meeting and start AI-powered poll generation"
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMeetingActive(!isMeetingActive)}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 hover-lift btn-animate ${
                isMeetingActive
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
            >
              {isMeetingActive ? '⏹️ Stop AI' : '🚀 Start AI'}
            </button>
          </div>
        </div>

        {/* Line 2: Navigation Tabs */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-3 shadow-lg border border-gray-200/50">
            <ul className="flex space-x-2 overflow-x-auto">
              {navigationItems.map((item, index) => (
                <li key={item.id} className={`fade-in-up stagger-${index + 1}`}>
                  <Link
                    to={item.id === 'live-meeting' ? '/host' : `/host/${item.id.replace('-', 's').replace('live-meetings', 'live-meeting').replace('poll-controls', 'polls').replace('analytics', 'performance')}`}
                    className={`flex items-center space-x-3 px-5 py-3 rounded-xl text-base font-medium whitespace-nowrap transition-all duration-200 hover-scale ${
                      item.isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
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
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          {/* Main Content Area */}
          <div className="flex-1 lg:flex-[3] min-w-0">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 page-transition">
              <Routes>
                <Route path="/" element={<LiveMeeting />} />
                <Route path="/polls" element={<PollControl />} />
                <Route path="/participants" element={<ParticipantsView />} />
                <Route path="/responses" element={<ResponsesView />} />
                <Route path="/leaderboard" element={<LeaderboardView />} />
                <Route path="/performance" element={<PerformanceDashboard />} />
                <Route path="/upload" element={
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">🎵 Audio File Upload</h2>
                      <p className="text-gray-600">Upload WAV files to test Srejith's audio processing functionality</p>
                    </div>
                    <UploadWAV
                      meetingId="test-meeting-123"
                      speaker="host"
                      onUploadStart={() => console.log("Upload started")}
                      onUploadComplete={() => console.log("Upload completed")}
                      onUploadError={(error) => console.error("Upload error:", error)}
                    />
                  </div>
                } />
              </Routes>
            </div>
          </div>

          {/* Compact Analytics Sidebar */}
          <div className="w-full lg:w-96 lg:flex-shrink-0 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-5 slide-in-right">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-base">📊</span>
              </div>
              <h3 className="text-lg font-heading gradient-text-purple">Live Analytics</h3>
            </div>

            {/* Compact Quick Stats */}
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200/50 hover-lift fade-in-up stagger-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Participants</p>
                    <p className="text-2xl font-bold gradient-text-blue">12</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-base">👥</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50 hover-lift fade-in-up stagger-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Now</p>
                    <p className="text-2xl font-bold gradient-text-green">8</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center pulse">
                    <span className="text-white text-base">🟢</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200/50 hover-lift fade-in-up stagger-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold gradient-text-purple">85%</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-base">📈</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Participants */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <span className="h-1.5 w-1.5 bg-green-400 rounded-full mr-2"></span>
                Currently Active (8)
              </h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {[
                  { name: 'Sarah Johnson', status: 'answering', avatar: '👩‍💼' },
                  { name: 'Mike Chen', status: 'viewing', avatar: '👨‍💻' },
                  { name: 'Emily Davis', status: 'answering', avatar: '👩‍🎓' },
                  { name: 'Alex Rodriguez', status: 'viewing', avatar: '👨‍🔬' }
                ].map((participant, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <span className="mr-1 text-sm">{participant.avatar}</span>
                      <span className="text-gray-700 truncate">{participant.name.split(' ')[0]}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      participant.status === 'answering'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {participant.status === 'answering' ? '✍️' : '👀'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                🏆 Top Performers
              </h4>
              <div className="space-y-1">
                {[
                  { name: 'Sarah Johnson', score: 95, correct: 19, total: 20 },
                  { name: 'Emily Davis', score: 90, correct: 18, total: 20 },
                  { name: 'Mike Chen', score: 85, correct: 17, total: 20 }
                ].map((performer, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <span className="mr-1 text-sm">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <p className="text-gray-700 font-medium">{performer.name.split(' ')[0]}</p>
                        <p className="text-xs text-gray-500">{performer.correct}/{performer.total}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600 text-sm">{performer.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Levels */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">📊 Engagement</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">High</span>
                    <span className="text-green-600 font-medium">6</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: '50%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Medium</span>
                    <span className="text-yellow-600 font-medium">4</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '33%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Low</span>
                    <span className="text-red-600 font-medium">2</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{width: '17%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
