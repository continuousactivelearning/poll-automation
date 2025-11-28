import { Request, Response } from 'express'
import { notificationService } from '../services/NotificationService'
import { NotificationType, NotificationPriority } from '../models/Notification'

// Extended Request interface for authenticated routes (matching your existing user type)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: "host" | "student"
    iat?: number
    exp?: number
  }
}

// Simple validation helpers (since express-validator might not be installed)
class ValidationHelper {
  static validateMongoId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id)
  }
  
  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  static validateNotificationType(type: string): boolean {
    return ['achievement', 'session', 'leaderboard', 'system', 'reminder', 'social'].includes(type)
  }
  
  static validatePriority(priority: string): boolean {
    return ['low', 'medium', 'high', 'critical'].includes(priority)
  }
  
  static validateSortOrder(order: string): order is 'asc' | 'desc' {
    return order === 'asc' || order === 'desc'
  }
}

// Response helper for consistent API responses
class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }
  
  static error(res: Response, message: string, statusCode = 400, errors?: any): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    })
  }
  
  static validationError(res: Response, errors: any): void {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    })
  }
}

export class NotificationController {
  
  /**
   * Get user notifications with filtering and pagination
   * GET /api/notifications
   */
  static getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      // Simple validation and parsing
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const sortBy = ['createdAt', 'readAt', 'priority', 'type'].includes(req.query.sortBy as string) 
        ? req.query.sortBy as string 
        : 'createdAt'
      const sortOrderStr = req.query.sortOrder as string
      const sortOrder = ValidationHelper.validateSortOrder(sortOrderStr) ? sortOrderStr : 'desc'
      
      // Parse query parameters with validation
      const filters = {
        types: Array.isArray(req.query.types) 
          ? (req.query.types as string[]).filter(t => ValidationHelper.validateNotificationType(t)) as NotificationType[]
          : undefined,
        statuses: Array.isArray(req.query.statuses) 
          ? req.query.statuses as string[]
          : undefined,
        priorities: Array.isArray(req.query.priorities)
          ? (req.query.priorities as string[]).filter(p => ValidationHelper.validatePriority(p)) as NotificationPriority[]
          : undefined,
        categories: Array.isArray(req.query.categories) 
          ? req.query.categories as string[]
          : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        hasActionUrl: req.query.hasActionUrl === 'true' ? true : req.query.hasActionUrl === 'false' ? false : undefined
      }
      
      const pagination = {
        page,
        limit,
        sortBy,
        sortOrder
      }
      
      // Get notifications
      const result = await notificationService.getUserNotifications(req.user.id, filters, pagination)
      
