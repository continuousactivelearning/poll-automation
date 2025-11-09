"use client"

import type React from "react"
import { useState } from "react"
import { Bell, Check, X, Search, Trophy, Users, Settings, Clock, Star, Zap, Filter } from "lucide-react"
import GlassCard from "../GlassCard"

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

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "achievement",
      title: "New Achievement Unlocked! 🏆",
      message: 'Congratulations! You\'ve earned the "Quiz Master" badge for answering 50 questions correctly.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: false,
      priority: "high",
      metadata: { achievementType: "Quiz Master", points: 100 },
    },
    {
      id: "2",
      type: "poll",
      title: "New Poll Available",
      message: 'Your instructor has created a new poll: "Understanding React Hooks". Join now to participate!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: false,
      priority: "medium",
      actionUrl: "/student/join-poll",
      metadata: { pollId: "poll-123" },
    },
    {
      id: "3",
      type: "social",
      title: "Leaderboard Update",
      message: "You've moved up to 3rd place on the class leaderboard! Keep up the great work!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      isRead: true,
      priority: "medium",
    },
    {
      id: "4",
      type: "system",
      title: "System Maintenance",
      message:
        "Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST. Some features may be temporarily unavailable.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      isRead: true,
      priority: "low",
    },
    {
      id: "5",
      type: "reminder",
      title: "Poll Reminder",
      message: 'Don\'t forget to complete the "JavaScript Fundamentals" poll. It closes in 2 hours!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
      isRead: false,
      priority: "high",
    },
    {
      id: "6",
      type: "achievement",
      title: "Streak Achievement! 🔥",
      message: "Amazing! You've maintained a 7-day participation streak. You're on fire!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      isRead: true,
      priority: "medium",
      metadata: { achievementType: "Streak Master", points: 75 },
    },
  ])

  const [filter, setFilter] = useState<"all" | "unread" | "achievement" | "poll" | "system" | "social" | "reminder">(
    "all",
  )
  const [searchTerm, setSearchTerm] = useState("")

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `w-5 h-5 ${priority === "high" ? "text-yellow-400" : priority === "medium" ? "text-blue-400" : "text-gray-400"}`

    switch (type) {
      case "achievement":
        return <Trophy className={iconClass} />
      case "poll":
        return <Users className={iconClass} />
      case "social":
        return <Star className={iconClass} />
      case "system":
        return <Settings className={iconClass} />
      case "reminder":
        return <Clock className={iconClass} />
      default:
        return <Bell className={iconClass} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
      case "poll":
        return "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20"
      case "social":
        return "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20"
      case "system":
        return "bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-gray-500/20"
      case "reminder":
        return "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20"
      default:
        return "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20"
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter = filter === "all" || (filter === "unread" && !notif.isRead) || notif.type === filter

    const matchesSearch =
      searchTerm === "" ||
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Bell className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
        </div>
        <p className="text-gray-400">Stay updated with your latest activities and achievements</p>
      </div>

      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search and Filters */}
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Search & Filter</h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {["all", "unread", "achievement", "poll"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    filter === filterType ? "bg-purple-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  {filterType === "unread" && unreadCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Quick Stats */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{notifications.length}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{unreadCount}</div>
              <div className="text-sm text-gray-400">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {notifications.filter((n) => n.type === "achievement").length}
              </div>
              <div className="text-sm text-gray-400">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {notifications.filter((n) => n.type === "poll").length}
              </div>
              <div className="text-sm text-gray-400">Polls</div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              Mark All as Read
            </button>
          )}
        </GlassCard>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">
            {filter === "all"
              ? "All Notifications"
              : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
          </h2>
          <span className="text-gray-400">({filteredNotifications.length})</span>
        </div>

        {filteredNotifications.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No notifications found</h3>
            <p className="text-gray-400">{searchTerm ? "Try adjusting your search terms" : "You're all caught up!"}</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <GlassCard
                key={notification.id}
                className={`p-4 transition-all duration-200 hover:bg-white/10 ${
                  !notification.isRead ? "border-l-4 border-purple-500" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${getTypeColor(notification.type)} border`}>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${!notification.isRead ? "text-white" : "text-gray-300"}`}>
                          {notification.title}
                        </h3>
                        <p className={`mt-1 text-sm ${!notification.isRead ? "text-gray-200" : "text-gray-400"}`}>
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {notification.metadata.points && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                <Zap className="w-3 h-3" />+{notification.metadata.points} points
                              </span>
                            )}
                            {notification.metadata.achievementType && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                <Trophy className="w-3 h-3" />
                                {notification.metadata.achievementType}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Button */}
                        {notification.actionUrl && (
                          <div className="mt-3">
                            <button className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                              Take Action
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions and Time */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</span>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationPage
