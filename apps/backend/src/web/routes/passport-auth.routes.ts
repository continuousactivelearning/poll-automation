// File: apps/backend/src/web/routes/passport-auth.routes.ts
import { Router, Request, Response } from 'express';
import passport from 'passport';
import { signToken } from '../utils/jwt';
import { verifyGoogleOAuthCredentials } from '../../config/passport';

const router = Router();

// Google OAuth initiation route with intent tracking using state parameter
router.get('/google', (req: Request, res: Response, next) => {
  // Capture user intent from query parameters
  const intent = req.query.intent as string; // 'create-poll' or 'join-poll'
  
  console.log('🎯 Google OAuth initiated with intent:', intent);
  
  // Use Google OAuth state parameter to track intent (more reliable than session)
  const state = intent ? btoa(JSON.stringify({ intent, timestamp: Date.now() })) : 'default';
  
  // Proceed with Google OAuth, passing state parameter
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: state
  })(req, res, next);
});

// Google OAuth callback route with state-based intent tracking
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        console.error('❌ No user returned from Google OAuth');
        return res.redirect(`${getFrontendUrl()}/login?error=auth_failed`);
      }

      console.log('✅ Google OAuth success for user:', user.email, 'Role:', user.role);

      // Generate JWT token for the user
      const token = signToken({ 
        id: user._id.toString(), 
        role: user.role,
        email: user.email 
      });

      // Get intent from state parameter
      const state = req.query.state as string;
      let intent = 'default';
      
      try {
        if (state && state !== 'default') {
          const stateData = JSON.parse(atob(state));
          intent = stateData.intent || 'default';
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse state parameter:', error);
      }
      
      console.log('🎯 Retrieved OAuth intent from state:', intent);

      // Determine redirect path based on intent
      const frontendUrl = getFrontendUrl();
      let redirectPath = '';

      switch (intent) {
        case 'create-poll':
          redirectPath = '/host/create-poll';
          break;
        case 'join-poll':
          redirectPath = '/student/join-poll';
          break;
        default:
          // Use role-based routing as fallback
          redirectPath = user.role === 'student' ? '/student' : '/host';
      }

      // Construct redirect URL to GoogleAuthCallback with intent
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(token)}&google_auth=success&intent=${intent}`;
      
      console.log('🔄 Redirecting to GoogleAuthCallback with intent:', redirectUrl);
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${getFrontendUrl()}/login?error=auth_failed`);
    }
  }
);

// Google OAuth failure route
router.get('/google/failure', (req: Request, res: Response) => {
  console.error('❌ Google OAuth authentication failed');
  res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
});

// Route to verify Google OAuth credentials
router.get('/google/verify-credentials', async (req: Request, res: Response) => {
  try {
    const verification = await verifyGoogleOAuthCredentials();
    res.json(verification);
  } catch (error) {
    res.status(500).json({
      valid: false,
      message: `Verification failed: ${error}`
    });
  }
});

// Helper function to get frontend URL based on environment
function getFrontendUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? (process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL_PRODUCTION || 'https://automatic-poll-generation-frontend.vercel.app')
    : (process.env.FRONTEND_URL_LOCAL || 'http://localhost:5174');
}

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    
    (req.session as any).destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Session cleanup failed' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

export default router;