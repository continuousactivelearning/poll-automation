import React, { useState } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'accuracy' | 'speed' | 'streak' | 'participation' | 'special';
  isUnlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const Achievements: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Answer your first poll question',
      icon: '👶',
      category: 'participation',
      isUnlocked: true,
      unlockedDate: '2024-01-15',
      progress: 1,
      maxProgress: 1,
      points: 10,
      rarity: 'common'
    },
    {
      id: '2',
      title: 'Accuracy Master',
      description: 'Achieve 90% accuracy in a session',
      icon: '🎯',
      category: 'accuracy',
      isUnlocked: true,
      unlockedDate: '2024-01-18',
      progress: 1,
      maxProgress: 1,
      points: 50,
      rarity: 'rare'
    },
    {
      id: '3',
      title: 'Speed Demon',
      description: 'Answer 10 questions in under 5 seconds each',
      icon: '⚡',
      category: 'speed',
      isUnlocked: true,
      unlockedDate: '2024-01-20',
      progress: 10,
      maxProgress: 10,
      points: 75,
      rarity: 'epic'
    },
    {
      id: '4',
      title: 'Hot Streak',
      description: 'Get 10 questions correct in a row',
      icon: '🔥',
      category: 'streak',
      isUnlocked: true,
      unlockedDate: '2024-01-19',
      progress: 10,
      maxProgress: 10,
      points: 100,
      rarity: 'epic'
    },
    {
      id: '5',
      title: 'Perfect Score',
      description: 'Get 100% accuracy in a session with 10+ questions',
      icon: '💎',
      category: 'accuracy',
      isUnlocked: false,
      progress: 8,
      maxProgress: 10,
      points: 150,
      rarity: 'legendary'
    },
    {
      id: '6',
      title: 'Marathon Runner',
      description: 'Participate in 50 poll sessions',
      icon: '🏃‍♂️',
      category: 'participation',
      isUnlocked: false,
      progress: 32,
      maxProgress: 50,
      points: 200,
      rarity: 'epic'
    },
    {
      id: '7',
      title: 'Lightning Fast',
      description: 'Answer a question in under 2 seconds',
      icon: '⚡',
      category: 'speed',
      isUnlocked: false,
      progress: 0,
      maxProgress: 1,
      points: 25,
      rarity: 'rare'
    },
    {
      id: '8',
      title: 'Scholar',
      description: 'Earn 1000 total points',
      icon: '🎓',
      category: 'participation',
      isUnlocked: true,
      unlockedDate: '2024-01-21',
      progress: 1250,
      maxProgress: 1000,
      points: 100,
      rarity: 'rare'
    },
    {
      id: '9',
      title: 'Consistency King',
      description: 'Maintain a 7-day study streak',
      icon: '👑',
      category: 'streak',
      isUnlocked: true,
      unlockedDate: '2024-01-21',
      progress: 7,
      maxProgress: 7,
      points: 125,
      rarity: 'epic'
    },
    {
      id: '10',
      title: 'Subject Master',
      description: 'Achieve 95% accuracy in any subject',
      icon: '🧠',
      category: 'accuracy',
      isUnlocked: false,
      progress: 92,
      maxProgress: 95,
      points: 175,
      rarity: 'legendary'
    }
  ];

  const categories = ['all', 'accuracy', 'speed', 'streak', 'participation', 'special'];

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = filterCategory === 'all' || achievement.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'unlocked' && achievement.isUnlocked) ||
                         (filterStatus === 'locked' && !achievement.isUnlocked);
    
    return matchesCategory && matchesStatus;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-700';
      case 'rare': return 'text-blue-700';
      case 'epic': return 'text-purple-700';
      case 'legendary': return 'text-yellow-700';
      default: return 'text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{unlockedCount}/{achievements.length}</p>
            <p className="text-sm text-gray-500">Achievements</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{totalPoints}</p>
            <p className="text-sm text-gray-500">Achievement Points</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </p>
            <p className="text-sm text-gray-500">Completion</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {achievements.filter(a => a.rarity === 'legendary' && a.isUnlocked).length}
            </p>
            <p className="text-sm text-gray-500">Legendary</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Achievements</option>
              <option value="unlocked">Unlocked Only</option>
              <option value="locked">Locked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div 
            key={achievement.id} 
            className={`rounded-lg border-2 p-6 transition-all ${
              achievement.isUnlocked 
                ? getRarityColor(achievement.rarity) 
                : 'border-gray-200 bg-gray-100 opacity-75'
            }`}
          >
            <div className="text-center mb-4">
              <div className={`text-4xl mb-2 ${achievement.isUnlocked ? '' : 'grayscale'}`}>
                {achievement.icon}
              </div>
              <h3 className={`font-bold text-lg ${
                achievement.isUnlocked ? getRarityTextColor(achievement.rarity) : 'text-gray-500'
              }`}>
                {achievement.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {achievement.progress}/{achievement.maxProgress}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    achievement.isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`}}
                ></div>
              </div>
            </div>

            {/* Achievement Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Points:</span>
                <span className="font-medium text-purple-600">{achievement.points}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rarity:</span>
                <span className={`font-medium capitalize ${getRarityTextColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </span>
              </div>
              {achievement.isUnlocked && achievement.unlockedDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unlocked:</span>
                  <span className="font-medium text-green-600">
                    {formatDate(achievement.unlockedDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mt-4 text-center">
              {achievement.isUnlocked ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✅ Unlocked
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  🔒 Locked
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
          <p className="text-gray-600">Try adjusting your filters.</p>
        </div>
      )}

      {/* Achievement Tips */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-lg font-medium mb-4">🎯 Tips to Unlock More Achievements</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Quick Wins:</h4>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Answer questions faster to unlock speed achievements</li>
              <li>• Maintain daily participation for streak rewards</li>
              <li>• Focus on accuracy to unlock precision badges</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Long-term Goals:</h4>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Work towards subject mastery achievements</li>
              <li>• Participate in special events for rare badges</li>
              <li>• Help other students for community achievements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