      ApiResponse.success(res, result, 'Notifications retrieved successfully')
      
    } catch (error) {
      console.error('Get notifications error:', error)
      ApiResponse.error(res, 'Failed to retrieve notifications', 500)
    }
  }
  
  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  static getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      const count = await notificationService.getNotificationStats(req.user.id)
      
      ApiResponse.success(res, { unreadCount: count }, 'Unread count retrieved successfully')
      
    } catch (error) {
      console.error('Get unread count error:', error)
      ApiResponse.error(res, 'Failed to get unread count', 500)
    }
  }
  
  /**
   * Mark single notification as read
   * POST /api/notifications/:id/read
   */
  static markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      if (!ValidationHelper.validateMongoId(req.params.id)) {
        ApiResponse.error(res, 'Invalid notification ID', 400)
        return
      }
      
      const success = await notificationService.markAsRead(req.user.id, req.params.id)
      
      if (success) {
        ApiResponse.success(res, { notificationId: req.params.id }, 'Notification marked as read')
      } else {
        ApiResponse.error(res, 'Notification not found or already read', 404)
      }
      
    } catch (error) {
      console.error('Mark as read error:', error)
      ApiResponse.error(res, 'Failed to mark notification as read', 500)
    }
  }
  
  /**
   * Mark multiple notifications as read (bulk operation)
   * POST /api/notifications/read-multiple
   */
  static markMultipleAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      const { notificationIds, markAll } = req.body
      
      // Validate input
      if (!markAll && (!Array.isArray(notificationIds) || notificationIds.length === 0)) {
        ApiResponse.error(res, 'Provide notificationIds array or set markAll to true', 400)
        return
      }
      
      // Validate MongoDB IDs if provided
      if (notificationIds && !notificationIds.every((id: string) => ValidationHelper.validateMongoId(id))) {
        ApiResponse.error(res, 'All notification IDs must be valid MongoDB IDs', 400)
        return
      }
      
      const modifiedCount = await notificationService.markMultipleAsRead(
        req.user.id,
        markAll ? undefined : notificationIds
      )
      
      ApiResponse.success(res, { 
        modifiedCount,
        message: `${modifiedCount} notification(s) marked as read`
      }, 'Notifications marked as read')
      
    } catch (error) {
      console.error('Mark multiple as read error:', error)
      ApiResponse.error(res, 'Failed to mark notifications as read', 500)
    }
  }
  
  /**
   * Delete (soft delete) notification
   * DELETE /api/notifications/:id
   */
  static deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      if (!ValidationHelper.validateMongoId(req.params.id)) {
        ApiResponse.error(res, 'Invalid notification ID', 400)
        return
      }
      
      const success = await notificationService.deleteNotification(req.user.id, req.params.id)
      
      if (success) {
        ApiResponse.success(res, { notificationId: req.params.id }, 'Notification deleted successfully')
      } else {
        ApiResponse.error(res, 'Notification not found', 404)
      }
      
    } catch (error) {
      console.error('Delete notification error:', error)
      ApiResponse.error(res, 'Failed to delete notification', 500)
    }
  }
  
  /**
   * Create manual notification (admin only)
   * POST /api/notifications/create
   */
  static createNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      // Admin check (adjust based on your role system)
      if (req.user.role !== 'host') { // Assuming hosts can create notifications
        ApiResponse.error(res, 'Host access required', 403)
        return
      }
      
      const {
        userId,
        type,
        title,
        message,
        priority = 'medium',
        category,
        metadata = {},
        expiresAt
      } = req.body
      
      // Validation
      if (!ValidationHelper.validateMongoId(userId)) {
        ApiResponse.error(res, 'Invalid user ID', 400)
        return
      }
      
      if (!ValidationHelper.validateNotificationType(type)) {
        ApiResponse.error(res, 'Invalid notification type', 400)
        return
      }
      
      if (!title || title.length > 100) {
        ApiResponse.error(res, 'Title must be 1-100 characters', 400)
        return
      }
      
      if (!message || message.length > 500) {
        ApiResponse.error(res, 'Message must be 1-500 characters', 400)
        return
      }
      
      if (priority && !ValidationHelper.validatePriority(priority)) {
        ApiResponse.error(res, 'Invalid priority', 400)
        return
      }
      
      const notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        sourceType: 'manual',
        priority,
        category,
        metadata,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      })
      
      ApiResponse.success(res, notification, 'Notification created successfully', 201)
      
    } catch (error) {
      console.error('Create notification error:', error)
      ApiResponse.error(res, 'Failed to create notification', 500)
    }
  }
  
  /**
   * Get notification statistics (admin only)
   * GET /api/notifications/admin/stats
   */
  static getAdminStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Authentication required', 401)
        return
      }
      
      if (req.user.role !== 'host') {
        ApiResponse.error(res, 'Host access required', 403)
        return
      }
      
      // TODO: Implement admin statistics
      const stats = {
        totalNotifications: 0,
        totalUsers: 0,
        notificationsByType: {},
        notificationsByPriority: {},
        engagementRate: 0
      }
      
      ApiResponse.success(res, stats, 'Admin statistics retrieved')
      
    } catch (error) {
      console.error('Get admin stats error:', error)
      ApiResponse.error(res, 'Failed to get admin statistics', 500)
    }
  }
  
  /**
   * Health check endpoint
   * GET /api/notifications/health
   */
  static healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Basic health checks
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      }
      
      ApiResponse.success(res, health, 'Notification service is healthy')
      
    } catch (error) {
      ApiResponse.error(res, 'Health check failed', 500)
    }
  }
}

// Rate limiting middleware (basic implementation)
export const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map()
  
  return (req: Request, res: Response, next: any) => {
    const clientId = req.ip || req.socket.remoteAddress
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!requests.has(clientId)) {
      requests.set(clientId, [])
    }
    
    const clientRequests = requests.get(clientId)
    
    // Remove old requests outside the window
    const validRequests = clientRequests.filter((timestamp: number) => timestamp > windowStart)
    
    if (validRequests.length >= maxRequests) {
      ApiResponse.error(res, 'Too many requests, please try again later', 429)
      return
    }
    
    validRequests.push(now)
    requests.set(clientId, validRequests)
    
    next()
  }
}