// File: apps/backend/src/web/routes/test-zoho.routes.ts
// Test endpoint to verify Zoho OAuth configuration before attempting OAuth flow

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/test/zoho-config
 * Verify Zoho OAuth environment variables and configuration
 */
router.get('/zoho-config', (req: Request, res: Response): void => {
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      zoho_client_id: {
        status: !!process.env.ZOHO_CLIENT_ID,
        value: process.env.ZOHO_CLIENT_ID ? `${process.env.ZOHO_CLIENT_ID.substring(0, 15)}...` : 'NOT SET',
        valid: process.env.ZOHO_CLIENT_ID?.startsWith('1000.') || false
      },
      zoho_client_secret: {
        status: !!process.env.ZOHO_CLIENT_SECRET,
        value: process.env.ZOHO_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET',
        length: process.env.ZOHO_CLIENT_SECRET?.length || 0
      },
      zoho_accounts_domain: {
        status: !!process.env.ZOHO_ACCOUNTS_DOMAIN,
        value: process.env.ZOHO_ACCOUNTS_DOMAIN || 'NOT SET (will default to https://accounts.zoho.com)',
        valid: process.env.ZOHO_ACCOUNTS_DOMAIN?.startsWith('https://accounts.zoho.') || false
      },
      zoho_redirect_uri_local: {
        status: !!process.env.ZOHO_REDIRECT_URI_LOCAL,
        value: process.env.ZOHO_REDIRECT_URI_LOCAL || 'NOT SET',
        valid: process.env.ZOHO_REDIRECT_URI_LOCAL?.includes('/oauth/callback') || false
      },
      zoho_redirect_uri_prod: {
        status: !!process.env.ZOHO_REDIRECT_URI_PROD,
        value: process.env.ZOHO_REDIRECT_URI_PROD || 'NOT SET'
      },
      frontend_url_local: {
        status: !!process.env.FRONTEND_URL_LOCAL,
        value: process.env.FRONTEND_URL_LOCAL || 'NOT SET'
      },
      frontend_url_prod: {
        status: !!process.env.FRONTEND_URL_PROD,
        value: process.env.FRONTEND_URL_PROD || 'NOT SET'
      }
    },
    computed_values: {
      current_redirect_uri: process.env.NODE_ENV === 'production' 
        ? process.env.ZOHO_REDIRECT_URI_PROD 
        : process.env.ZOHO_REDIRECT_URI_LOCAL,
      current_frontend_url: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL_PROD
        : process.env.FRONTEND_URL_LOCAL,
      authorization_url: constructAuthUrl()
    },
    recommendations: generateRecommendations()
  };

  const allValid = Object.values(config.checks).every(check => check.status);

  res.json({
    success: allValid,
    message: allValid 
      ? '✅ All Zoho OAuth configuration variables are set' 
      : '⚠️ Some Zoho OAuth configuration variables are missing or invalid',
    ...config
  });
});

/**
 * Helper function to construct the Zoho OAuth authorization URL
 */
function constructAuthUrl(): string {
  const zohoAccountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com';
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? process.env.ZOHO_REDIRECT_URI_PROD
    : process.env.ZOHO_REDIRECT_URI_LOCAL;

  if (!clientId || !redirectUri) {
    return 'ERROR: Missing client ID or redirect URI';
  }

  return `${zohoAccountsDomain}/oauth/v2/auth?response_type=code&client_id=${clientId}&scope=AaaServer.profile.READ&redirect_uri=${encodeURIComponent(redirectUri)}&state=test&access_type=offline`;
}

/**
 * Generate configuration recommendations
 */
function generateRecommendations(): string[] {
  const recommendations: string[] = [];

  if (!process.env.ZOHO_CLIENT_ID) {
    recommendations.push('❌ Set ZOHO_CLIENT_ID in .env file');
  } else if (!process.env.ZOHO_CLIENT_ID.startsWith('1000.')) {
    recommendations.push('⚠️ ZOHO_CLIENT_ID should start with "1000."');
  }

  if (!process.env.ZOHO_CLIENT_SECRET) {
    recommendations.push('❌ Set ZOHO_CLIENT_SECRET in .env file');
  }

  if (!process.env.ZOHO_ACCOUNTS_DOMAIN) {
    recommendations.push('⚠️ Set ZOHO_ACCOUNTS_DOMAIN explicitly (e.g., https://accounts.zoho.com, .in, .eu)');
  }

  if (!process.env.ZOHO_REDIRECT_URI_LOCAL) {
    recommendations.push('❌ Set ZOHO_REDIRECT_URI_LOCAL in .env file');
  } else if (!process.env.ZOHO_REDIRECT_URI_LOCAL.includes('/oauth/callback')) {
    recommendations.push('⚠️ ZOHO_REDIRECT_URI_LOCAL should end with /oauth/callback');
  }

  if (!process.env.ZOHO_REDIRECT_URI_PROD) {
    recommendations.push('⚠️ Set ZOHO_REDIRECT_URI_PROD for production deployment');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All configuration looks good! Try the OAuth flow.');
  }

  return recommendations;
}

/**
 * GET /api/test/zoho-oauth-url
 * Generate and return the Zoho OAuth URL for testing
 */
router.get('/zoho-oauth-url', (req: Request, res: Response): void => {
  const intent = req.query.intent as string || 'test';
  const state = btoa(JSON.stringify({ intent, timestamp: Date.now() }));
  
  const zohoAccountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com';
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? process.env.ZOHO_REDIRECT_URI_PROD
    : process.env.ZOHO_REDIRECT_URI_LOCAL;

  if (!clientId || !redirectUri) {
    res.status(500).json({
      error: 'Missing configuration',
      message: 'ZOHO_CLIENT_ID or redirect URI not configured'
    });
    return;
  }

  const authUrl = `${zohoAccountsDomain}/oauth/v2/auth?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `scope=${encodeURIComponent('AaaServer.profile.READ')}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${encodeURIComponent(state)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.json({
    success: true,
    authorization_url: authUrl,
    instructions: [
      '1. Copy the authorization_url above',
      '2. Paste it in your browser',
      '3. Log in with your Zoho account',
      '4. You should be redirected back to /oauth/callback',
      '5. Check backend console for logs'
    ],
    configuration: {
      domain: zohoAccountsDomain,
      client_id: `${clientId.substring(0, 15)}...`,
      redirect_uri: redirectUri,
      scope: 'AaaServer.profile.READ',
      intent: intent
    }
  });
});

export default router;
