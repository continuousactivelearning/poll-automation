//from: apps/frontend/src/components/student/PollHistoryPage.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Trophy,
  Target,
  Flame,
  Star,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Brain,
  Calculator,
  Globe,
  Beaker,
  History,
  Code,
  Palette,
} from "lucide-react"
import GlassCard from "../GlassCard"

const PollHistoryPage = () => {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Sample poll history data
  const pollHistory = [
    {
      id: 1,
      title: "JavaScript Fundamentals Quiz",
      subject: "Programming",
      date: "2024-01-20",
      time: "14:30",
      duration: "12 min",
      status: "completed",
      score: 95,
      rank: 3,
      totalQuestions: 20,
      correctAnswers: 19,
      points: 285,
      participants: 45,
      difficulty: "Medium",
      icon: Code,
      color: "from-blue-500 to-purple-600",
    },
    {
      id: 2,
      title: "World History: Ancient Civilizations",
      subject: "History",
      date: "2024-01-19",
      time: "10:15",
      duration: "18 min",
      status: "completed",
      score: 87,
      rank: 7,
      totalQuestions: 15,
      correctAnswers: 13,
      points: 195,
      participants: 38,
      difficulty: "Hard",
      icon: Globe,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: 3,
      title: "Advanced Calculus Problems",
      subject: "Mathematics",
      date: "2024-01-18",
      time: "16:45",
      duration: "25 min",
      status: "completed",
      score: 92,
      rank: 5,
      totalQuestions: 12,
      correctAnswers: 11,
      points: 276,
      participants: 29,
      difficulty: "Hard",
      icon: Calculator,
      color: "from-green-500 to-teal-600",
    },
    {
      id: 4,
      title: "Chemistry: Organic Compounds",
      subject: "Science",
      date: "2024-01-17",
      time: "11:20",
      duration: "15 min",
      status: "completed",
      score: 78,
      rank: 12,
      totalQuestions: 18,
      correctAnswers: 14,
      points: 156,
      participants: 52,
      difficulty: "Medium",
      icon: Beaker,
      color: "from-pink-500 to-rose-600",
    },
    {
      id: 5,
      title: "Art History: Renaissance Period",
      subject: "Arts",
      date: "2024-01-16",
      time: "13:00",
      duration: "20 min",
      status: "missed",
      score: 0,
      rank: null,
      totalQuestions: 16,
      correctAnswers: 0,
      points: 0,
      participants: 41,
      difficulty: "Easy",
      icon: Palette,
      color: "from-gray-500 to-gray-600",
    },
    {
      id: 6,
      title: "Psychology: Cognitive Behavior",
      subject: "Psychology",
      date: "2024-01-15",
      time: "09:30",
      duration: "22 min",
      status: "completed",
      score: 89,
      rank: 6,
      totalQuestions: 14,
      correctAnswers: 12,
      points: 223,
      participants: 33,
      difficulty: "Medium",
      icon: Brain,
      color: "from-indigo-500 to-purple-600",
    },
  ]

  const subjects = ["all", "Programming", "History", "Mathematics", "Science", "Arts", "Psychology"]
  const filters = [
    { id: "all", label: "All Time" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "completed", label: "Completed" },
    { id: "missed", label: "Missed" },
  ]

  // Calculate statistics
  const completedPolls = pollHistory.filter((poll) => poll.status === "completed")
  const totalPolls = pollHistory.length
  const averageScore = completedPolls.reduce((sum, poll) => sum + poll.score, 0) / completedPolls.length || 0
  const totalPoints = completedPolls.reduce((sum, poll) => sum + poll.points, 0)
  const bestStreak = 12 // This would be calculated from actual data

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "missed":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "in-progress":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400"
    if (score >= 80) return "text-yellow-400"
    if (score >= 70) return "text-orange-400"
    return "text-red-400"
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const filteredPolls = pollHistory.filter((poll) => {
    const matchesFilter =
      selectedFilter === "all" ||
      poll.status === selectedFilter ||
      selectedFilter === "week" ||
      selectedFilter === "month"
    const matchesSubject = selectedSubject === "all" || poll.subject === selectedSubject
    const matchesSearch =
      poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poll.subject.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSubject && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-primary-400" />
            Poll History
          </h1>
          <p className="text-gray-400 mt-2">Track your learning journey and performance</p>
        </div>
      </motion.div>

      {/* Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <GlassCard className="p-4 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totalPolls}</div>
          <div className="text-sm text-gray-400">Total Polls</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{averageScore.toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Avg Score</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{bestStreak}</div>
          <div className="text-sm text-gray-400">Best Streak</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totalPoints.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Points</div>
        </GlassCard>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500/50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500/50 transition-all duration-200 pr-10"
              >
                {filters.map((filter) => (
                  <option key={filter.id} value={filter.id} className="bg-dark-800">
                    {filter.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500/50 transition-all duration-200 pr-10"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject} className="bg-dark-800">
                    {subject === "all" ? "All Subjects" : subject}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Poll History List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        {filteredPolls.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No polls found</h3>
            <p className="text-gray-400">Try adjusting your filters or search terms</p>
          </GlassCard>
        ) : (
          filteredPolls.map((poll, index) => {
            const IconComponent = poll.icon
            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <GlassCard className="p-6 hover:bg-white/10 transition-all duration-200 group cursor-pointer">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Poll Icon and Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${poll.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors duration-200">
                            {poll.title}
                          </h3>
                          {getStatusIcon(poll.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {poll.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {poll.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {poll.participants} participants
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
                      {/* Subject Badge */}
                      <div className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30">
                        {poll.subject}
                      </div>

                      {/* Difficulty Badge */}
                      <div className={`px-3 py-1 rounded-full text-sm border ${getDifficultyColor(poll.difficulty)}`}>
                        {poll.difficulty}
                      </div>

                      {/* Score */}
                      {poll.status === "completed" && (
                        <>
                          <div className="text-center">
                            <div className={`text-xl font-bold ${getScoreColor(poll.score)}`}>{poll.score}%</div>
                            <div className="text-xs text-gray-400">Score</div>
                          </div>

                          {/* Rank */}
                          <div className="text-center">
                            <div className="text-xl font-bold text-yellow-400">#{poll.rank}</div>
                            <div className="text-xs text-gray-400">Rank</div>
                          </div>

                          {/* Points */}
                          <div className="text-center">
                            <div className="text-xl font-bold text-purple-400">{poll.points}</div>
                            <div className="text-xs text-gray-400">Points</div>
                          </div>
                        </>
                      )}

                      {poll.status === "missed" && (
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-400">Missed</div>
                          <div className="text-xs text-gray-400">Status</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {poll.status === "completed" && (
                      <div className="w-full lg:w-32">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>
                            {poll.correctAnswers}/{poll.totalQuestions}
                          </span>
                          <span>{poll.score}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${poll.score >= 90 ? "from-green-400 to-green-600" : poll.score >= 80 ? "from-yellow-400 to-yellow-600" : poll.score >= 70 ? "from-orange-400 to-orange-600" : "from-red-400 to-red-600"}`}
                            style={{ width: `${poll.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{completedPolls.length}</div>
              <div className="text-sm text-gray-400">Completed Polls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{averageScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Average Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {(totalPoints / completedPolls.length || 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-400">Avg Points/Poll</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default PollHistoryPage
