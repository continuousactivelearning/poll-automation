// apps/frontend/src/pages/Leaderboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Clock, Target, Loader2, Lightbulb } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_SERVER_URL = 'http://localhost:3000';

interface LeaderboardEntry {
    id: number | string;
    name: string;
    email: string;
    points: number; 
    correct: number;
    attempted: number; 
    accuracy: number;
    avgTime: string;   
    currentStreak: number;
    longestStreak: number; 
    rank: number;
    change: number; 
    userId: string;
}

const Leaderboard = () => {
  const { token, user } = useAuth();
  const { showNotification } = useNotificationContext();
  const [viewMode, setViewMode] = useState<'global' | 'meeting'>('meeting'); 
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('Loading...');
  
  const [searchParams] = useSearchParams();
  const localStorageSessionId = localStorage.getItem('activePollSession');
  const sessionId = searchParams.get('sessionId') || localStorageSessionId || ''; 

  // *************************************************************
  // Podium Height Mapping Helper
  // *************************************************************
  const getPodiumHeightClass = (rank: number, isFirstRendered: boolean) => {
    // Height mapping based on visual rank (1, 2, 3)
    let heightClass = 'h-20'; // Default for rank 3+

    if (rank === 1) {
        heightClass = 'h-32';
    } else if (rank === 2) {
        heightClass = 'h-24';
    } else if (rank === 3) {
        heightClass = 'h-20';
    }
    
    // Check for ties in the Top 3 visualized spots:
    // If the person is rank 2, but the person at TopPerformers[0] is ALSO rank 2 (a tie),
    // then they both should use the height of the highest rank (h-24).
    
    if (isFirstRendered) {
      // Check for tie scenarios for ranks 1 and 2
      const top3Ranks = leaderboardData.slice(0, 3).map(p => p.rank);
      
      if (top3Ranks.length > 1) {
          const rank1 = top3Ranks[0];
          const rank2 = top3Ranks.length > 1 ? top3Ranks[1] : 99;
          const rank3 = top3Ranks.length > 2 ? top3Ranks[2] : 99;
  
          // Tie between 1st and 2nd (e.g., both Rank 1)
          if (rank === rank1 && rank1 === rank2 && rank1 === 1) {
              heightClass = 'h-32'; // Max height
          } 
          // Tie between 2nd and 3rd (e.g., both Rank 2)
          else if (rank === rank2 && rank2 === rank3 && rank2 === 2) {
              heightClass = 'h-24'; // Rank 2 height
          }
      }
    }
    
    return heightClass;
  };


  // *************************************************************
  // Fetch Leaderboard Data Function (Unchanged)
  // *************************************************************
  const fetchLeaderboard = useCallback(async () => {
    if (!token || !sessionId) {
        setLoading(false);
        setSessionTitle('Session ID Missing');
        return;
    }

    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      
      const response = await axios.get<{ message: string, leaderboard: LeaderboardEntry[], sessionTitle: string }>(
        `${API_BASE_URL}/manual-polls/leaderboard/${sessionId}`, 
        config
      );

      // Map the fetched backend data to the frontend interface
      const data = response.data.leaderboard.map((item, index) => ({
          ...item,
          id: item.userId || index, 
          accuracy: parseFloat(item.accuracy.toFixed(1)),
          change: Math.floor(Math.random() * 3) - 1, 
          pollsAttempted: item.attempted, 
          avgTime: item.avgTime || (Math.random() * 5 + 1).toFixed(1),
          streak: item.longestStreak, 
      })) as LeaderboardEntry[]; 

      setLeaderboardData(data);
      setSessionTitle(response.data.sessionTitle);

    } catch (error: any) {
      console.error('Error fetching leaderboard data:', error.response?.data || error.message);
      showNotification(error.response?.data?.message || 'Failed to load leaderboard. Check session ID or Host status.', 'error');
      setLeaderboardData([]); 
      setSessionTitle('Error Loading Session');
    } finally {
      setLoading(false);
    }
  }, [token, sessionId, showNotification]);

  // *************************************************************
  // Socket.IO Real-time Update Effect
  // *************************************************************
  useEffect(() => {
    if (!sessionId || !user?.id) return;
    
    const socket = io(SOCKET_SERVER_URL);
    
    socket.on('pollAnswered', (data: { pollId: string, userId: string, answer: string }) => {
        if (data.pollId) {
            console.log("Real-time answer received, refreshing leaderboard...");
            fetchLeaderboard(); 
        }
    });

    return () => {
        socket.disconnect();
    };
  }, [sessionId, user?.id, fetchLeaderboard]); 

  // Initial fetch and interval polling fallback
  useEffect(() => {
    fetchLeaderboard();
    
    const interval = setInterval(fetchLeaderboard, 30000); 

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);
  
  const currentLeaderboard = leaderboardData;

  const globalLeaderboard = [
    ...currentLeaderboard, 
  ].sort((a, b) => b.points - a.points);


  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-orange-500';
      case 2:
        return 'from-gray-400 to-gray-600';
      case 3:
        return 'from-orange-500 to-red-500';
      default:
        return 'from-primary-500 to-secondary-500';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (change < 0) {
      return <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />;
    }
    return <div className="w-4 h-4" />;
  };

  const TopPerformers = currentLeaderboard.slice(0, 3);

  // Helper values for stat blocks
  const parsedAvgTimes = currentLeaderboard.map(p => parseFloat(p.avgTime));
  const maxAccuracy = Math.max(...currentLeaderboard.map(p => p.accuracy));
  const minAvgTime = Math.min(...parsedAvgTimes.filter(t => !isNaN(t)));
  const maxLongestStreak = Math.max(...currentLeaderboard.map(p => p.longestStreak));


  if (loading && currentLeaderboard.length === 0) {
    return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-full min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                <p className="mt-4 text-gray-300 ml-3">Loading Leaderboard...</p>
            </div>
        </DashboardLayout>
    );
  }
  
  if (currentLeaderboard.length === 0 && !loading) {
    return (
        <DashboardLayout>
            <GlassCard className="p-8 text-center">
                <Lightbulb className="w-10 h-10 mx-auto text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Poll Data Yet</h3>
                <p className="text-gray-400">Run a poll and have students submit answers to see the rankings appear here.</p>
                <p className="text-gray-400 text-xs mt-2">Session ID: {sessionId || 'Not provided'}</p>
            </GlassCard>
        </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 overflow-x-hidden"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-gray-400">Top performing participants for: <span className='text-primary-400 font-medium'>{sessionTitle}</span></p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('global')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${viewMode === 'global'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Global
              </button>
              <button
                onClick={() => setViewMode('meeting')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${viewMode === 'meeting'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Current Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <GlassCard className="p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Top Performers</h3>
          {/* FIX: Set fixed widths/orders for the podium to prevent overlap */}
          <div className="flex flex-col md:flex-row items-end justify-center md:gap-12 gap-8">
            {/* First Place (Rank 1) - Order 2 on desktop */}
            {TopPerformers[0] && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center text-center order-2 md:order-1 w-36"
                >
                    <div className="relative mb-4">
                        <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-glow">
                            <span className="text-white font-bold text-xl">
                                {TopPerformers[0].name.split('-').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div className="absolute -top-3 -right-3">
                            <Crown className="w-10 h-10 text-yellow-400" />
                        </div>
                    </div>
                    {/* FIX: Use dynamic height class based on actual rank */}
                    <div className={`bg-gradient-to-t from-orange-600 to-yellow-500 rounded-t-lg p-4 flex flex-col justify-end w-full ${getPodiumHeightClass(TopPerformers[0].rank, true)}`}>
                        <h4 className="font-bold text-white truncate" title={TopPerformers[0].name}>{TopPerformers[0].name}</h4>
                        <p className="text-yellow-100 text-sm">{TopPerformers[0].accuracy.toFixed(1)}% acc</p>
                        <p className="text-yellow-100 text-sm">{TopPerformers[0].points} pts</p>
                    </div>
                </motion.div>
            )}

            {/* Second Place (Rank 2) - Order 1 on desktop */}
            {TopPerformers[1] && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center text-center order-1 md:order-2 w-32"
                >
                    <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-lg">
                                {TopPerformers[1].name.split('-').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div className="absolute -top-2 -right-2">
                            <Medal className="w-8 h-8 text-gray-300" />
                        </div>
                    </div>
                    {/* FIX: Use dynamic height class based on actual rank */}
                    <div className={`bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg p-4 flex flex-col justify-end w-full ${getPodiumHeightClass(TopPerformers[1].rank, true)}`}>
                        <h4 className="font-bold text-white text-sm truncate" title={TopPerformers[1].name}>{TopPerformers[1].name}</h4>
                        <p className="text-gray-200 text-xs">{TopPerformers[1].accuracy.toFixed(1)}% acc</p>
                        <p className="text-gray-200 text-xs">{TopPerformers[1].points} pts</p>
                    </div>
                </motion.div>
            )}

            {/* Third Place (Rank 3) - Order 3 on desktop */}
            {TopPerformers[2] && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center text-center order-3 md:order-3 w-32"
                >
                    <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-lg">
                                {TopPerformers[2].name.split('-').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div className="absolute -top-2 -right-2">
                            <Award className="w-8 h-8 text-orange-400" />
                        </div>
                    </div>
                    {/* FIX: Use dynamic height class based on actual rank */}
                    <div className={`bg-gradient-to-t from-red-600 to-orange-500 rounded-t-lg p-4 flex flex-col justify-end w-full ${getPodiumHeightClass(TopPerformers[2].rank, true)}`}>
                        <h4 className="font-bold text-white text-sm truncate" title={TopPerformers[2].name}>{TopPerformers[2].name}</h4>
                        <p className="text-orange-100 text-xs">{TopPerformers[2].accuracy.toFixed(1)}% acc</p>
                        <p className="text-orange-100 text-xs">{TopPerformers[2].points} pts</p>
                    </div>
                </motion.div>
            )}
          </div>
        </GlassCard>

        {/* Full Leaderboard */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            {viewMode === 'global' ? 'Global Rankings' : 'Meeting Rankings'}
          </h3>
          <div className="space-y-4">
            {(viewMode === 'global' ? globalLeaderboard : currentLeaderboard).map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border ${participant.rank <= 3
                    ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/20'
                    : 'bg-white/5 border-white/10'
                  } hover:border-white/20 transition-colors duration-200`}
              >
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(participant.rank)}
                    {getChangeIcon(participant.change)}
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${getRankColor(participant.rank)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold">
                      {participant.name.split('-').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{participant.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>{participant.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{participant.avgTime}s</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-3 h-3" />
                        <span>{participant.longestStreak} streak</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4 md:mt-0">
                  <div className="text-center sm:text-right">
                    <p className="text-white font-bold">{participant.points}</p>
                    <p className="text-gray-400 text-sm">points</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-white font-medium">{participant.attempted}</p>
                    <p className="text-gray-400 text-sm">polls</p>
                  </div>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r ${getRankColor(participant.rank)} rounded-full h-2`}
                      style={{ width: `${participant.accuracy}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Highest Accuracy</p>
                <p className="text-2xl font-bold text-white">
                  {maxAccuracy}%
                </p>
                <p className="text-gray-400 text-sm">
                  {currentLeaderboard.find(p => p.accuracy === maxAccuracy)?.name}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Fastest Response</p>
                <p className="text-2xl font-bold text-white">
                  {minAvgTime.toFixed(1)}s
                </p>
                <p className="text-gray-400 text-sm">
                  {currentLeaderboard.find(p => parseFloat(p.avgTime) === minAvgTime)?.name}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Longest Streak</p>
                <p className="text-2xl font-bold text-white">
                  {maxLongestStreak}
                </p>
                <p className="text-gray-400 text-sm">
                  {currentLeaderboard.find(p => p.longestStreak === maxLongestStreak)?.name}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Leaderboard;