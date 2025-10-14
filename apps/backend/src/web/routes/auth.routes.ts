// File: apps/backend/src/web/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, refreshToken } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));
router.post('/forgot-password', asyncHandler(forgotPassword)); // <-- THIS LINE IS REQUIRED
router.post('/reset-password', asyncHandler(resetPassword));

export default router;