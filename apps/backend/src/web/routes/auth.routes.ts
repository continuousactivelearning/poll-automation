// File: apps/backend/src/web/routes/auth.routes.ts
import { Router, RequestHandler } from 'express';
import { register, login, forgotPassword, resetPassword, refreshToken } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';
import passportAuthRoutes from './passport-auth.routes'; // Google OAuth routes
import zohoAuthRoutes from './zoho-auth.routes'; // Zoho OAuth routes

const router = Router();

// Existing auth routes - keep intact
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

// Google OAuth routes (Passport-based)
router.use('/', passportAuthRoutes);

// Zoho OAuth routes are now handled in zoho-root.routes.ts (manual implementation)
// router.use('/', zohoAuthRoutes); // DISABLED - using manual implementation

export default router;