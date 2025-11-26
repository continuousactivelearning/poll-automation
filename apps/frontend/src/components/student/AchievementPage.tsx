import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Clock, Zap, Target, Award, Lock, CheckCircle, Users, TrendingUp, Flame, Brain, Crown, RefreshCw } from 'lucide-react';
import GlassCard from '../GlassCard';
import { apiService } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Achievement interface
interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'participation' | 'performance' | 'speed' | 'streak' | 'knowledge' | 'consistency';
  earned: boolean;
  progress: number;
  maxProgress: number;
  points: number;
  earnedDate?: string;
  requirements: string[];
}

interface AchievementStats {
  totalEarned: number;
  legendary: number;
  epic: number;
  rare: number;
  common: number;
  totalPoints: number;
  completion: number;
}

const AchievementPage = () => {
  const { socket } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch achievements data
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserAchievements();
      setAchievements(response.data.achievements);
      setStats(response.data.stats);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch achievements:', err);
      setError(err.response?.data?.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Real-time achievement listener
  useEffect(() => {
    if (!socket) return;

    const handleAchievementUnlocked = (data: { achievement: Achievement; message: string }) => {
      console.log('🏆 New achievement unlocked:', data);
      
      // Show success toast with achievement details
      toast.success(
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <div>
            <p className="font-bold">{data.achievement.name}</p>
            <p className="text-sm text-gray-300">{data.message}</p>
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );

      // Refresh achievements list
      fetchAchievements();
    };

    socket.on('achievement-unlocked', handleAchievementUnlocked);

    return () => {
      socket.off('achievement-unlocked', handleAchievementUnlocked);
    };
  }, [socket]);

  // Dynamic stats based on real data
  const achievementStats = stats ? [
    { label: "Total Earned", value: stats.totalEarned.toString(), icon: Trophy, color: "from-yellow-500 to-orange-500" },
    { label: "Total Points", value: stats.totalPoints.toString(), icon: Star, color: "from-blue-500 to-indigo-500" },
    { label: "Legendary", value: stats.legendary.toString(), icon: Crown, color: "from-yellow-400 to-yellow-600" },
    { label: "Completion", value: `${stats.completion}%`, icon: Target, color: "from-green-500 to-teal-500" },
  ] : [];

  // Dynamic categories based on real data
  const categories = [
    { id: "all", label: "All", icon: Award, count: achievements.length },
    { id: "participation", label: "Participation", icon: Users, count: achievements.filter(a => a.category === 'participation').length },
    { id: "performance", label: "Performance", icon: TrendingUp, count: achievements.filter(a => a.category === 'performance').length },
    { id: "speed", label: "Speed", icon: Zap, count: achievements.filter(a => a.category === 'speed').length },
    { id: "streak", label: "Streak", icon: Flame, count: achievements.filter(a => a.category === 'streak').length },
    { id: "knowledge", label: "Knowledge", icon: Brain, count: achievements.filter(a => a.category === 'knowledge').length },
    { id: "consistency", label: "Consistency", icon: Clock, count: achievements.filter(a => a.category === 'consistency').length },
  ];

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = selectedCategory === "all" || achievement.category === selectedCategory;
    const matchesRarity = selectedRarity === "all" || achievement.rarity === selectedRarity;
    const matchesSearch = searchTerm === "" || 
      achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesRarity && matchesSearch;
  });

  const earnedAchievements = filteredAchievements.filter(a => a.earned);
  const lockedAchievements = filteredAchievements.filter(a => !a.earned);

  // Helper functions for styling
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-yellow-600";
      case "epic":
        return "from-purple-400 to-purple-600";
      case "rare":
        return "from-blue-400 to-blue-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-400/50";
      case "epic":
        return "border-purple-400/50";
      case "rare":
        return "border-blue-400/50";
      default:
        return "border-gray-400/50";
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "shadow-yellow-400/20";
      case "epic":
        return "shadow-purple-400/20";
      case "rare":
        return "shadow-blue-400/20";
      default:
        return "shadow-gray-400/10";
    }
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedRarity("all");
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-white">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-lg">Loading achievements...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <Trophy className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Failed to Load Achievements</h2>
            </div>
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Achievements
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Track your progress and unlock rewards based on your performance and participation in sessions.
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievementStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full lg:w-64"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                      : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{category.count}</span>
                </button>
              ))}
            </div>

            {/* Rarity Filter */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all" className="bg-gray-800">All Rarities</option>
              <option value="legendary" className="bg-gray-800">Legendary</option>
              <option value="epic" className="bg-gray-800">Epic</option>
              <option value="rare" className="bg-gray-800">Rare</option>
              <option value="common" className="bg-gray-800">Common</option>
            </select>
          </div>
        </GlassCard>

        {/* Earned Achievements */}
        {earnedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Earned Achievements ({earnedAchievements.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {earnedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <GlassCard
                    className={`p-6 hover:scale-105 transition-all duration-300 cursor-pointer border-2 ${getRarityBorder(achievement.rarity)} shadow-2xl ${getRarityGlow(achievement.rarity)}`}
                  >
                    {/* Achievement Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-sm">EARNED</div>
                        <div className="text-gray-400 text-xs">{achievement.earnedDate}</div>
                      </div>
                    </div>

                    {/* Achievement Info */}
                    <h3 className="text-white font-bold text-lg mb-2">{achievement.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{achievement.description}</p>

                    {/* Rarity and Points */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white capitalize shadow-lg`}
                      >
                        {achievement.rarity}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4" />
                        <span className="font-bold">{achievement.points}</span>
                      </div>
                    </div>

                    {/* Requirements (shown on hover) */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-gray-400 text-xs mb-2">Requirements:</p>
                        <ul className="space-y-1">
                          {achievement.requirements.map((req, idx) => (
                            <li key={idx} className="text-gray-300 text-xs flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-gray-400" />
              Locked Achievements ({lockedAchievements.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <GlassCard className="p-6 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-500/40 opacity-90 hover:opacity-95 hover:border-slate-400/60 hover:shadow-lg hover:shadow-slate-500/20">
                    {/* Achievement Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200 shadow-lg group-hover:from-slate-400 group-hover:to-slate-500">
                        <div className="filter brightness-125 contrast-110">
                          {achievement.icon}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 font-bold text-sm">LOCKED</div>
                      </div>
                    </div>

                    {/* Achievement Info */}
                    <h3 className="text-slate-200 font-bold text-lg mb-2">{achievement.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{achievement.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={`h-2 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Rarity and Points */}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-slate-500 to-slate-600 text-white capitalize shadow-sm">
                        {achievement.rarity}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Star className="w-4 h-4" />
                        <span className="font-bold">{achievement.points}</span>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="border-t border-slate-500/40 pt-3">
                        <p className="text-slate-400 text-xs mb-2">Requirements:</p>
                        <ul className="space-y-1">
                          {achievement.requirements.map((req, idx) => (
                            <li key={idx} className="text-slate-300 text-xs flex items-center gap-2">
                              <Lock className="w-3 h-3 text-slate-400" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredAchievements.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-300 mb-2">No achievements found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your filters or search terms to find achievements.
            </p>
            <button
              onClick={resetFilters}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Reset Filters
            </button>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AchievementPage;