import React, { useState } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  streak: number;
  badges: string[];
  rank: number;
  rankChange: number; // +1 for up, -1 for down, 0 for no change
}

const LeaderboardView: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [sortBy, setSortBy] = useState<'points' | 'accuracy' | 'speed'>('points');

  const leaderboardData: LeaderboardEntry[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      totalPoints: 950,
      correctAnswers: 19,
      totalAnswers: 20,
      accuracy: 95,
      averageResponseTime: 8.5,
      streak: 12,
      badges: ['🎯', '⚡', '🔥'],
      rank: 1,
      rankChange: 0
    },
    {
      id: '2',
      name: 'Emily Davis',
      avatar: '👩‍🎓',
      totalPoints: 890,
      correctAnswers: 18,
      totalAnswers: 20,
      accuracy: 90,
      averageResponseTime: 12.3,
      streak: 8,
      badges: ['🎯', '🔥'],
      rank: 2,
      rankChange: 1
    },
    {
      id: '3',
      name: 'Mike Chen',
      avatar: '👨‍💻',
      totalPoints: 820,
      correctAnswers: 17,
      totalAnswers: 20,
      accuracy: 85,
      averageResponseTime: 9.8,
      streak: 5,
      badges: ['⚡'],
      rank: 3,
      rankChange: -1
    },
    {
      id: '4',
      name: 'David Kim',
      avatar: '👨‍💼',
      totalPoints: 780,
      correctAnswers: 15,
      totalAnswers: 19,
      accuracy: 79,
      averageResponseTime: 15.2,
      streak: 3,
      badges: ['🎯'],
      rank: 4,
      rankChange: 0
    },
    {
      id: '5',
      name: 'Alex Rodriguez',
      avatar: '👨‍🔬',
      totalPoints: 720,
      correctAnswers: 14,
      totalAnswers: 20,
      accuracy: 70,
      averageResponseTime: 18.7,
      streak: 2,
      badges: [],
      rank: 5,
      rankChange: 1
    },
    {
      id: '6',
      name: 'Lisa Wang',
      avatar: '👩‍🏫',
      totalPoints: 680,
      correctAnswers: 13,
      totalAnswers: 18,
      accuracy: 72,
      averageResponseTime: 14.5,
      streak: 1,
      badges: [],
      rank: 6,
      rankChange: -1
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <span className="text-green-500">↗️</span>;
    if (change < 0) return <span className="text-red-500">↘️</span>;
    return <span className="text-gray-400">➡️</span>;
  };

  const getBadgeTooltip = (badge: string) => {
    const tooltips: { [key: string]: string } = {
      '🎯': 'Accuracy Master (90%+ accuracy)',
      '⚡': 'Speed Demon (avg <10s response)',
      '🔥': 'Hot Streak (5+ correct in a row)',
      '💎': 'Perfect Score',
      '🚀': 'Rising Star',
      '👑': 'Champion'
    };
    return tooltips[badge] || 'Achievement Badge';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">🏆 Leaderboard</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="points">Total Points</option>
              <option value="accuracy">Accuracy</option>
              <option value="speed">Response Speed</option>
            </select>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {leaderboardData.slice(0, 3).map((entry, index) => (
            <div key={entry.id} className={`text-center p-4 rounded-lg ${
              index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
              index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
              'bg-orange-50 border-2 border-orange-200'
            }`}>
              <div className="text-4xl mb-2">{getRankIcon(entry.rank)}</div>
              <div className="text-3xl mb-2">{entry.avatar}</div>
              <h3 className="font-medium text-gray-900">{entry.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{entry.totalPoints}</p>
              <p className="text-sm text-gray-500">points</p>
              <div className="flex justify-center space-x-1 mt-2">
                {entry.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} title={getBadgeTooltip(badge)} className="text-lg">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accuracy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Speed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Streak
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Badges
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboardData.map((entry) => (
              <tr key={entry.id} className={`hover:bg-gray-50 ${
                entry.rank <= 3 ? 'bg-yellow-50' : ''
              }`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getRankIcon(entry.rank)}</span>
                    {getRankChangeIcon(entry.rankChange)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{entry.avatar}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                      <div className="text-sm text-gray-500">
                        {entry.correctAnswers}/{entry.totalAnswers} answered
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-blue-600">{entry.totalPoints}</div>
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
                  <span className={`text-sm font-medium ${
                    entry.averageResponseTime <= 10 ? 'text-green-600' :
                    entry.averageResponseTime <= 15 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {entry.averageResponseTime}s
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{entry.streak}</span>
                    {entry.streak >= 5 && <span className="ml-1 text-orange-500">🔥</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    {entry.badges.map((badge, badgeIndex) => (
                      <span 
                        key={badgeIndex} 
                        title={getBadgeTooltip(badge)}
                        className="text-lg cursor-help"
                      >
                        {badge}
                      </span>
                    ))}
                    {entry.badges.length === 0 && (
                      <span className="text-gray-400 text-sm">No badges yet</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Achievement System Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">🏅 Achievement Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div><span className="mr-1">🎯</span> Accuracy Master (90%+ accuracy)</div>
          <div><span className="mr-1">⚡</span> Speed Demon (avg &lt;10s response)</div>
          <div><span className="mr-1">🔥</span> Hot Streak (5+ correct in a row)</div>
          <div><span className="mr-1">💎</span> Perfect Score (100% on a poll)</div>
          <div><span className="mr-1">🚀</span> Rising Star (biggest rank improvement)</div>
          <div><span className="mr-1">👑</span> Champion (weekly #1)</div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
