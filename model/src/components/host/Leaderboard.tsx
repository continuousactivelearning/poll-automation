import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Users } from 'lucide-react';
import GlassCard from '../GlassCard';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  streak: number;
  rank: number;
  previousRank: number;
}

const Leaderboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState('session');
  const [leaderboardData] = useState<LeaderboardEntry[]>([
    {
      id: '1',
      name: 'Michael Chen',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150',
      score: 950,
      correctAnswers: 8,
      totalAnswers: 8,
      averageResponseTime: 8.3,
      streak: 8,
      rank: 1,
      previousRank: 2,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      score: 890,
      correctAnswers: 7,
      totalAnswers: 8,
      averageResponseTime: 12.5,
      streak: 5,
      rank: 2,
      previousRank: 1,
    },
    {
      id: '3',
      name: 'James Wilson',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      score: 850,
      correctAnswers: 6,
      totalAnswers: 7,
      averageResponseTime: 11.2,
      streak: 4,
      rank: 3,
      previousRank: 4,
    },
    {
      id: '4',
      name: 'Emma Davis',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      score: 720,
      correctAnswers: 5,
      totalAnswers: 6,
      averageResponseTime: 15.7,
      streak: 2,
      rank: 4,
      previousRank: 3,
    },
    {
      id: '5',
      name: 'David Park',
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150',
      score: 680,
      correctAnswers: 4,
      totalAnswers: 6,
      averageResponseTime: 18.2,
      streak: 1,
      rank: 5,
      previousRank: 6,
    },
    {
      id: '6',
      name: 'Lisa Zhang',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      score: 650,
      correctAnswers: 4,
      totalAnswers: 7,
      averageResponseTime: 20.1,
      streak: 1,
      rank: 6,
      previousRank: 5,
    },
  ]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">{rank}</div>;
    }
  };

  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return { direction: 'up', change: previous - current };
    if (current > previous) return { direction: 'down', change: current - previous };
    return { direction: 'same', change: 0 };
  };

  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-gray-300">Track top performers and celebrate achievements</p>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="glass-input"
          >
            <option value="session">Current Session</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <GlassCard className="p-8 mb-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">Top Performers</h3>
        
        <div className="flex justify-center items-end space-x-4 mb-8">
          {/* Second Place */}
          {topThree[1] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="leaderboard-item rank-2 flex-col w-32 h-40 justify-end p-4"
            >
              <div className="text-center">
                <img
                  src={topThree[1].avatar}
                  alt={topThree[1].name}
                  className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-400"
                />
                <div className="flex justify-center mb-2">
                  {getRankIcon(2)}
                </div>
                <div className="text-white font-semibold text-sm">{topThree[1].name}</div>
                <div className="text-gray-300 text-xs">{topThree[1].score} pts</div>
              </div>
            </motion.div>
          )}

          {/* First Place */}
          {topThree[0] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="leaderboard-item rank-1 flex-col w-36 h-48 justify-end p-4 relative"
            >
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <div className="text-center">
                <img
                  src={topThree[0].avatar}
                  alt={topThree[0].name}
                  className="w-20 h-20 rounded-full mx-auto mb-2 border-4 border-yellow-400"
                />
                <div className="flex justify-center mb-2">
                  {getRankIcon(1)}
                </div>
                <div className="text-white font-bold">{topThree[0].name}</div>
                <div className="text-yellow-400 font-semibold">{topThree[0].score} pts</div>
              </div>
            </motion.div>
          )}

          {/* Third Place */}
          {topThree[2] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="leaderboard-item rank-3 flex-col w-28 h-32 justify-end p-4"
            >
              <div className="text-center">
                <img
                  src={topThree[2].avatar}
                  alt={topThree[2].name}
                  className="w-14 h-14 rounded-full mx-auto mb-2 border-4 border-amber-600"
                />
                <div className="flex justify-center mb-2">
                  {getRankIcon(3)}
                </div>
                <div className="text-white font-semibold text-sm">{topThree[2].name}</div>
                <div className="text-gray-300 text-xs">{topThree[2].score} pts</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Top 3 Stats */}
        <div className="grid grid-cols-3 gap-4">
          {topThree.map((entry, index) => (
            <div key={entry.id} className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-white font-semibold mb-2">{entry.name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-400">Accuracy</div>
                  <div className="text-green-400 font-semibold">
                    {getAccuracy(entry.correctAnswers, entry.totalAnswers)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Streak</div>
                  <div className="text-orange-400 font-semibold">{entry.streak}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Full Leaderboard */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Full Ranking</h3>
        
        <div className="space-y-3">
          <AnimatePresence>
            {leaderboardData.map((entry, index) => {
              const rankChange = getRankChange(entry.rank, entry.previousRank);
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`leaderboard-item ${
                    entry.rank === 1 ? 'rank-1' :
                    entry.rank === 2 ? 'rank-2' :
                    entry.rank === 3 ? 'rank-3' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(entry.rank)}
                      
                      {rankChange.direction !== 'same' && (
                        <div className={`flex items-center text-xs ${
                          rankChange.direction === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <TrendingUp 
                            className={`w-3 h-3 mr-1 ${
                              rankChange.direction === 'down' ? 'rotate-180' : ''
                            }`} 
                          />
                          {rankChange.change}
                        </div>
                      )}
                    </div>
                    
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">{entry.name}</h4>
                        <div className="text-xl font-bold text-white">{entry.score}</div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-300">
                        <span>{getAccuracy(entry.correctAnswers, entry.totalAnswers)}% accuracy</span>
                        <span>{entry.streak} streak</span>
                        <span>{entry.averageResponseTime}s avg</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Achievement Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <GlassCard className="p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-2">Perfect Score</h4>
          <p className="text-gray-300 text-sm mb-4">Michael Chen achieved 100% accuracy</p>
          <span className="status-indicator bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Achievement Unlocked
          </span>
        </GlassCard>

        <GlassCard className="p-6 text-center">
          <Medal className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-2">Speed Demon</h4>
          <p className="text-gray-300 text-sm mb-4">Fastest average response: 8.3s</p>
          <span className="status-indicator bg-electric-cyan/20 text-electric-cyan border-electric-cyan/30">
            New Record
          </span>
        </GlassCard>

        <GlassCard className="p-6 text-center">
          <Users className="w-8 h-8 text-vibrant-magenta mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-2">Top Engagement</h4>
          <p className="text-gray-300 text-sm mb-4">100% participation rate achieved</p>
          <span className="status-indicator bg-vibrant-magenta/20 text-vibrant-magenta border-vibrant-magenta/30">
            Class Goal Met
          </span>
        </GlassCard>
      </div>
    </div>
  );
};

export default Leaderboard;