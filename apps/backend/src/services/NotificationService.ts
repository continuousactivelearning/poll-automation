import { Notification, INotification, NotificationType, NotificationPriority } from '../models/Notification'
import { Types } from 'mongoose'
import crypto from 'crypto'

// Service interfaces for type safety
interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  sourceType: string
  sourceId?: string
  metadata?: Record<string, any>
  priority?: NotificationPriority
  category?: string
  deliveryChannels?: string[]
  actionUrl?: string
  expiresAt?: Date
}

interface NotificationFilters {
  types?: NotificationType[]
  statuses?: string[]
  priorities?: NotificationPriority[]
  categories?: string[]
  startDate?: Date
  endDate?: Date
  hasActionUrl?: boolean
}

interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface NotificationResponse {
  notifications: INotification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats: {
    unreadCount: number
    totalCount: number
    byType: Record<string, number>
    byPriority: Record<string, number>
  }
}

// Enterprise-grade notification service
export class NotificationService {
  
  /**
   * Create a new notification with deduplication
   */
  async createNotification(data: CreateNotificationData): Promise<INotification> {
    try {
      // Generate source hash for deduplication
      let sourceHash: string | undefined
      if (data.sourceType && data.sourceId) {
        const sourceData = `${data.sourceType}:${data.sourceId}:${JSON.stringify(data.metadata || {})}`
        sourceHash = crypto.createHash('sha256').update(sourceData).digest('hex')
        
        // Check for existing notification with same source
        const existing = await Notification.findOne({
          userId: data.userId,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          status: { $ne: 'deleted' }
        })
        
        if (existing) {
          // Update existing notification instead of creating duplicate
          if (existing.sourceHash !== sourceHash) {
            existing.title = data.title
            existing.message = data.message
            existing.metadata = { ...existing.metadata, ...data.metadata }
            existing.priority = data.priority || existing.priority
            existing.sourceHash = sourceHash
            existing.updatedAt = new Date()
            
            return await existing.save()
          }
          
          // Return existing if no changes
          return existing
        }
      }
      
      // Create new notification
      const notification = new Notification({
        userId: new Types.ObjectId(data.userId),
        type: data.type,
        title: data.title,
        message: data.message,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        sourceHash,
        metadata: data.metadata || {},
        priority: data.priority || 'medium',
        category: data.category || this.getCategoryFromType(data.type),
        deliveryChannels: data.deliveryChannels || ['web'],
        isSystemGenerated: true,
        expiresAt: data.expiresAt
      })
      
      const saved = await notification.save()
      
      // Emit real-time event (we'll implement WebSocket later)
      this.emitNotificationEvent('created', saved)
      
      return saved
      
    } catch (error) {
      console.error('Error creating notification:', error)
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Get user notifications with advanced filtering and pagination
   */
  async getUserNotifications(
    userId: string, 
    filters: NotificationFilters = {}, 
    pagination: PaginationOptions = {}
  ): Promise<NotificationResponse> {
    try {
      // Build query
      const query: any = { 
        userId: new Types.ObjectId(userId),
        status: { $ne: 'deleted' }
      }
      
      // Add expiration check
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
      
      // Apply filters
      if (filters.types && filters.types.length > 0) {
        query.type = { $in: filters.types }
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        query.status = { $in: filters.statuses }
      }
      
      if (filters.priorities && filters.priorities.length > 0) {
        query.priority = { $in: filters.priorities }
      }
      
      if (filters.categories && filters.categories.length > 0) {
        query.category = { $in: filters.categories }
      }
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {}
        if (filters.startDate) query.createdAt.$gte = filters.startDate
        if (filters.endDate) query.createdAt.$lte = filters.endDate
      }
      
      if (filters.hasActionUrl !== undefined) {
        query['metadata.actionUrl'] = filters.hasActionUrl ? { $exists: true, $ne: null } : { $exists: false }
      }
      
      // Pagination setup
      const page = Math.max(1, pagination.page || 1)
      const limit = Math.min(100, Math.max(1, pagination.limit || 20)) // Max 100 per page
      const skip = (page - 1) * limit
      
      // Sorting
      const sortField = pagination.sortBy || 'createdAt'
      const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1
      const sort = { [sortField]: sortOrder }
      
      // Execute queries in parallel for performance
      const [notifications, total, unreadCount, stats] = await Promise.all([
        Notification.find(query)
          .sort(sort as any)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
          
        Notification.countDocuments(query),
        
        Notification.countDocuments({
          userId: new Types.ObjectId(userId),
          status: 'unread',
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }),
        
        this.getNotificationStats(userId)
      ])
      
      // Calculate pagination info
      const pages = Math.ceil(total / limit)
      
      return {
        notifications: notifications.map(n => n.toJSON()) as INotification[],
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        },
        stats: {
          unreadCount,
          totalCount: total,
          ...stats
        }
      }
      
    } catch (error) {
      console.error('Error getting notifications:', error)
      throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Mark single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const result = await Notification.updateOne(
        { 
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
          status: 'unread'
        },
        { 
          status: 'read',
          readAt: new Date()
        }
      )
      
      if (result.matchedCount > 0) {
        this.emitNotificationEvent('read', { userId, notificationId })
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Mark multiple notifications as read (bulk operation)
   */
  async markMultipleAsRead(userId: string, notificationIds?: string[]): Promise<number> {
    try {
      const query: any = {
        userId: new Types.ObjectId(userId),
        status: 'unread'
      }
      
      if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds.map(id => new Types.ObjectId(id)) }
      }
      
      const result = await Notification.updateMany(query, {
        status: 'read',
        readAt: new Date()
      })
      
      if (result.modifiedCount > 0) {
        this.emitNotificationEvent('bulk_read', { userId, count: result.modifiedCount })
      }
      
      return result.modifiedCount
      
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      throw new Error(`Failed to mark notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Soft delete notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      const result = await Notification.updateOne(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId)
        },
        {
          status: 'deleted',
          deletedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Delete after 7 days
        }
      )
      
      if (result.matchedCount > 0) {
        this.emitNotificationEvent('deleted', { userId, notificationId })
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw new Error(`Failed to delete notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Get notification statistics for analytics
   */
  async getNotificationStats(userId: string): Promise<{
    byType: Record<string, number>
    byPriority: Record<string, number>
  }> {
    try {
      const [typeStats, priorityStats] = await Promise.all([
        Notification.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              status: { $ne: 'deleted' },
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
              ]
            }
          },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        
        Notification.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              status: { $ne: 'deleted' },
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
              ]
            }
          },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ])
      ])
      
      const byType: Record<string, number> = {}
      const byPriority: Record<string, number> = {}
      
      typeStats.forEach(stat => {
        byType[stat._id] = stat.count
      })
      
      priorityStats.forEach(stat => {
        byPriority[stat._id] = stat.count
      })
      
      return { byType, byPriority }
      
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return { byType: {}, byPriority: {} }
    }
  }
  
  /**
   * Archive old notifications (cleanup utility)
   */
  async archiveOldNotifications(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
      
      const result = await Notification.updateMany(
        {
          createdAt: { $lt: cutoffDate },
          status: 'read',
          priority: { $ne: 'critical' }
        },
        {
          status: 'archived',
          archivedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expire in 30 days
        }
      )
      
      console.log(`Archived ${result.modifiedCount} old notifications`)
      return result.modifiedCount
      
    } catch (error) {
      console.error('Error archiving notifications:', error)
      throw new Error(`Failed to archive notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Helper methods
   */
  private getCategoryFromType(type: NotificationType): string {
    const categoryMap: Record<NotificationType, string> = {
      achievement: 'progress',
      session: 'activity',
      leaderboard: 'social', 
      system: 'system',
      reminder: 'engagement',
      social: 'social'
    }
    
    return categoryMap[type] || 'general'
  }
  
  private emitNotificationEvent(event: string, data: any): void {
    // TODO: Implement WebSocket real-time events
    console.log(`📡 Notification event: ${event}`, data)
  }
  
  /**
   * Specialized notification creators for different event types
   */
  
  async createAchievementNotification(userId: string, achievement: any): Promise<INotification> {
    const priority = achievement.rarity === 'legendary' ? 'high' : 
                    achievement.rarity === 'epic' ? 'medium' : 'low'
    
    return this.createNotification({
      userId,
      type: 'achievement',
      title: `🏆 Achievement Unlocked: ${achievement.name}`,
      message: `Congratulations! You've earned the "${achievement.name}" badge. ${achievement.description}`,
      sourceType: 'achievement',
      sourceId: achievement._id.toString(),
      metadata: {
        achievementId: achievement._id,
        achievementName: achievement.name,
        rarity: achievement.rarity,
        points: achievement.points,
        iconUrl: achievement.iconUrl,
        actionUrl: `/achievements/${achievement._id}`
      },
      priority,
      category: 'progress'
    })
  }
  
  async createSessionNotification(userId: string, sessionResult: any): Promise<INotification> {
    const accuracy = Math.round(sessionResult.accuracy || 0)
    const points = sessionResult.totalPoints || 0
    const rank = sessionResult.rank || 'N/A'
    
    const priority = accuracy >= 90 ? 'high' : accuracy >= 70 ? 'medium' : 'low'
    
    const title = accuracy >= 90 ? '🎯 Excellent Performance!' : 
                  accuracy >= 70 ? '👍 Good Performance' : 
                  '📊 Session Completed'
    
    return this.createNotification({
      userId,
      type: 'session',
      title,
      message: `Session: "${sessionResult.sessionName}" | Score: ${accuracy}% | Points: ${points} | Rank: #${rank}`,
      sourceType: 'session',
      sourceId: sessionResult.sessionId,
      metadata: {
        sessionId: sessionResult.sessionId,
        sessionName: sessionResult.sessionName,
        accuracy,
        points,
        rank,
        actionUrl: `/sessions/${sessionResult.sessionId}/results`
      },
      priority,
      category: 'activity'
    })
  }
  
  async createRankChangeNotification(userId: string, oldRank: number, newRank: number, totalPoints: number): Promise<INotification> {
    const improved = newRank < oldRank
    const priority = newRank <= 3 ? 'high' : newRank <= 10 ? 'medium' : 'low'
    
    const title = improved ? '📈 Rank Improved!' : '🏆 Leaderboard Update'
    const message = improved 
      ? `Great job! You've moved up from #${oldRank} to #${newRank} on the leaderboard!`
      : `You're ranked #${newRank} on the leaderboard with ${totalPoints} points!`
    
    return this.createNotification({
      userId,
      type: 'leaderboard',
      title,
      message,
      sourceType: 'rank_change',
      sourceId: `rank_${newRank}`,
      metadata: {
        oldRank,
        newRank,
        totalPoints,
        improved,
        actionUrl: '/leaderboard'
      },
      priority,
      category: 'social'
    })
  }
}

// Singleton instance
export const notificationService = new NotificationService()