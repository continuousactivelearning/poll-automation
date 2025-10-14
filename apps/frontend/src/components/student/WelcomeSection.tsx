// apps/frontend/src/components/student/WelcomeSection.tsx

"use client"

import type React from "react"
import { Trophy, Target, Award, Users } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import GlassCard from "../GlassCard"

const WelcomeSection: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  const stats = [
    {
      label: "Polls Participated",
      value: "12",
      icon: Target,
      color: "from-primary-500 to-purple-600",
      change: "+3 this week",
    },
    {
      label: "Current Rank",
      value: "#7",
      icon: Trophy,
      color: "from-secondary-500 to-blue-600",
      change: "↑2 positions",
    },
    {
      label: "Achievements",
      value: "8",
      icon: Award,
      color: "from-accent-500 to-teal-600",
      change: "2 new badges",
    },
    {
      label: "Available Polls",
      value: "3",
      icon: Users,
      color: "from-orange-500 to-red-600",
      change: "Join now!",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.email || "Student"}! 🎉</h1>
        <p className="text-gray-400 text-lg">Ready to participate in today's polls and climb the leaderboard?</p>
      </div>
      {children && <div>{children}</div>}
      {/* Today's Highlights */}
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Today's Highlights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-green-400">{stat.change}</div>
                  </div>
                </div>
                <h3 className="text-gray-300 font-medium">{stat.label}</h3>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}

export default WelcomeSection
