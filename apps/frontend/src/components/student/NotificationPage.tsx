"use client"

import type React from "react"
import { useState } from "react"
import { Bell, Check, X, Search, Trophy, Users, Settings, Clock, Star, Zap, Filter, AlertCircle } from "lucide-react"
import GlassCard from "../GlassCard"
import { useNotifications } from "../../contexts/NotificationContext"

const NotificationPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

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



  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter = filter === "all" || (filter === "unread" && !notif.isRead) || notif.type === filter

    const matchesSearch =
      searchTerm === "" ||
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })



  // Loading state
  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Bell className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
          </div>
          <p className="text-gray-400">Loading your latest updates...</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
          </div>
          <p className="text-red-400">{error}</p>
        </div>
        
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Notifications</h3>
          <p className="text-gray-400 mb-4">There was an error loading your notifications. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            Refresh Page
          </button>
        </GlassCard>
      </div>
    )
  }

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
                            <button 
                              onClick={() => {
                                // Handle different action types
                                if (notification.type === 'poll' && notification.metadata?.pollId) {
                                  window.location.href = `/student/join-session/${notification.metadata.pollId}`
                                } else if (notification.actionUrl) {
                                  window.location.href = notification.actionUrl
                                }
                              }}
                              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                            >
                              {notification.type === 'poll' ? 'Join Session' : 'Take Action'}
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