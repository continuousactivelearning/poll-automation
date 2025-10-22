// File: apps/backend/src/web/routes/zoho-root.routes.ts
import { Router, Request, Response } from 'express';
import passport from 'passport';
import { signToken } from '../utils/jwt';
import axios from 'axios';
import { User } from '../models/user.model';

const router = Router();

// Helper function to get frontend URL based on environment
function getFrontendUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL_PRODUCTION || 'https://automatic-poll-generation-frontend.vercel.app'
    : process.env.FRONTEND_URL_LOCAL || 'http://localhost:5174';
}

// Helper function to get Zoho redirect URI based on environment
function getZohoRedirectUri(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? process.env.ZOHO_REDIRECT_URI_PROD || 'https://automatic-poll-generation-backend.onrender.com/oauth/callback'
    : process.env.ZOHO_REDIRECT_URI_LOCAL || 'http://localhost:8000/oauth/callback';
}

// Manual Zoho OAuth initiation route (bypassing Passport completely)
router.get('/api/auth/zoho', (req: Request, res: Response) => {
  const intent = req.query.intent as string; // 'create-poll' or 'join-poll'
  
  console.log('🎯 Manual Zoho OAuth initiated with intent:', intent);
  
  // Create state parameter for intent tracking
  const state = intent ? btoa(JSON.stringify({ intent, timestamp: Date.now() })) : 'default';
  
  // Build Zoho OAuth authorization URL manually (using .in domain for India region)
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = getZohoRedirectUri(); // Use environment-specific redirect URI
  const scope = 'AaaServer.profile.READ'; // Correct scope for user profile access
  
  console.log('🌍 Using Zoho redirect URI:', redirectUri);
  
  const authUrl = `https://accounts.zoho.in/oauth/v2/auth?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${encodeURIComponent(state)}&` +
    `access_type=offline`;
  
  console.log('🔗 Redirecting to Zoho OAuth URL:', authUrl);
  res.redirect(authUrl);
});

// Manual Zoho OAuth callback route (bypassing Passport due to token exchange issues)
router.get('/oauth/callback', async (req: Request, res: Response) => {
  console.log('🔍 Zoho callback received with query params:', req.query);
  
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    console.error('❌ Zoho OAuth error:', error);
    return res.redirect(`${getFrontendUrl()}/login?error=zoho_oauth_error&details=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('❌ No authorization code received from Zoho');
    return res.redirect(`${getFrontendUrl()}/login?error=no_code`);
  }

  try {
    // Step 1: Exchange authorization code for access token
    console.log('🔄 Exchanging authorization code for access token...');
    
    // Use the correct accounts server based on the callback location
    const accountsServer = req.query['accounts-server'] as string || 'https://accounts.zoho.com';
    console.log('🌍 Using Zoho accounts server:', accountsServer);
    
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      redirect_uri: getZohoRedirectUri(), // Use environment-specific redirect URI
      code: code
    });

    const tokenUrl = `${accountsServer}/oauth/v2/token`;
    console.log('🔗 Token exchange URL:', tokenUrl);

    const tokenResponse = await axios.post(tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Token exchange successful');
    console.log('🔍 Token response:', JSON.stringify(tokenResponse.data, null, 2));
    
    const { access_token } = tokenResponse.data;
    console.log('🎟️ Access token length:', access_token ? access_token.length : 'undefined');

    // Step 2: Get user info using access token
    console.log('👤 Fetching user info from Zoho...');
    
    // For AaaServer.profile.READ scope, use the accounts server endpoint, not API domain
    const userInfoUrl = `${accountsServer}/oauth/user/info`;
    console.log('🔍 Making request to Zoho user info API with token...');
    console.log('🔗 Request URL:', userInfoUrl);
    console.log('🔑 Authorization header: Zoho-oauthtoken [TOKEN_HIDDEN]');
    
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('✅ User info response status:', userInfoResponse.status);
    const userInfo = userInfoResponse.data;
    console.log('👤 Zoho user info received:', { 
      email: userInfo.Email, 
      name: userInfo.Display_Name 
    });

    if (!userInfo.Email) {
      throw new Error('No email provided by Zoho');
    }

    // Step 3: Parse intent from state parameter
    let intent = 'default';
    try {
      if (state && state !== 'default') {
        const stateData = JSON.parse(atob(state));
        intent = stateData.intent || 'default';
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse state parameter:', parseError);
    }
    
    console.log('🎯 Intent extracted from state:', intent);

    // Step 4: Find or create user in database
    let user = await User.findOne({ 
      $or: [
        { email: userInfo.Email },
        { zohoId: userInfo.ZUID }
      ]
    });

    if (user) {
      // EXISTING USER: Update with Zoho info if missing
      let updated = false;
      
      if (!user.zohoId) {
        user.zohoId = userInfo.ZUID;
        updated = true;
      }
      if (!user.fullName && userInfo.Display_Name) {
        user.fullName = userInfo.Display_Name;
        updated = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        updated = true;
      }
      
      if (updated) {
        await user.save();
        console.log('✅ Updated existing user with Zoho info:', user.email);
      } else {
        console.log('✅ Existing user logged in via Zoho:', user.email);
      }
    } else {
      // NEW USER: Create with role based on intent
      const role = intent === 'create-poll' ? 'host' : 'student';
      
      user = new User({
        zohoId: userInfo.ZUID,
        fullName: userInfo.Display_Name || `${userInfo.First_Name || ''} ${userInfo.Last_Name || ''}`.trim() || 'Zoho User',
        email: userInfo.Email,
        role,
        isEmailVerified: true
      });

      await user.save();
      console.log('✅ New user created via Zoho OAuth:', user.email, 'Role:', user.role, 'Intent:', intent);
    }

    // Step 5: Generate JWT token and redirect
    const token = signToken({ 
      id: (user._id as any).toString(), 
      role: user.role,
      email: user.email 
    });

    const frontendUrl = getFrontendUrl();
    const redirectUrl = `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(token)}&google_auth=success&intent=${intent}&provider=zoho`;
    
    console.log('🔄 Redirecting to frontend callback:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error: any) {
    console.error('❌ Zoho OAuth callback error:', error.message);
    if (error.response) {
      console.error('❌ Zoho API Error Response:', error.response.data);
      console.error('❌ Zoho API Error Status:', error.response.status);
    }
    return res.redirect(`${getFrontendUrl()}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`);
  }
});

// Zoho OAuth failure route
router.get('/oauth/failure', (req: Request, res: Response) => {
  console.error('❌ Zoho OAuth authentication failed');
  res.redirect(`${getFrontendUrl()}/login?error=zoho_auth_failed`);
});

export default router;