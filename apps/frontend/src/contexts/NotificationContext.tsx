import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { apiService } from '../utils/api'

interface Notification {
  id: string
  type: "achievement" | "poll" | "system" | "social" | "reminder"
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  priority: "low" | "medium" | "high"
  actionUrl?: string
  metadata?: {
    pollId?: string
    achievementType?: string
    points?: number
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refreshNotifications: () => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  // Comprehensive notification generation - shows ALL user updates/activities
  const generateLiveNotifications = useCallback(async (): Promise<Notification[]> => {
    try {
      console.log('🔄 Generating comprehensive notification history...')
      
      const allNotifications: Notification[] = []

      // Get user data
      const achievements = await apiService.getUserAchievements()
      const recentSessions = await apiService.getMyRecentSessions()
      const stats = achievements.data.stats

      // 1. ALL Achievement notifications - every earned achievement becomes a notification
      const earnedAchievements = achievements.data.achievements.filter((achievement: any) => 
        achievement.earned && achievement.earnedDate
      )
      
      console.log(`🏆 Processing ${earnedAchievements.length} earned achievements`)
      earnedAchievements.forEach((achievement: any) => {
        allNotifications.push({
          id: `achievement-${achievement.id}`, // Stable ID based on achievement ID
          type: "achievement",
          title: `🏆 Achievement Unlocked: ${achievement.name}`,
          message: `Congratulations! You've earned the "${achievement.name}" badge. ${achievement.description}`,
          timestamp: new Date(achievement.earnedDate),
          isRead: false, // Will be overridden by localStorage
          priority: achievement.rarity === "legendary" ? "high" : achievement.rarity === "epic" ? "medium" : "low",
          metadata: {
            achievementType: achievement.name,
            points: achievement.points
          }
        })
      })

      // 2. ALL Session/Poll notifications - every completed session becomes a notification
      console.log(`📊 Processing ${recentSessions.data.recent.length} session results`)
      recentSessions.data.recent.forEach((session: any) => {
        if (session.studentResult && session.sessionEndedAt) {
          const accuracy = Math.round(session.studentResult.accuracy || 0)
          const points = session.studentResult.totalPoints || 0
          const rank = session.studentResult.rank || 'N/A'
          
          allNotifications.push({
            id: `session-${session.sessionId}`, // Stable ID based on session ID
            type: "poll",
            title: accuracy >= 90 ? "🎯 Excellent Performance!" : 
                   accuracy >= 70 ? "👍 Good Performance" : "📊 Session Completed",
            message: `Session: "${session.sessionName}" | Score: ${accuracy}% | Points: ${points}`,
            timestamp: new Date(session.sessionEndedAt),
            isRead: false, // Will be overridden by localStorage
            priority: accuracy >= 90 ? "high" : accuracy >= 70 ? "medium" : "low",
            metadata: {
              pollId: session.sessionId,
              points: points
            }
          })
        }
      })

      // 3. Leaderboard rank notifications - show current rank status
      if (stats.rank && stats.rank <= 50) { // Show for top 50 users
        const rankMessage = stats.rank <= 3 ? "🥇 Top 3 Position!" : 
                           stats.rank <= 10 ? "🔥 Top 10 Achievement!" : 
                           "📈 Great Ranking!"
        
        allNotifications.push({
          id: "leaderboard-status", // Fixed ID
          type: "social",
          title: `🏆 ${rankMessage}`,
          message: `You're ranked #${stats.rank} on the leaderboard with ${stats.totalPoints} total points! Keep up the great work!`,
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isRead: false,
          priority: stats.rank <= 3 ? "high" : stats.rank <= 10 ? "medium" : "low"
        })
      }

      // 4. Progress notifications - show near-completion achievements
      const nearCompletionAchievements = achievements.data.achievements.filter(
        (achievement: any) => !achievement.earned && achievement.progress > 0 && achievement.progress >= achievement.maxProgress * 0.5
      )
      
      nearCompletionAchievements.slice(0, 3).forEach((achievement: any, index: number) => {
        const remaining = achievement.maxProgress - achievement.progress
        const progressPercent = Math.round((achievement.progress / achievement.maxProgress) * 100)
        
        allNotifications.push({
          id: `progress-${achievement.id}`, // Stable ID based on achievement ID
          type: "reminder",
          title: `🎯 Achievement Progress: ${progressPercent}%`,
          message: `You're ${remaining} steps away from unlocking "${achievement.name}"! Current progress: ${achievement.progress}/${achievement.maxProgress}`,
          timestamp: new Date(Date.now() - 1000 * 60 * (45 + index * 5)), // Spread timestamps
          isRead: false,
          priority: progressPercent >= 80 ? "medium" : "low"
        })
      })

      // 5. Weekly/Monthly summary notifications
      const totalSessions = stats.totalSessions || 0
      if (totalSessions >= 5) {
        const avgAccuracy = Math.round(stats.averageAccuracy || 0)
        
        allNotifications.push({
          id: "activity-summary", // Fixed ID
          type: "system",
          title: "📈 Your Activity Summary",
          message: `Total sessions: ${totalSessions} | Average accuracy: ${avgAccuracy}% | Current rank: #${stats.rank || 'Unranked'} | Keep participating to improve!`,
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isRead: false,
          priority: "low"
        })
      }

      // 6. Welcome notification for new users
      const hasActivity = earnedAchievements.length > 0 || totalSessions > 0
      if (!hasActivity) {
        allNotifications.push({
          id: "welcome-first-time", // Fixed ID
          type: "system",
          title: "👋 Welcome to PollAutomation!",
          message: "Start participating in polls to earn achievements, climb the leaderboard, and track your progress!",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          isRead: false,
          priority: "medium"
        })
      }

      // 7. Motivational notifications based on streaks/consistency
      if (totalSessions >= 10) {
        allNotifications.push({
          id: "streak-motivation", // Fixed ID
          type: "reminder",
          title: "🔥 Keep Your Momentum!",
          message: `You've completed ${totalSessions} sessions! Consistent participation helps you unlock more achievements and improve your ranking.`,
          timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
          isRead: false,
          priority: "low"
        })
      }

      // Sort by timestamp (newest first) to show latest activities first
      const sortedNotifications = allNotifications.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
      
      console.log(`📊 Generated ${sortedNotifications.length} total notifications (achievements: ${earnedAchievements.length}, sessions: ${recentSessions.data.recent.length})`)
      return sortedNotifications

    } catch (error) {
      console.error('❌ Error generating comprehensive notifications:', error)
      return [{
        id: "error-connection",
        type: "system",
        title: "⚠️ Connection Issue",
        message: "Unable to load your notification history. Please check your connection and refresh the page.",
        timestamp: new Date(),
        isRead: false,
        priority: "high"
      }]
    }
  }, [])  // Bulletproof localStorage status application - preserves read/deleted status forever
  const applyLocalStorageStatus = useCallback((notifications: Notification[]) => {
    try {
      // Get persistent status arrays from localStorage
      const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]')
      const deletedIds = JSON.parse(localStorage.getItem('deletedNotifications') || '[]')
      
      console.log('📚 Applying persistent status:', { 
        totalNotifications: notifications.length,
        readCount: readIds.length, 
        deletedCount: deletedIds.length,
        readIds: readIds.slice(0, 5), // Show first 5 for debugging
        deletedIds: deletedIds.slice(0, 5) // Show first 5 for debugging
      })
      
      // Filter out permanently deleted notifications
      const visibleNotifications = notifications.filter(notification => {
        const isDeleted = deletedIds.includes(notification.id)
        if (isDeleted) {
          console.log(`🗑️ Hiding permanently deleted notification: ${notification.id}`)
        }
        return !isDeleted
      })
      
      // Apply read status - once read, always read
      const notificationsWithStatus = visibleNotifications.map(notification => {
        const wasRead = readIds.includes(notification.id)
        return {
          ...notification,
          isRead: wasRead // If it was ever read, it stays read forever
        }
      })
      
      const finalUnreadCount = notificationsWithStatus.filter(n => !n.isRead).length
      console.log(`✅ Status applied: ${notificationsWithStatus.length} visible, ${finalUnreadCount} unread`)
      
      return notificationsWithStatus
      
    } catch (error) {
      console.error('❌ Error applying localStorage status:', error)
      // Fallback: return notifications as-is if localStorage fails
      return notifications
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Refreshing comprehensive notification history...')
      
      // Generate all possible notifications for this user
      const generatedNotifications = await generateLiveNotifications()
      
      // Apply persistent read/deleted status
      const finalNotifications = applyLocalStorageStatus(generatedNotifications)
      
      // Summary logging
      const unreadCount = finalNotifications.filter(n => !n.isRead).length
      console.log('📋 Final notification summary:', {
        total: finalNotifications.length,
        unread: unreadCount,
        read: finalNotifications.length - unreadCount,
        byType: {
          achievement: finalNotifications.filter(n => n.type === 'achievement').length,
          poll: finalNotifications.filter(n => n.type === 'poll').length,
          system: finalNotifications.filter(n => n.type === 'system').length,
          social: finalNotifications.filter(n => n.type === 'social').length,
          reminder: finalNotifications.filter(n => n.type === 'reminder').length
        }
      })
      
      setNotifications(finalNotifications)
    } catch (err) {
      setError('Failed to load notification history')
      console.error('❌ Comprehensive notification loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [generateLiveNotifications, applyLocalStorageStatus])



  const markAsRead = useCallback((id: string) => {
    console.log(`✅ Permanently marking notification as read: ${id}`)
    
    try {
      // Update state immediately for instant UI feedback
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      )
      
      // Persist to localStorage - once read, never becomes unread again
      const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]')
      if (!readIds.includes(id)) {
        const updatedReadIds = [...readIds, id]
        localStorage.setItem('readNotifications', JSON.stringify(updatedReadIds))
        console.log(`💾 PERMANENTLY saved read status for ${id}. Total read: ${updatedReadIds.length}`)
      } else {
        console.log(`ℹ️ Notification ${id} was already permanently marked as read`)
      }
      
    } catch (error) {
      console.error('❌ Error saving read status:', error)
      // Even if localStorage fails, the state is updated for this session
    }
  }, [])

  const markAllAsRead = useCallback(() => {
    console.log('✅ PERMANENTLY marking ALL notifications as read')
    
    try {
      // Get all current notification IDs
      const allCurrentIds = notifications.map(n => n.id)
      
      if (allCurrentIds.length === 0) {
        console.log('ℹ️ No notifications to mark as read')
        return
      }
      
      // Update state immediately - mark all as read
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      
      // Persist to localStorage - merge with existing read IDs
      const currentReadIds = JSON.parse(localStorage.getItem('readNotifications') || '[]')
      const allReadIds = [...new Set([...currentReadIds, ...allCurrentIds])] // Remove duplicates
      
      localStorage.setItem('readNotifications', JSON.stringify(allReadIds))
      console.log(`💾 PERMANENTLY marked ${allCurrentIds.length} notifications as read. Total read history: ${allReadIds.length}`)
      
    } catch (error) {
      console.error('❌ Error saving read-all status:', error)
      // Even if localStorage fails, the state is updated for this session
    }
  }, [notifications])

  const deleteNotification = useCallback((id: string) => {
    console.log(`🗑️ PERMANENTLY deleting notification: ${id}`)
    
    try {
      // Update state immediately - remove from UI
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      
      // Persist to localStorage - once deleted, never appears again
      const deletedIds = JSON.parse(localStorage.getItem('deletedNotifications') || '[]')
      if (!deletedIds.includes(id)) {
        const updatedDeletedIds = [...deletedIds, id]
        localStorage.setItem('deletedNotifications', JSON.stringify(updatedDeletedIds))
        console.log(`💾 PERMANENTLY deleted notification ${id}. Total deleted: ${updatedDeletedIds.length}`)
      } else {
        console.log(`ℹ️ Notification ${id} was already permanently deleted`)
      }
      
      // Also mark as read if it wasn't already (cleanup)
      const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]')
      if (!readIds.includes(id)) {
        const updatedReadIds = [...readIds, id]
        localStorage.setItem('readNotifications', JSON.stringify(updatedReadIds))
        console.log(`🧹 Also marked deleted notification as read for cleanup`)
      }
      
    } catch (error) {
      console.error('❌ Error saving deleted status:', error)
      // Even if localStorage fails, the state is updated for this session
    }
  }, [])

  // Load notifications on mount
  useEffect(() => {
    let mounted = true
    
    const loadInitialNotifications = async () => {
      if (!mounted) return
      
      // Check authentication
      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) {
        console.log('📝 No auth token, skipping notification loading')
        if (mounted) setLoading(false)
        return
      }
      
      console.log('🚀 Loading initial notifications...')
      await refreshNotifications()
    }

    loadInitialNotifications()

    return () => {
      mounted = false
    }
  }, [refreshNotifications])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}