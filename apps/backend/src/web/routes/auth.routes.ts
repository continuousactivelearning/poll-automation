// File: apps/backend/src/web/routes/auth.routes.ts
import { Router, RequestHandler } from 'express';
// import { register, login, forgotPassword, resetPassword, refreshToken } from '../controllers/auth.controller';
import { register, login, forgotPassword, resetPassword, getGoogleAuthUrl, handleGoogleCallback,refreshToken } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));
router.post('/forgot-password', asyncHandler(forgotPassword)); // <-- THIS LINE IS REQUIRED
router.post('/reset-password', asyncHandler(resetPassword));
router.get('/google', getGoogleAuthUrl as RequestHandler);
router.get('/google/callback', handleGoogleCallback as RequestHandler);
export default router;


