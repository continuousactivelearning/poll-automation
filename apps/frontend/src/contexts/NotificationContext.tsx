// apps/frontend/src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react' // Added useMemo

interface Notification {
  id: string
  type: "achievement" | "poll" | "system" | "social" | "reminder" | "toast"
  title?: string
  message: string
  timestamp: Date
  isRead: boolean
  priority?: "low" | "medium" | "high"
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
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

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

  const updateUnreadCount = useCallback((change: number) => { // Memoize updateUnreadCount
    setUnreadCount(prev => Math.max(0, prev + change))
  }, []);

  const markAsRead = useCallback((id: string) => { // Memoize markAsRead
    setNotifications(prev => {
      const updated = prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
      const newUnreadCount = updated.filter(n => !n.isRead).length
      setUnreadCount(newUnreadCount)
      return updated
    })
  }, []);

  const markAllAsRead = useCallback(() => { // Memoize markAllAsRead
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, isRead: true }))
      setUnreadCount(0)
      return updated
    })
  }, []);

  const deleteNotification = useCallback((id: string) => { // Memoize deleteNotification
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id)
      const newUnreadCount = updated.filter(n => !n.isRead).length
      setUnreadCount(newUnreadCount)
      return updated
    })
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [
      ...prev,
      {
        id,
        message,
        type: 'toast',
        timestamp: new Date(),
        isRead: false,
        priority: type === 'error' ? 'high' : 'medium',
        title: type.charAt(0).toUpperCase() + type.slice(1),
      }
    ]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  }, []); // Dependencies for showNotification: none needed as it only uses setNotifications (which is stable)


  // NEW: Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    unreadCount,
    setUnreadCount, // setUnreadCount from useState is stable
    updateUnreadCount, // Memoized
    notifications,
    setNotifications, // setNotifications from useState is stable
    markAsRead, // Memoized
    markAllAsRead, // Memoized
    deleteNotification, // Memoized
    showNotification // Memoized
  }), [
    unreadCount,
    updateUnreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showNotification
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column-reverse',
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
                notif.type === 'toast' && notif.priority === 'high' ? '#f44336' :
                notif.type === 'toast' && notif.priority === 'medium' && notif.title === 'Success' ? '#4CAF50' :
                notif.type === 'toast' && notif.priority === 'medium' && notif.title === 'Info' ? '#2196F3' :
                '#333',
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
