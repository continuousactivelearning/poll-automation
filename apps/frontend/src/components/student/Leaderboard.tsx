import React, { useState } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  points: number;
  accuracy: number;
  streak: number;
  rank: number;
  rankChange: number;
  isCurrentUser: boolean;
  level: string;
  badges: string[];
}

const Leaderboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('weekly');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const leaderboardData: LeaderboardEntry[] = [
    {
      id: '1',
      name: 'Alex Chen',
      avatar: '👨‍💻',
      points: 2150,
      accuracy: 96,
      streak: 12,
      rank: 1,
      rankChange: 0,
      isCurrentUser: false,
      level: 'Expert',
      badges: ['🎯', '⚡', '🔥', '👑']
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      points: 1890,
      accuracy: 94,
      streak: 8,
      rank: 2,
      rankChange: 1,
      isCurrentUser: false,
      level: 'Advanced',
      badges: ['🎯', '⚡', '🔥']
    },
    {
      id: '3',
      name: 'You',
      avatar: '👤',
      points: 1750,
      accuracy: 86,
      streak: 7,
      rank: 3,
      rankChange: -1,
      isCurrentUser: true,
      level: 'Advanced',
      badges: ['🎯', '⚡']
    },
    {
      id: '4',
      name: 'Mike Rodriguez',
      avatar: '👨‍🎓',
      points: 1620,
      accuracy: 89,
      streak: 5,
      rank: 4,
      rankChange: 2,
      isCurrentUser: false,
      level: 'Intermediate',
      badges: ['🎯', '🔥']
    },
    {
      id: '5',
      name: 'Emily Davis',
      avatar: '👩‍🎓',
      points: 1580,
      accuracy: 91,
      streak: 6,
      rank: 5,
      rankChange: -1,
      isCurrentUser: false,
      level: 'Intermediate',
      badges: ['🎯']
    },
    {
      id: '6',
      name: 'David Kim',
      avatar: '👨‍💼',
      points: 1450,
      accuracy: 83,
      streak: 4,
      rank: 6,
      rankChange: 0,
      isCurrentUser: false,
      level: 'Intermediate',
      badges: ['⚡']
    },
    {
      id: '7',
      name: 'Lisa Wang',
      avatar: '👩‍🏫',
      points: 1320,
      accuracy: 88,
      streak: 3,
      rank: 7,
      rankChange: 1,
      isCurrentUser: false,
      level: 'Beginner',
      badges: ['🎯']
    },
    {
      id: '8',
      name: 'Tom Wilson',
      avatar: '👨‍🎨',
      points: 1280,
      accuracy: 79,
      streak: 2,
      rank: 8,
      rankChange: -2,
      isCurrentUser: false,
      level: 'Beginner',
      badges: []
    }
  ];

  const categories = ['all', 'Programming', 'Mathematics', 'Science', 'History', 'Literature'];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <span className="text-green-500">↗️ +{change}</span>;
    if (change < 0) return <span className="text-red-500">↘️ {change}</span>;
    return <span className="text-gray-400">➡️ 0</span>;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-100 text-purple-800';
      case 'Advanced': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-green-100 text-green-800';
      case 'Beginner': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentUser = leaderboardData.find(entry => entry.isCurrentUser);
  const userRank = currentUser?.rank || 0;
  const pointsToNext = userRank > 1 ? leaderboardData[userRank - 2].points - (currentUser?.points || 0) : 0;

  return (
    <div className="space-y-6">
      {/* User's Position Highlight */}
      {currentUser && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl mr-4">{currentUser.avatar}</div>
              <div>
                <h3 className="text-xl font-bold">Your Current Position</h3>
                <p className="opacity-90">Rank #{currentUser.rank} • {currentUser.points} points</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{getRankIcon(currentUser.rank)}</div>
              {userRank > 1 && (
                <p className="text-sm opacity-90 mt-1">
                  {pointsToNext} points to rank #{userRank - 1}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="allTime">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">🏆 Top Performers</h3>
        <div className="grid grid-cols-3 gap-4">
          {leaderboardData.slice(0, 3).map((entry, index) => (
            <div key={entry.id} className={`text-center p-4 rounded-lg ${
              index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
              index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
              'bg-orange-50 border-2 border-orange-200'
            } ${entry.isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="text-4xl mb-2">{getRankIcon(entry.rank)}</div>
              <div className="text-3xl mb-2">{entry.avatar}</div>
              <h4 className={`font-medium ${entry.isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                {entry.name}
              </h4>
              <p className="text-2xl font-bold text-purple-600 mt-2">{entry.points}</p>
              <p className="text-sm text-gray-500">points</p>
              <div className="flex justify-center space-x-1 mt-2">
                {entry.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-lg">{badge}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">📊 Full Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((entry) => (
                <tr key={entry.id} className={`hover:bg-gray-50 ${
                  entry.isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                } ${entry.rank <= 3 ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getRankIcon(entry.rank)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{entry.avatar}</span>
                      <div>
                        <div className={`text-sm font-medium ${
                          entry.isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {entry.name}
                          {entry.isCurrentUser && <span className="ml-2 text-blue-600">(You)</span>}
                        </div>
                        <div className="flex space-x-1 mt-1">
                          {entry.badges.map((badge, badgeIndex) => (
                            <span key={badgeIndex} className="text-sm">{badge}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-purple-600">{entry.points}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{entry.accuracy}%</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{width: `${entry.accuracy}%`}}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{entry.streak}</span>
                      {entry.streak >= 5 && <span className="ml-1 text-orange-500">🔥</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(entry.level)}`}>
                      {entry.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getRankChangeIcon(entry.rankChange)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competition Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Weekly Challenge</h3>
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg">Math Mastery Week</h4>
              <p className="text-sm opacity-90">Answer 50 math questions with 85%+ accuracy</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">3 days left</p>
              <p className="text-sm opacity-90">Prize: 500 bonus points</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress: 32/50 questions</span>
              <span>Current accuracy: 89%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{width: '64%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
