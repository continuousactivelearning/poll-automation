// apps/frontend/src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Notification {
  id: string
  type: "achievement" | "poll" | "system" | "social" | "reminder" | "toast" // Added 'toast' type for general notifications
  title?: string // Made title optional for simple toast notifications
  message: string
  timestamp: Date
  isRead: boolean
  priority?: "low" | "medium" | "high" // Made priority optional
  actionUrl?: string
  metadata?: {
    pollId?: string
    achievementType?: string
    points?: number
  }
}

interface NotificationContextType {
  unreadCount: number
  setUnreadCount: (count: number) => void
  updateUnreadCount: (change: number) => void
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void; // This method is correctly defined here
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Mock notifications data (in a real app, this would come from an API)
const initialNotifications: Notification[] = [
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
    message: "Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST. Some features may be temporarily unavailable.",
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
]

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialNotifications.filter(n => !n.isRead).length)

  const updateUnreadCount = (change: number) => {
    setUnreadCount(prev => Math.max(0, prev + change))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
      const newUnreadCount = updated.filter(n => !n.isRead).length
      setUnreadCount(newUnreadCount)
      return updated
    })
  }

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, isRead: true }))
      setUnreadCount(0)
      return updated
    })
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id)
      const newUnreadCount = updated.filter(n => !n.isRead).length
      setUnreadCount(newUnreadCount)
      return updated
    })
  }

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9); // Generate a unique ID
    setNotifications(prev => [
      ...prev,
      {
        id,
        message,
        type: 'toast', // Use 'toast' type for these general messages
        timestamp: new Date(),
        isRead: false, // Toast notifications are typically not "read" in the same way
        priority: type === 'error' ? 'high' : 'medium', // Set priority based on type
        title: type.charAt(0).toUpperCase() + type.slice(1), // Title like "Success", "Error", "Info"
      }
    ]);

    // Auto-hide after a few seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000); // Notification disappears after 5 seconds
  }, []);


  return (
    <NotificationContext.Provider value={{ 
      unreadCount, 
      setUnreadCount, 
      updateUnreadCount,
      notifications,
      setNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      showNotification // Exporting the new method
    }}>
      {children}
      {/* Optional: Render a simple toast notification display here */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column-reverse', // To stack new toasts on top
        gap: '10px'
      }}>
        {notifications.filter(n => n.type === 'toast').map(notif => (
          <div
            key={notif.id}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              color: 'white',
              backgroundColor:
                notif.type === 'toast' && notif.priority === 'high' ? '#f44336' : // Error red
                notif.type === 'toast' && notif.priority === 'medium' && notif.title === 'Success' ? '#4CAF50' : // Success green
                notif.type === 'toast' && notif.priority === 'medium' && notif.title === 'Info' ? '#2196F3' : // Info blue
                '#333', // Default dark
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              minWidth: '250px',
              maxWidth: '350px',
              fontSize: '0.95em',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {notif.title && <span style={{ marginRight: '5px' }}>
              {notif.title === 'Success' && '✅'}
              {notif.title === 'Error' && '❌'}
              {notif.title === 'Info' && 'ℹ️'}
            </span>}
            {notif.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
