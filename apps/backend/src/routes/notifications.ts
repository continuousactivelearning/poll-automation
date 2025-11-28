import { Router, Request, Response, NextFunction } from 'express'
import { NotificationController, rateLimitMiddleware } from '../controllers/NotificationController'
// Import your existing auth middleware - adjust path as needed
// import { authenticateToken } from '../middlewares/auth'

// Temporary auth middleware placeholder - replace with your actual auth
const authenticateToken = (req: any, res: any, next: any) => {
  // TODO: Replace with your actual authentication middleware
  // For now, assuming user is attached by previous middleware
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  next()
}

const router = Router()

// Apply rate limiting to all notification routes
router.use(rateLimitMiddleware(100, 15 * 60 * 1000)) // 100 requests per 15 minutes

// Health check (no auth required)
router.get('/health', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.healthCheck(req, res).catch(next)
})

// All other routes require authentication
router.use(authenticateToken)

// Main notification routes
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.getNotifications(req as any, res).catch(next)
})

router.get('/unread-count', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.getUnreadCount(req as any, res).catch(next)
})

router.post('/:id/read', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.markAsRead(req as any, res).catch(next)
})

router.post('/read-multiple', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.markMultipleAsRead(req as any, res).catch(next)
})

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.deleteNotification(req as any, res).catch(next)
})

// Admin routes (additional auth check in controller)
router.post('/create', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.createNotification(req as any, res).catch(next)
})

router.get('/admin/stats', (req: Request, res: Response, next: NextFunction) => {
  NotificationController.getAdminStats(req as any, res).catch(next)
})

export default router