//from: apps/frontend/src/components/student/PollHistoryPage.tsx
"use client"

import { useState, useEffect } from "react"
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
  Loader2,
  Award,
  Timer,
  HelpCircle,
} from "lucide-react"
import GlassCard from "../GlassCard"
import { apiService } from "../../utils/api"

const PollHistoryPage = () => {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [pollHistory, setPollHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch poll history from API
  const fetchPollHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      const response = await apiService.getStudentPollHistory()
      
      console.log('📊 Raw API response:', response.data)
      
      // Map the backend data to include proper icons and colors
      const historyWithUIData = response.data.data.map((session: any) => ({
        ...session,
        icon: getSubjectIcon(session.subject),
        color: getSubjectColor(session.subject),
      }))
      
      console.log('🎨 First session with UI data:', historyWithUIData[0])
      
      // Log streak calculation for debugging
      if (historyWithUIData.length > 0) {
        const allStreaks = historyWithUIData.map((session: any) => session.longestStreak || 0)
        const calculatedBestStreak = Math.max(...allStreaks)
        console.log('🔥 Streak calculation:', {
          allSessionStreaks: allStreaks,
          bestStreak: calculatedBestStreak
        })
      }
      
      setPollHistory(historyWithUIData)
    } catch (err: any) {
      console.error('Failed to fetch poll history:', err)
      setError('Failed to load poll history. Please try again.')
      setPollHistory([]) // Set empty array as fallback
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPollHistory()
    
    // Debug: Call the debug endpoint to see raw data
    const debugData = async () => {
      try {
        const debugResponse = await apiService.getDebugSessionData()
        console.log('🐛 Debug Session Data:', debugResponse.data)
      } catch (err) {
        console.log('🐛 Debug endpoint failed (may be no data):', err)
      }
    }
    debugData()
  }, [])

  // Helper functions for UI data
  const getSubjectIcon = (subject: string) => {
    switch (subject?.toLowerCase()) {
      case 'programming':
      case 'computer science':
      case 'cs': return Code
      case 'dsa':
      case 'data structures':
      case 'algorithms': return Code
      case 'mathematics':
      case 'math': return Calculator
      case 'science':
      case 'physics':
      case 'chemistry':
      case 'biology': return Beaker
      case 'history': return Globe
      case 'arts': return Palette
      case 'psychology':
      case 'psych': return Brain
      case 'ai':
      case 'artificial intelligence':
      case 'ml':
      case 'machine learning': return Brain
      case 'data science': return Brain
      default: return BookOpen
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject?.toLowerCase()) {
      case 'programming':
      case 'computer science':
      case 'cs': return "from-blue-500 to-purple-600"
      case 'dsa':
      case 'data structures':
      case 'algorithms': return "from-red-500 to-orange-600"
      case 'mathematics':
      case 'math': return "from-green-500 to-teal-600"
      case 'science':
      case 'physics':
      case 'chemistry':
      case 'biology': return "from-pink-500 to-rose-600"
      case 'history': return "from-amber-500 to-orange-600"
      case 'arts': return "from-indigo-500 to-purple-600"
      case 'psychology':
      case 'psych': return "from-indigo-500 to-purple-600"
      case 'ai':
      case 'artificial intelligence':
      case 'ml':
      case 'machine learning': return "from-purple-500 to-pink-600"
      case 'data science': return "from-cyan-500 to-blue-600"
      default: return "from-gray-500 to-gray-600"
    }
  }

  // Keep the dummy data structure for fallback (commented out for reference)
  /*const dummyPollHistory = [
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
  ]*/

  // Get unique session subjects from actual data for filtering
  const uniqueSubjects = ["all", ...Array.from(new Set(pollHistory.map(session => session.subject).filter(Boolean)))]
  
  const filters = [
    { id: "all", label: "All Time" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "completed", label: "Completed" },
    { id: "missed", label: "Missed" },
  ]

  // Calculate statistics - session-based now
  const completedSessions = pollHistory.filter((session) => session.status === "completed")
  const totalSessions = pollHistory.length
  const averageScore = completedSessions.reduce((sum, session) => sum + session.score, 0) / completedSessions.length || 0
  const totalPoints = completedSessions.reduce((sum, session) => sum + session.points, 0)
  // Calculate best streak from all sessions
  const bestStreak = completedSessions.reduce((max, session) => {
    const sessionLongestStreak = session.longestStreak || 0
    return Math.max(max, sessionLongestStreak)
  }, 0)

  // Additional insights calculations
  const totalQuestionsAnswered = completedSessions.reduce((sum, session) => sum + (session.totalQuestions || 0), 0)
  const totalCorrectAnswers = completedSessions.reduce((sum, session) => sum + (session.correctAnswers || 0), 0)
  const averageRank = completedSessions.filter(s => s.rank).reduce((sum, session) => sum + (session.rank || 0), 0) / completedSessions.filter(s => s.rank).length || 0
  const bestRank = completedSessions.filter(s => s.rank).reduce((best, session) => Math.min(best, session.rank || Infinity), Infinity) || 0
  const averageResponseTime = completedSessions.reduce((sum, session) => sum + (session.avgTimeTaken || 0), 0) / completedSessions.length || 0
  const mostRecentSession = completedSessions.length > 0 ? completedSessions[0] : null

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
      case "mcq":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "true/false":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "mixed":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const filteredSessions = pollHistory.filter((session) => {
    // Time-based filtering
    const sessionDate = new Date(session.date)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    const matchesTimeFilter = 
      selectedFilter === "all" || 
      selectedFilter === "completed" || 
      selectedFilter === "missed" ||
      (selectedFilter === "week" && sessionDate >= oneWeekAgo) ||
      (selectedFilter === "month" && sessionDate >= oneMonthAgo)
    
    // Status-based filtering
    const matchesStatusFilter = 
      selectedFilter === "all" ||
      selectedFilter === "week" ||
      selectedFilter === "month" ||
      session.status === selectedFilter
    
    const matchesSubject = selectedSubject === "all" || session.subject === selectedSubject
    
    // Enhanced search functionality
    const matchesSearch = searchTerm === "" || 
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTimeFilter && matchesStatusFilter && matchesSubject && matchesSearch
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Session History</h2>
          <p className="text-gray-400">Fetching your session participation data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load History</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

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
          <p className="text-gray-400 mt-2">Track your session participation and performance</p>
        </div>
        <div>
          <button
            onClick={() => fetchPollHistory(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>🔄</span>
            )}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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
          <div className="text-2xl font-bold text-white">{totalSessions}</div>
          <div className="text-sm text-gray-400">Sessions Attended</div>
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
                  placeholder="Search by session name, subject, or session code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500/50 transition-all duration-200 ${
                    searchTerm ? "border-primary-500/50 bg-primary-500/10" : "border-white/10"
                  }`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className={`appearance-none bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500/50 transition-all duration-200 pr-10 ${
                  selectedFilter !== "all" ? "border-primary-500/50 bg-primary-500/10" : "border-white/10"
                }`}
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
                className={`appearance-none bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500/50 transition-all duration-200 pr-10 ${
                  selectedSubject !== "all" ? "border-primary-500/50 bg-primary-500/10" : "border-white/10"
                }`}
              >
                {uniqueSubjects.map((subject: string) => (
                  <option key={subject} value={subject} className="bg-dark-800">
                    {subject === "all" ? "All Sessions" : subject}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Results Summary */}
      {pollHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center justify-between text-sm text-gray-400"
        >
          <span>
            Showing {filteredSessions.length} of {pollHistory.length} sessions
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          {(searchTerm || selectedFilter !== "all" || selectedSubject !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedFilter("all")
                setSelectedSubject("all")
              }}
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* Session History List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        {pollHistory.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Session History Yet</h3>
            <p className="text-gray-400 mb-4">You haven't participated in any sessions yet. Join a session to start building your history!</p>
          </GlassCard>
        ) : filteredSessions.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No sessions match your filters</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? `No sessions found for "${searchTerm}"` : "Try adjusting your filters to see more results"}
            </p>
            {(searchTerm || selectedFilter !== "all" || selectedSubject !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedFilter("all")
                  setSelectedSubject("all")
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </GlassCard>
        ) : (
          filteredSessions.map((session, index) => {
            const IconComponent = session.icon
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <GlassCard className="p-6 hover:bg-white/10 transition-all duration-200 group cursor-pointer">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Session Icon and Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${session.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors duration-200">
                            {session.title}
                          </h3>
                          {getStatusIcon(session.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.participants} participants
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
                      {/* Subject Badge */}
                      <div className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30">
                        {session.subject}
                      </div>

                      {/* Difficulty Badge */}
                      <div className={`px-3 py-1 rounded-full text-sm border ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </div>

                      {/* Score */}
                      {session.status === "completed" && (
                        <>
                          <div className="text-center">
                            <div className={`text-xl font-bold ${getScoreColor(session.score)}`}>{session.score}%</div>
                            <div className="text-xs text-gray-400">Score</div>
                          </div>

                          {/* Rank */}
                          <div className="text-center">
                            <div className="text-xl font-bold text-yellow-400">#{session.rank}</div>
                            <div className="text-xs text-gray-400">Rank</div>
                          </div>

                          {/* Points */}
                          <div className="text-center">
                            <div className="text-xl font-bold text-purple-400">{session.points}</div>
                            <div className="text-xs text-gray-400">Points</div>
                          </div>
                        </>
                      )}

                      {session.status === "missed" && (
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-400">Missed</div>
                          <div className="text-xs text-gray-400">Status</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {session.status === "completed" && (
                      <div className="w-full lg:w-32">
                        <div className="text-xs text-gray-400 mb-1 text-center">
                          <span>
                            {session.correctAnswers}/{session.totalQuestions}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${session.score >= 90 ? "from-green-400 to-green-600" : session.score >= 80 ? "from-yellow-400 to-yellow-600" : session.score >= 70 ? "from-orange-400 to-orange-600" : "from-red-400 to-red-600"}`}
                            style={{ width: `${session.score}%` }}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <HelpCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{totalQuestionsAnswered}</div>
              <div className="text-sm text-gray-400">Total Questions</div>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">
                {bestRank === Infinity ? 'N/A' : `#${bestRank}`}
              </div>
              <div className="text-sm text-gray-400">Best Rank</div>
            </div>
            <div className="text-center">
              <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-400">
                {averageRank === 0 ? 'N/A' : `#${averageRank.toFixed(1)}`}
              </div>
              <div className="text-sm text-gray-400">Avg Rank</div>
            </div>
            <div className="text-center">
              <Timer className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">
                {averageResponseTime.toFixed(1)}s
              </div>
              <div className="text-sm text-gray-400">Avg Response Time</div>
            </div>
          </div>
          
          {/* Additional insights row */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Performance</h4>
                {mostRecentSession ? (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{mostRecentSession.sessionName}</span>
                    <span className={`font-bold ${mostRecentSession.score >= 80 ? 'text-green-400' : mostRecentSession.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {mostRecentSession.score}%
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">No sessions completed yet</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Learning Progress</h4>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Overall Accuracy</span>
                  <span className={`font-bold ${(totalCorrectAnswers / totalQuestionsAnswered * 100) >= 80 ? 'text-green-400' : (totalCorrectAnswers / totalQuestionsAnswered * 100) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {totalQuestionsAnswered > 0 ? ((totalCorrectAnswers / totalQuestionsAnswered) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default PollHistoryPage