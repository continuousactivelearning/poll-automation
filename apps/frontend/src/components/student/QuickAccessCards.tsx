"use client"

import type React from "react"
import { Play, BarChart3, Trophy, Plus } from "lucide-react"
import GlassCard from "../GlassCard"

interface QuickAccessCardsProps {
  onSectionChange: (section: string) => void
}

const QuickAccessCards: React.FC<QuickAccessCardsProps> = ({ onSectionChange }) => {
  const quickActions = [
    {
      title: "Join Next Poll",
      description: "Participate in the latest poll and earn points",
      icon: Play,
      color: "from-primary-500 to-purple-600",
      action: () => onSectionChange("join-poll"),
    },
    {
      title: "View Latest Results",
      description: "Check out the results from recent polls",
      icon: BarChart3,
      color: "from-secondary-500 to-blue-600",
      action: () => onSectionChange("history"),
    },
    {
      title: "Check Your Rank",
      description: "See where you stand on the leaderboard",
      icon: Trophy,
      color: "from-accent-500 to-teal-600",
      action: () => onSectionChange("leaderboard"),
    },
    {
      title: "View Achievements",
      description: "Check your badges and accomplishments",
      icon: Plus,
      color: "from-orange-500 to-red-600",
      action: () => onSectionChange("achievements"),
    },
  ]

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={action.title}
            onClick={action.action}
            className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105"
          >
            <div
              className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}
            >
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-medium text-white mb-1">{action.title}</h4>
            <p className="text-sm text-gray-400">{action.description}</p>
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

export default QuickAccessCards
