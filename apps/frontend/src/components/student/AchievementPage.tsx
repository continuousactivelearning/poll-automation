
// apps/frontend/src/components/student/AchievementPage.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Award,
  Trophy,
  Star,
  Crown,
  Target,
  Zap,
  Flame,
  Gem,
  TrendingUp,
  Users,
  Brain,
  Lock,
  CheckCircle,
  RotateCcw,
  Search,
} from "lucide-react"
import GlassCard from "../GlassCard"

const AchievementPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRarity, setSelectedRarity] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const achievementStats = [
    { label: "Total Earned", value: "24", icon: Trophy, color: "from-yellow-500 to-orange-500" },
    { label: "Legendary", value: "3", icon: Crown, color: "from-yellow-400 to-yellow-600" },
    { label: "Epic", value: "8", icon: Gem, color: "from-purple-500 to-pink-500" },
    { label: "Completion", value: "68%", icon: Target, color: "from-green-500 to-teal-500" },
  ]

  const categories = [
    { id: "all", label: "All", icon: Award, count: 35 },
    { id: "participation", label: "Participation", icon: Users, count: 12 },
    { id: "performance", label: "Performance", icon: TrendingUp, count: 8 },
    { id: "speed", label: "Speed", icon: Zap, count: 6 },
    { id: "streak", label: "Streak", icon: Flame, count: 5 },
    { id: "knowledge", label: "Knowledge", icon: Brain, count: 4 },
  ]

  const achievements = [
    {
      id: 1,
      name: "Speed Demon",
      description: "Answer 10 questions in under 5 seconds each",
      icon: "⚡",
      rarity: "legendary",
      category: "speed",
      earned: true,
      progress: 100,
      maxProgress: 10,
      points: 500,
      earnedDate: "2024-01-15",
      requirements: ["Answer 10 questions", "Each under 5 seconds", "In a single poll"],
    },
    {
      id: 2,
      name: "Perfect Scholar",
      description: "Achieve 100% accuracy on 5 consecutive polls",
      icon: "🎯",
      rarity: "legendary",
      category: "performance",
      earned: true,
      progress: 100,
      maxProgress: 5,
      points: 750,
      earnedDate: "2024-01-10",
      requirements: ["100% accuracy", "5 consecutive polls", "No wrong answers"],
    },
    {
      id: 3,
      name: "Knowledge Master",
      description: "Score 90%+ in all subject categories",
      icon: "🧠",
      rarity: "legendary",
      category: "knowledge",
      earned: true,
      progress: 100,
      maxProgress: 6,
      points: 1000,
      earnedDate: "2024-01-05",
      requirements: [
        "90%+ in Math",
        "90%+ in Science",
        "90%+ in History",
        "90%+ in Literature",
        "90%+ in Programming",
        "90%+ in General",
      ],
    },
    {
      id: 4,
      name: "Streak Master",
      description: "Maintain a 30-day participation streak",
      icon: "🔥",
      rarity: "epic",
      category: "streak",
      earned: true,
      progress: 100,
      maxProgress: 30,
      points: 400,
      earnedDate: "2024-01-20",
      requirements: ["Participate daily", "30 consecutive days", "No missed days"],
    },
    {
      id: 5,
      name: "Early Bird",
      description: "Join 15 polls within the first minute",
      icon: "🌅",
      rarity: "epic",
      category: "participation",
      earned: true,
      progress: 100,
      maxProgress: 15,
      points: 300,
      earnedDate: "2024-01-18",
      requirements: ["Join within 60 seconds", "15 different polls", "Be among first participants"],
    },
    {
      id: 6,
      name: "Team Player",
      description: "Help 20 classmates in study groups",
      icon: "🤝",
      rarity: "epic",
      category: "participation",
      earned: true,
      progress: 100,
      maxProgress: 20,
      points: 250,
      earnedDate: "2024-01-12",
      requirements: ["Help classmates", "Study group participation", "20 different students"],
    },
    {
      id: 7,
      name: "Quick Learner",
      description: "Improve accuracy by 20% in one week",
      icon: "📈",
      rarity: "epic",
      category: "performance",
      earned: true,
      progress: 100,
      maxProgress: 20,
      points: 350,
      earnedDate: "2024-01-08",
      requirements: ["Track weekly progress", "20% improvement", "Minimum 10 polls"],
    },
    {
      id: 8,
      name: "Night Owl",
      description: "Complete 10 polls after 10 PM",
      icon: "🦉",
      rarity: "rare",
      category: "participation",
      earned: true,
      progress: 100,
      maxProgress: 10,
      points: 150,
      earnedDate: "2024-01-14",
      requirements: ["After 10 PM", "10 different polls", "Complete fully"],
    },
    {
      id: 9,
      name: "Comeback King",
      description: "Win a poll after being in last place",
      icon: "👑",
      rarity: "epic",
      category: "performance",
      earned: true,
      progress: 100,
      maxProgress: 1,
      points: 400,
      earnedDate: "2024-01-16",
      requirements: ["Start in last place", "Finish in 1st place", "Same poll session"],
    },
    {
      id: 10,
      name: "Consistency Champion",
      description: "Score between 80-90% on 20 polls",
      icon: "⚖️",
      rarity: "rare",
      category: "performance",
      earned: true,
      progress: 100,
      maxProgress: 20,
      points: 200,
      earnedDate: "2024-01-11",
      requirements: ["80-90% accuracy", "20 different polls", "Consistent performance"],
    },
    // Locked achievements
    {
      id: 11,
      name: "Legendary Scholar",
      description: "Achieve 95%+ accuracy on 10 consecutive polls",
      icon: "🏆",
      rarity: "legendary",
      category: "performance",
      earned: false,
      progress: 7,
      maxProgress: 10,
      points: 1500,
      requirements: ["95%+ accuracy", "10 consecutive polls", "No breaks in streak"],
    },
    {
      id: 12,
      name: "Lightning Fast",
      description: "Answer 50 questions in under 3 seconds each",
      icon: "⚡",
      rarity: "epic",
      category: "speed",
      earned: false,
      progress: 32,
      maxProgress: 50,
      points: 600,
      requirements: ["Under 3 seconds", "50 questions total", "Across multiple polls"],
    },
    {
      id: 13,
      name: "Century Club",
      description: "Participate in 100 different polls",
      icon: "💯",
      rarity: "epic",
      category: "participation",
      earned: false,
      progress: 47,
      maxProgress: 100,
      points: 500,
      requirements: ["100 unique polls", "Full participation", "Complete each poll"],
    },
    {
      id: 14,
      name: "Subject Specialist",
      description: "Score 95%+ in any single subject 15 times",
      icon: "🎓",
      rarity: "rare",
      category: "knowledge",
      earned: false,
      progress: 11,
      maxProgress: 15,
      points: 300,
      requirements: ["95%+ accuracy", "Same subject", "15 different polls"],
    },
    {
      id: 15,
      name: "Marathon Runner",
      description: "Maintain a 100-day participation streak",
      icon: "🏃",
      rarity: "legendary",
      category: "streak",
      earned: false,
      progress: 45,
      maxProgress: 100,
      points: 2000,
      requirements: ["Daily participation", "100 consecutive days", "No missed days"],
    },
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-yellow-600"
      case "epic":
        return "from-purple-400 to-purple-600"
      case "rare":
        return "from-blue-400 to-blue-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-400/50"
      case "epic":
        return "border-purple-400/50"
      case "rare":
        return "border-blue-400/50"
      default:
        return "border-gray-400/50"
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "shadow-yellow-400/20"
      case "epic":
        return "shadow-purple-400/20"
      case "rare":
        return "shadow-blue-400/20"
      default:
        return "shadow-gray-400/20"
    }
  }

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesCategory = selectedCategory === "all" || achievement.category === selectedCategory
    const matchesRarity = selectedRarity === "all" || achievement.rarity === selectedRarity
    const matchesSearch =
      achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesRarity && matchesSearch
  })

  const earnedAchievements = filteredAchievements.filter((a) => a.earned)
  const lockedAchievements = filteredAchievements.filter((a) => !a.earned)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Achievements
          </h1>
          <p className="text-gray-400 mt-1">Track your learning milestones and unlock rewards</p>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {achievementStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-200">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} mx-auto mb-3 flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
                <GlassCard className="p-6 hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10 opacity-75 hover:opacity-100">
                  {/* Achievement Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
                        {achievement.icon}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 font-bold text-sm">LOCKED</div>
                      <div className="text-gray-600 text-xs">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <h3 className="text-gray-300 font-bold text-lg mb-2">{achievement.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{achievement.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-xs">Progress</span>
                      <span className="text-gray-400 text-xs">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
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
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-600 to-gray-700 text-white capitalize">
                      {achievement.rarity}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Star className="w-4 h-4" />
                      <span className="font-bold">{achievement.points}</span>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-gray-400 text-xs mb-2">Requirements:</p>
                      <ul className="space-y-1">
                        {achievement.requirements.map((req, idx) => (
                          <li key={idx} className="text-gray-500 text-xs flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-gray-500" />
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

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No achievements found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={() => {
              setSelectedCategory("all")
              setSelectedRarity("all")
              setSearchTerm("")
            }}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </button>
        </GlassCard>
      )}
    </div>
  )
}

export default AchievementPage
