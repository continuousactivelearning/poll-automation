import mongoose, { Schema, Document, ObjectId } from 'mongoose'

// Notification Types for type safety
export type NotificationType = 'achievement' | 'session' | 'leaderboard' | 'system' | 'reminder' | 'social'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotificationStatus = 'unread' | 'read' | 'deleted' | 'archived'

// Interface for TypeScript
export interface INotification extends Document {
  _id: ObjectId
  userId: ObjectId
  
  // Content
  type: NotificationType
  title: string
  message: string
  
  // Source tracking for deduplication and updates
  sourceType: string // 'achievement', 'session', 'rank_change', 'manual'
  sourceId?: string // Achievement ID, Session ID, etc.
  sourceHash?: string // Hash of source data to detect changes
  
  // Rich metadata for dynamic content
  metadata: {
    achievementId?: string
    sessionId?: string
    points?: number
    rank?: number
    accuracy?: number
    previousRank?: number
    iconUrl?: string
    actionUrl?: string
    [key: string]: any
  }
  
  // User interaction tracking
  status: NotificationStatus
  readAt?: Date
  deletedAt?: Date
  archivedAt?: Date
  
  // System fields
  priority: NotificationPriority
  category: string // 'progress', 'achievement', 'social', 'system'
  
  // Delivery tracking
  deliveryChannels: string[] // ['web', 'push', 'email']
  deliveredAt?: Date
  clickedAt?: Date
  
  // Lifecycle management
  expiresAt?: Date | null
  isSystemGenerated: boolean
  batchId?: string // For bulk operations
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Mongoose Schema with production optimizations
const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Content fields
  type: {
    type: String,
    enum: ['achievement', 'session', 'leaderboard', 'system', 'reminder', 'social'],
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true
  },
  
  // Source tracking for smart updates
  sourceType: {
    type: String,
    required: true,
    index: true
  },
  
  sourceId: {
    type: String,
    index: true,
    sparse: true
  },
  
  sourceHash: {
    type: String,
    index: true,
    sparse: true
  },
  
  // Rich metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // User interaction
  status: {
    type: String,
    enum: ['unread', 'read', 'deleted', 'archived'],
    default: 'unread',
    index: true
  },
  
  readAt: {
    type: Date,
    default: null,
    index: true
  },
  
  deletedAt: {
    type: Date,
    default: null,
    index: true
  },
  
  archivedAt: {
    type: Date,
    default: null
  },
  
  // System fields
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  category: {
    type: String,
    required: true,
    index: true
  },
  
  // Delivery tracking
  deliveryChannels: [{
    type: String,
    enum: ['web', 'push', 'email', 'sms']
  }],
  
  deliveredAt: Date,
  clickedAt: Date,
  
  // Lifecycle
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  
  isSystemGenerated: {
    type: Boolean,
    default: true
  },
  
  batchId: {
    type: String,
    index: true,
    sparse: true
  }
  
}, {
  timestamps: true,
  
  // Optimize for queries
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id
      delete (ret as any)._id
      delete (ret as any).__v
      return ret
    }
  }
})

// Compound indexes for performance (most important first)
NotificationSchema.index({ userId: 1, createdAt: -1 }) // User notifications by date (main query)
NotificationSchema.index({ userId: 1, status: 1 }) // Unread/read notifications
NotificationSchema.index({ userId: 1, type: 1, status: 1 }) // Filtered notifications
NotificationSchema.index({ userId: 1, priority: 1, status: 1 }) // High priority notifications
NotificationSchema.index({ sourceType: 1, sourceId: 1, userId: 1 }, { unique: true, sparse: true }) // Prevent duplicates
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index
NotificationSchema.index({ batchId: 1 }) // Bulk operations
NotificationSchema.index({ createdAt: -1 }) // Admin queries

// Instance methods for business logic
NotificationSchema.methods.markAsRead = function() {
  if (this.status === 'unread') {
    this.status = 'read'
    this.readAt = new Date()
    return this.save()
  }
  return Promise.resolve(this)
}

NotificationSchema.methods.markAsDeleted = function() {
  this.status = 'deleted'
  this.deletedAt = new Date()
  // Set expiry to 7 days for cleanup
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return this.save()
}

NotificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date()
}

// Static methods for common queries
NotificationSchema.statics.findActiveByUser = function(userId: string, options = {}) {
  const query = {
    userId,
    status: { $ne: 'deleted' },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }
  
  return this.find(query, null, options).sort({ createdAt: -1 })
}

NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    userId,
    status: 'unread',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null }, 
      { expiresAt: { $gt: new Date() } }
    ]
  })
}

NotificationSchema.statics.bulkMarkAsRead = function(userId: string, notificationIds?: string[]) {
  const query: any = {
    userId,
    status: 'unread'
  }
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds }
  }
  
  return this.updateMany(query, {
    status: 'read',
    readAt: new Date()
  })
}

// Pre-save middleware for validation and optimization
NotificationSchema.pre('save', function(next) {
  // Set expiration date if not already set
  if (!this.expiresAt) {
    // Auto-expire after 90 days for regular notifications
    // Critical notifications never expire
    this.expiresAt = this.priority === 'critical' ? null : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
  
  // Generate source hash for deduplication
  if (this.sourceType && this.sourceId && this.isModified('metadata')) {
    const crypto = require('crypto')
    const sourceData = `${this.sourceType}:${this.sourceId}:${JSON.stringify(this.metadata)}`
    this.sourceHash = crypto.createHash('sha256').update(sourceData).digest('hex')
  }
  
  // Validate delivery channels
  if (this.deliveryChannels.length === 0) {
    this.deliveryChannels = ['web'] // Default to web
  }
  
  next()
})

// Post-save middleware for real-time updates
NotificationSchema.post('save', function(doc) {
  // Emit real-time notification (we'll implement WebSocket later)
  if (this.isNew && process.env.NODE_ENV !== 'test') {
    // notificationEmitter.emit('notification:created', doc)
    console.log(`📧 New notification created for user ${doc.userId}: ${doc.title}`)
  }
})

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)