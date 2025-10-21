// File: apps/backend/src/web/routes/zoho-auth.routes.ts
import { Router, Request, Response } from 'express';
import passport from 'passport';
import { signToken } from '../utils/jwt';
import { verifyZohoOAuthCredentials } from '../../config/passport';

const router = Router();

// Helper function to get frontend URL based on environment
function getFrontendUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL_PRODUCTION || 'https://automatic-poll-generation-frontend.vercel.app'
    : process.env.FRONTEND_URL_LOCAL || 'http://localhost:5174';
}

// Zoho OAuth initiation route with intent tracking using state parameter
router.get('/zoho', (req: Request, res: Response, next) => {
  // Capture user intent from query parameters
  const intent = req.query.intent as string; // 'create-poll' or 'join-poll'
  
  console.log('🎯 Zoho OAuth initiated with intent:', intent);
  
  // Use Zoho OAuth state parameter to track intent (more reliable than session)
  const state = intent ? btoa(JSON.stringify({ intent, timestamp: Date.now() })) : 'default';
  
  // Proceed with Zoho OAuth, passing state parameter
  passport.authenticate('zoho', { 
    scope: ['ZohoProfile.userinfo.read'],
    state: state
  })(req, res, next);
});

// Note: Zoho OAuth callback is handled in zoho-root.routes.ts to match the redirect URI configuration

// Test route to verify Zoho OAuth credentials
router.get('/zoho/test', async (req: Request, res: Response) => {
  try {
    const result = await verifyZohoOAuthCredentials();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      valid: false, 
      message: `Zoho OAuth test failed: ${error}` 
    });
  }
});

export default router;