# Google OAuth Configuration Guide

## Overview
This guide explains how to configure Google OAuth to work in both local development and production environments for our poll generation system.

## Current Configuration Status ✅

### Backend Environment Variables
- **Local Development**: Environment automatically detects `NODE_ENV=development`
- **Production**: Environment should be set to `NODE_ENV=production` on Render.com
- **Dynamic Redirect URIs**: Backend constructs redirect URIs based on environment

### Frontend Integration
- **Local**: Uses `VITE_API_URL=http://localhost:8000/api`
- **Production**: Uses `VITE_API_URL=https://automatic-poll-generation-backend.onrender.com/api`
- **OAuth Button**: Dynamically constructs backend URL from environment variables

## Google Cloud Console Setup (REQUIRED)

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"

### 2. Configure OAuth 2.0 Client ID
Find your OAuth 2.0 Client ID: `7995940407-134acqop9b9v1j12k5lf1mi5c6e4u8c2.apps.googleusercontent.com`

#### Add Authorized Redirect URIs:
You MUST add both of these redirect URIs:

```
http://localhost:8000/api/auth/google/callback
https://automatic-poll-generation-backend.onrender.com/api/auth/google/callback
```

### 3. Authorized JavaScript Origins (Optional but Recommended)
Add these origins to allow the frontend to make requests:

```
http://localhost:5174
https://automatic-poll-generation.vercel.app
```

## Environment Variables Configuration

### Backend (.env)
```bash
# Google OAuth configuration - Environment aware
GOOGLE_OAUTH_CLIENT_ID=7995940407-134acqop9b9v1j12k5lf1mi5c6e4u8c2.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
# Redirect URI will be constructed dynamically based on NODE_ENV
NODE_ENV=development

# Frontend URL - will be set dynamically based on NODE_ENV
FRONTEND_URL_LOCAL=http://localhost:5174
FRONTEND_URL_PRODUCTION=https://automatic-poll-generation.vercel.app
```

### Production Environment (Render.com)
Make sure these environment variables are set on Render.com:
- `NODE_ENV=production`
- `GOOGLE_OAUTH_CLIENT_ID=7995940407-134acqop9b9v1j12k5lf1mi5c6e4u8c2.apps.googleusercontent.com`
- `GOOGLE_OAUTH_CLIENT_SECRET=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`
- `FRONTEND_URL_LOCAL=http://localhost:5174`
- `FRONTEND_URL_PRODUCTION=https://automatic-poll-generation.vercel.app`

## How It Works

### Local Development Flow
1. User clicks "Continue with Google" on frontend (`http://localhost:5174`)
2. Frontend redirects to `http://localhost:8000/api/auth/google`
3. Backend (NODE_ENV=development) constructs redirect URI: `http://localhost:8000/api/auth/google/callback`
4. Google redirects back to local callback URL
5. Backend exchanges code for token and redirects to `http://localhost:5174/auth/google/callback?token=...`
6. Frontend receives token and logs user in

### Production Flow
1. User clicks "Continue with Google" on frontend (`https://automatic-poll-generation.vercel.app`)
2. Frontend redirects to `https://automatic-poll-generation-backend.onrender.com/api/auth/google`
3. Backend (NODE_ENV=production) constructs redirect URI: `https://automatic-poll-generation-backend.onrender.com/api/auth/google/callback`
4. Google redirects back to production callback URL
5. Backend exchanges code for token and redirects to `https://automatic-poll-generation.vercel.app/auth/google/callback?token=...`
6. Frontend receives token and logs user in

## Testing Instructions

### Local Testing
1. Start backend: `cd apps/backend && npm run dev`
2. Start frontend: `cd apps/frontend && npm run dev`
3. Navigate to `http://localhost:5174/login`
4. Click "Continue with Google"
5. Should redirect to Google OAuth and back successfully

### Production Testing
1. Deploy backend to Render.com with `NODE_ENV=production`
2. Deploy frontend to Vercel
3. Navigate to `https://automatic-poll-generation.vercel.app/login`
4. Click "Continue with Google"
5. Should redirect to Google OAuth and back successfully

## Troubleshooting

### Common Issues
1. **"redirect_uri_mismatch"**: Make sure both redirect URIs are added to Google Cloud Console
2. **"Invalid client"**: Verify client ID and secret are correctly set in environment variables
3. **CORS errors**: Ensure authorized origins are set in Google Cloud Console
4. **Environment detection**: Check that `NODE_ENV` is properly set in production

### Debug Information
The backend logs helpful debug information:
- OAuth environment variables status
- Constructed redirect URIs
- Frontend redirect URLs

Check backend logs for debugging information.

## Security Notes
- Client secret should never be exposed to frontend
- All OAuth flows happen server-side for security
- JWT tokens are used for frontend authentication after OAuth success
- CSP headers are configured to allow Google OAuth domains

## Next Steps
1. ✅ Update Google Cloud Console with both redirect URIs
2. ✅ Verify production environment variables on Render.com
3. ✅ Test OAuth flow in both environments
4. ✅ Monitor logs for any issues

The system is now configured for real-time Google authentication that works in both local development and production environments!