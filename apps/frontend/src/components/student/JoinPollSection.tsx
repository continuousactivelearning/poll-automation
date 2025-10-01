//from: apps/frontend/src/components/student/JoinPollSection.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Search, Users, Clock, Play, Star } from "lucide-react"
import GlassCard from "../GlassCard"

const JoinPollSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")

  const availablePolls = [
    {
      id: 1,
      title: "Mathematics Quiz - Calculus",
      description: "Test your knowledge of derivatives and integrals",
      participants: 24,
      timeLeft: "15 min",
      difficulty: "Advanced",
      category: "Mathematics",
      isLive: true,
      points: 50,
    },
    {
      id: 2,
      title: "History Survey - World War II",
      description: "Multiple choice questions about WWII events",
      participants: 18,
      timeLeft: "32 min",
      difficulty: "Intermediate",
      category: "History",
      isLive: true,
      points: 35,
    },
    {
      id: 3,
      title: "Science Poll - Climate Change",
      description: "Opinion poll on environmental policies",
      participants: 42,
      timeLeft: "1 hour",
      difficulty: "Beginner",
      category: "Science",
      isLive: false,
      points: 25,
    },
  ]

  const filteredPolls = availablePolls.filter(
    (poll) =>
      poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poll.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "from-green-500 to-emerald-500"
      case "Intermediate":
        return "from-yellow-500 to-orange-500"
      case "Advanced":
        return "from-red-500 to-pink-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Join Poll</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-400 text-sm">{availablePolls.filter((p) => p.isLive).length} Live Polls</span>
        </div>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search polls by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
          />
        </div>
      </GlassCard>

      {/* Available Polls */}
      <div className="grid gap-4">
        {filteredPolls.map((poll) => (
          <GlassCard key={poll.id} className={`p-6 ${poll.isLive ? "ring-2 ring-green-500/30" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-white">{poll.title}</h3>
                  {poll.isLive && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300">{poll.description}</p>

                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{poll.participants} participants</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{poll.timeLeft} left</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{poll.points} points</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs font-medium">
                    {poll.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getDifficultyColor(poll.difficulty)}`}
                  >
                    {poll.difficulty}
                  </span>
                </div>
              </div>

              {/* Join Button */}
              <button
                className={`ml-6 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 ${
                  poll.isLive
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                    : "bg-gray-700 text-gray-300 cursor-not-allowed"
                }`}
                disabled={!poll.isLive}
              >
                <Play className="w-4 h-4" />
                <span>{poll.isLive ? "Join Now" : "Ended"}</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredPolls.length === 0 && (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No polls found</h3>
          <p className="text-gray-400">Try adjusting your search terms or check back later for new polls.</p>
        </GlassCard>
      )}
    </div>
  )
}

export default JoinPollSection
