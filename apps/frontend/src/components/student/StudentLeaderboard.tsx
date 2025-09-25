"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Medal, TrendingUp, TrendingDown, Crown, Zap, Target, Clock, Users, Star } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import GlassCard from "../GlassCard"

interface LeaderboardEntry {
  id: number
  name: string
  points: number
  rank: number
  change: string
  avatar: string
  streak: number
  accuracy: number
  totalPolls: number
  avgResponseTime: number
  badges: string[]
  isCurrentUser?: boolean
  level: number
  xp: number
  nextLevelXp: number
}

const StudentLeaderboard: React.FC = () => {
  const { user } = useAuth()
  const [timeFilter, setTimeFilter] = useState("week")
  const [sortBy, setSortBy] = useState("points")
  const [showStats, setShowStats] = useState(false)
  const [animateRanks, setAnimateRanks] = useState(false)

  const leaderboardData: LeaderboardEntry[] = [
    {
      id: 1,
      name: "Alex Johnson",
      points: 2450,
      rank: 1,
      change: "+2",
      avatar: "👨‍🎓",
      streak: 12,
      accuracy: 94,
      totalPolls: 28,
      avgResponseTime: 3.2,
      badges: ["🏆", "🔥", "⚡"],
      level: 15,
      xp: 2450,
      nextLevelXp: 2500,
    },
    {
      id: 2,
      name: "Sarah Chen",
      points: 2380,
      rank: 2,
      change: "0",
      avatar: "👩‍🎓",
      streak: 8,
      accuracy: 91,
      totalPolls: 25,
      avgResponseTime: 4.1,
      badges: ["🥈", "🎯", "📚"],
      level: 14,
      xp: 2380,
      nextLevelXp: 2400,
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      points: 2290,
      rank: 3,
      change: "-1",
      avatar: "👨‍💻",
      streak: 15,
      accuracy: 89,
      totalPolls: 32,
      avgResponseTime: 2.8,
      badges: ["🥉", "⚡", "🔥"],
      level: 13,
      xp: 2290,
      nextLevelXp: 2350,
    },
    {
      id: 4,
      name: "Emma Wilson",
      points: 2180,
      rank: 4,
      change: "+3",
      avatar: "👩‍🔬",
      streak: 6,
      accuracy: 96,
      totalPolls: 22,
      avgResponseTime: 3.5,
      badges: ["🎯", "🌟", "📊"],
      level: 12,
      xp: 2180,
      nextLevelXp: 2250,
    },
    {
      id: 5,
      name: "David Kim",
      points: 2120,
      rank: 5,
      change: "-2",
      avatar: "👨‍🏫",
      streak: 9,
      accuracy: 87,
      totalPolls: 30,
      avgResponseTime: 4.2,
      badges: ["📚", "🎓", "💡"],
      level: 12,
      xp: 2120,
      nextLevelXp: 2250,
    },
    {
      id: 6,
      name: "Lisa Thompson",
      points: 2050,
      rank: 6,
      change: "+1",
      avatar: "👩‍💼",
      streak: 4,
      accuracy: 92,
      totalPolls: 18,
      avgResponseTime: 3.8,
      badges: ["💼", "📈", "🎯"],
      level: 11,
      xp: 2050,
      nextLevelXp: 2100,
    },
    {
      id: 7,
      name: user?.name || "You",
      points: 1980,
      rank: 7,
      change: "+2",
      avatar: "🎯",
      streak: 7,
      accuracy: 88,
      totalPolls: 24,
      avgResponseTime: 3.9,
      badges: ["🎯", "🔥", "📊"],
      isCurrentUser: true,
      level: 11,
      xp: 1980,
      nextLevelXp: 2100,
    },
    {
      id: 8,
      name: "James Brown",
      points: 1920,
      rank: 8,
      change: "-1",
      avatar: "👨‍🎨",
      streak: 3,
      accuracy: 85,
      totalPolls: 26,
      avgResponseTime: 4.5,
      badges: ["🎨", "💡", "📚"],
      level: 10,
      xp: 1920,
      nextLevelXp: 2000,
    },
  ]

  useEffect(() => {
    setAnimateRanks(true)
    const timer = setTimeout(() => setAnimateRanks(false), 1000)
    return () => clearTimeout(timer)
  }, [timeFilter])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-400" />
      case 2:
        return <Trophy className="w-7 h-7 text-gray-300" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="font-bold text-white">#{rank}</span>
          </div>
        )
    }
  }

  const getChangeColor = (change: string) => {
    if (change.startsWith("+")) return "text-green-400"
    if (change.startsWith("-")) return "text-red-400"
    return "text-gray-400"
  }

  const getChangeIcon = (change: string) => {
    if (change.startsWith("+")) return <TrendingUp className="w-4 h-4" />
    if (change.startsWith("-")) return <TrendingDown className="w-4 h-4" />
    return <div className="w-4 h-4" />
  }

  const getRankBackground = (rank: number, isCurrentUser?: boolean) => {
    if (isCurrentUser) return "bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-2 border-primary-500/30"
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
    if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border border-gray-400/30"
    if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border border-amber-600/30"
    return "bg-white/5 hover:bg-white/10 border border-white/10"
  }

  const currentUser = leaderboardData.find((user) => user.isCurrentUser)

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-400">Compete with fellow students and climb the ranks!</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Time Filter */}
          <div className="flex bg-white/5 rounded-xl p-1">
            {["week", "month", "all"].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeFilter === filter ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Your Rank Spotlight */}
      {currentUser && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="text-5xl">{currentUser.avatar}</div>
                  <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    #{currentUser.rank}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Your Current Rank</h3>
                  <p className="text-gray-400">
                    Level {currentUser.level} • {currentUser.streak} day streak 🔥
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {currentUser.badges.map((badge, index) => (
                      <span key={index} className="text-lg">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
                  <span className="text-3xl font-bold text-white">{currentUser.points.toLocaleString()}</span>
                  <span className="text-sm text-gray-400">pts</span>
                </div>
                <div
                  className={`flex items-center justify-center md:justify-end space-x-1 ${getChangeColor(currentUser.change)}`}
                >
                  {getChangeIcon(currentUser.change)}
                  <span className="font-medium">{currentUser.change}</span>
                </div>

                {/* XP Progress Bar */}
                <div className="mt-3 w-32">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>XP</span>
                    <span>
                      {currentUser.xp}/{currentUser.nextLevelXp}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(currentUser.xp / currentUser.nextLevelXp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Top 3 Podium */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
          Top Performers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {leaderboardData.slice(0, 3).map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-xl text-center ${getRankBackground(student.rank)} ${
                index === 0 ? "md:order-2 transform md:scale-105" : index === 1 ? "md:order-1" : "md:order-3"
              }`}
            >
              {/* Crown for #1 */}
              {student.rank === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Crown className="w-8 h-8 text-yellow-400" />
                </div>
              )}

              <div className="text-4xl mb-3">{student.avatar}</div>
              <h3 className="font-bold text-white text-lg mb-1">{student.name}</h3>
              <p className="text-2xl font-bold text-white mb-2">{student.points.toLocaleString()}</p>
              <div className="flex justify-center space-x-1 mb-3">
                {student.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-sm">
                    {badge}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-400">
                {student.accuracy}% accuracy • {student.streak} streak
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Full Leaderboard */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Full Rankings</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{leaderboardData.length} participants</span>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {leaderboardData.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${getRankBackground(student.rank, student.isCurrentUser)} hover:scale-[1.02]`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank with Animation */}
                  <motion.div
                    className="w-12 flex justify-center"
                    animate={animateRanks ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {getRankIcon(student.rank)}
                  </motion.div>

                  {/* Avatar & Info */}
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="text-3xl">{student.avatar}</div>
                      <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        {student.level}
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold ${student.isCurrentUser ? "text-primary-300" : "text-white"}`}>
                        {student.name}
                        {student.isCurrentUser && " (You)"}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          {student.streak} streak
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {student.accuracy}%
                        </span>
                        {showStats && (
                          <>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {student.avgResponseTime}s
                            </span>
                            <span>{student.totalPolls} polls</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points & Change */}
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-white text-lg">{student.points.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                  <div className={`text-sm flex items-center justify-end space-x-1 ${getChangeColor(student.change)}`}>
                    {getChangeIcon(student.change)}
                    <span className="font-medium">{student.change}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex justify-end space-x-1 mt-1">
                    {student.badges.slice(0, 3).map((badge, badgeIndex) => (
                      <span key={badgeIndex} className="text-sm">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Achievement Showcase */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Star className="w-6 h-6 mr-2 text-yellow-400" />
          Recent Achievements
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: "🏆", name: "Top 10", desc: "Reached top 10 ranking", rarity: "Epic" },
            { emoji: "🔥", name: "Hot Streak", desc: "7 days in a row", rarity: "Rare" },
            { emoji: "🎯", name: "Accuracy Master", desc: "95% correct answers", rarity: "Legendary" },
            { emoji: "⚡", name: "Speed Demon", desc: "Fastest response time", rarity: "Epic" },
          ].map((badge, index) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 hover:bg-white/10 p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{badge.emoji}</div>
              <p className="text-sm font-medium text-white mb-1">{badge.name}</p>
              <p className="text-xs text-gray-400 mb-2">{badge.desc}</p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  badge.rarity === "Legendary"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : badge.rarity === "Epic"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {badge.rarity}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

export default StudentLeaderboard
