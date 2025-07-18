// apps/backend/src/web/routes/authRoutes.ts
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword, // Import the new forgotPassword controller
  resetPassword   // Import the new resetPassword controller
} from '../controllers/authController';

const router = Router();

// Route for user registration
router.post('/register', registerUser);

// Route for user login
router.post('/login', loginUser);

// Route for requesting a password reset link
// This will send an email with a reset token to the user.
router.post('/forgotpassword', forgotPassword);

// Route for resetting the password using the token received in the email.
// The ':resettoken' is a URL parameter that will contain the unhashed token.
router.put('/resetpassword/:resettoken', resetPassword);

export default router;
