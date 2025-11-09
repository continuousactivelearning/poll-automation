// apps/frontend/src/components/student/WelcomeSection.tsx

"use client"

import type React from "react"
import { Trophy, Target, Award, Users } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import GlassCard from "../GlassCard"
import { useEffect, useState } from "react"
import { apiService } from "../../utils/api"

const WelcomeSection: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, activeRoom } = useAuth()
  const [pollsParticipated, setPollsParticipated] = useState<number | null>(null)
  const [currentRank, setCurrentRank] = useState<number | null>(null)
  const [accuracyRate, setAccuracyRate] = useState<number | null>(null)
  const [availablePolls, setAvailablePolls] = useState<number | null>(null)
  const [totalSessionsJoined, setTotalSessionsJoined] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchUserStats = async () => {
      try {
        // Leaderboard returns aggregated per-user stats sorted by points
        const res = await apiService.getLeaderboard()
        const leaderboard: any[] = res.data || []

        if (!user) return

        // Debug: log a small sample of leaderboard and user info
        console.debug('WelcomeSection: fetched leaderboard count=', leaderboard.length, 'user=', user)

        // Normalize user identification candidates
        const userCandidates = [user.id, (user as any)._id, user.email, user.fullName].filter(Boolean).map(String)

        // Find current user in leaderboard by comparing normalized ids/emails/names
        const me = leaderboard.find((p) => {
          const pId = String(p.userId || p._id || p.id || '')
          const pEmail = p.email || p.userEmail || ''
          const pName = p.name || ''
          return userCandidates.includes(pId) || (pEmail && user.email && String(pEmail) === String(user.email)) || (pName && user.fullName && String(pName) === String(user.fullName))
        })

        console.debug('WelcomeSection: found leaderboard entry for user?', !!me, 'me=', me)

        if (mounted && me) {
          setPollsParticipated(me.pollsAttempted || 0)
          // rank: find index by normalized id
          const rankIndex = leaderboard.findIndex((p) => String(p.userId || p._id || p.id || '') === String(me.userId || me._id || me.id || ''))
          const rank = rankIndex >= 0 ? rankIndex + 1 : null
          setCurrentRank(rank)
          setAccuracyRate(Math.round((me.accuracy || 0) * 10) / 10)
        } else {
          // Set explicit zeros so frontend shows 0 instead of dash where appropriate
          if (mounted) {
            setPollsParticipated(0)
            setCurrentRank(null)
            setAccuracyRate(0)
          }
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard for welcome section', err)
      }
    }

    const fetchAvailablePolls = async () => {
      try {
        // Determine sessionId from activeRoom (supports _id or id)
        let sessionId: string | undefined = undefined
        if (activeRoom) {
          sessionId = (activeRoom as any)._id || (activeRoom as any).id || (activeRoom as any).sessionId
        }

        // If no activeRoom in context (student view), try reading the stored room from localStorage as a fallback
        if (!sessionId) {
          try {
            const stored = localStorage.getItem('pollgen_active_room')
            if (stored) {
              const parsed = JSON.parse(stored)
              console.debug('WelcomeSection: found stored active room in localStorage', parsed)
              sessionId = parsed?._id || parsed?.id || parsed?.sessionId
            }
          } catch (e) {
            console.debug('WelcomeSection: failed to parse stored active room', e)
          }
        }

        // If still no sessionId, try fetching current room from backend (may be host-only)
        if (!sessionId) {
          try {
            const roomResp = await apiService.getActiveRoom()
            const roomData = roomResp.data
            console.debug('WelcomeSection: fetched active room from API', roomData)
            sessionId = roomData?._id || roomData?.id
          } catch (e) {
            console.debug('WelcomeSection: no active room from API for student', e)
          }
        }

        if (sessionId) {
          const pollsRes = await apiService.getHostPolls(sessionId)
          // Accept responses that are arrays or objects with a 'polls' property
          let polls: any[] = []
          if (Array.isArray(pollsRes.data)) polls = pollsRes.data
          else if (Array.isArray(pollsRes.data?.polls)) polls = pollsRes.data.polls
          else if (Array.isArray(pollsRes.data?.data)) polls = pollsRes.data.data
          console.debug('WelcomeSection: polls for session', sessionId, 'raw=', pollsRes.data, 'count=', polls.length)
          if (mounted) setAvailablePolls(polls.length)
          return
        }

        // No active session found anywhere
        console.debug('WelcomeSection: no active session found, setting available polls to 0')
        if (mounted) setAvailablePolls(0)
      } catch (err) {
        console.error('Failed to fetch available polls', err)
        if (mounted) setAvailablePolls(0)
      }
    }

    const fetchSessionsJoined = async () => {
      try {
        if (!user) return;
        // Call server endpoint that returns the count of sessions joined by this student
        const res = await apiService.getMyJoinedSessionsCount();
        const count = res.data?.count ?? 0;
        if (mounted) setTotalSessionsJoined(count);
      } catch (err) {
        console.error('Failed to fetch joined sessions count', err);
        if (mounted) setTotalSessionsJoined(0);
      }
    }

  fetchUserStats()
  fetchAvailablePolls()
  fetchSessionsJoined()

    return () => { mounted = false }
  }, [user, activeRoom])

  const stats = [
    {
      label: "Joined Sessions",
      value: totalSessionsJoined !== null ? String(totalSessionsJoined) : "—",
      icon: Users,
      color: "from-emerald-500 to-green-600",
      change: "",
    },
    {
      label: "Polls Participated",
      value: pollsParticipated !== null ? String(pollsParticipated) : "—",
      icon: Target,
      color: "from-primary-500 to-purple-600",
      change: "",
    },
    {
      label: "Current Rank",
      value: currentRank !== null ? `#${currentRank}` : "—",
      icon: Trophy,
      color: "from-secondary-500 to-blue-600",
      change: "",
    },
    {
      label: "Accuracy Rate",
      value: accuracyRate !== null ? `${accuracyRate}%` : "—",
      icon: Award,
      color: "from-accent-500 to-teal-600",
      change: "",
    },
    {
      label: "Available Polls",
      value: availablePolls !== null ? String(availablePolls) : "—",
      icon: Users,
      color: "from-orange-500 to-red-600",
      change: "",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.fullName || user?.email || "Student"}! 🎉</h1>
        <p className="text-gray-400 text-lg">Ready to participate in today's polls and climb the leaderboard?</p>
      </div>
      {children && <div>{children}</div>}
      {/* Today's Highlights */}
      <GlassCard className="p-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat) => {
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