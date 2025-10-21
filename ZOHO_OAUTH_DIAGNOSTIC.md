# Zoho OAuth Diagnostic Guide

## Issue: Zoho OAuth Redirects to Google Callback

This document helps diagnose and fix Zoho OAuth authentication issues.

## Root Cause Analysis

The issue occurs when:
1. **Domain Mismatch**: Zoho OAuth initiation uses one domain (e.g., `.in`) but token exchange uses a different domain (e.g., `.com`)
2. **Redirect URI Mismatch**: The redirect URI registered in Zoho app doesn't match the callback URL in your code
3. **Missing Environment Variables**: ZOHO_ACCOUNTS_DOMAIN is not set, causing inconsistent behavior

## Solution Implemented

### 1. Fixed Domain Consistency
- Added `ZOHO_ACCOUNTS_DOMAIN` environment variable to ensure both initiation and callback use the same domain
- Updated `zoho-root.routes.ts` to use this variable consistently

### 2. Verify Your Zoho App Configuration

**CRITICAL**: Check your Zoho Developer Console and verify:

#### Step 1: Log into Zoho API Console
Go to: https://api-console.zoho.com/

#### Step 2: Select Your Client
Click on your "Automatic Poll Deploy" app (or whatever you named it)

#### Step 3: Check Authorized Redirect URIs
You should see EXACTLY these URLs (based on your .env):

**For Development:**
```
http://localhost:8000/oauth/callback
```

**For Production:**
```
https://automatic-poll-generation-backend.onrender.com/oauth/callback
```

#### Step 4: Check Client Details
- Client ID: Should match `ZOHO_CLIENT_ID` in your `.env`
- Client Secret: Should match `ZOHO_CLIENT_SECRET` in your `.env`
- Client Domain: Note which domain it's registered under (.com, .in, .eu, etc.)

#### Step 5: Update ZOHO_ACCOUNTS_DOMAIN in .env
Based on the domain your Zoho app is registered under:
- If it says "https://accounts.zoho.com" → Use: `ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com`
- If it says "https://accounts.zoho.in" → Use: `ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.in`
- If it says "https://accounts.zoho.eu" → Use: `ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.eu`

### 3. Verify Scopes
In your Zoho app, ensure these scopes are enabled:
- ✅ `AaaServer.profile.READ` (User profile information)

### 4. Test OAuth Flow

#### Backend Test Endpoints:

1. **Test Zoho OAuth Initiation** (Browser):
   ```
   http://localhost:8000/api/auth/zoho?intent=join-poll
   ```
   **Expected**: Redirects to Zoho login page

2. **After Zoho Login**:
   - You should be redirected back to: `http://localhost:8000/oauth/callback?code=...`
   - Backend should exchange code for token
   - Backend should fetch user info
   - Backend should create/update user in database
   - Backend should redirect to: `http://localhost:5174/auth/google/callback?token=...&provider=zoho`

#### Frontend Test:

1. Start frontend: `pnpm run dev` in `apps/frontend`
2. Start backend: `npm run dev` in `apps/backend`
3. Go to: `http://localhost:5174/login`
4. Click "Continue with Zoho"
5. Check browser console and backend console for logs

### 5. Debugging Checklist

#### Backend Console Should Show:
```
✅ Passport Zoho Strategy configured successfully
🎯 Manual Zoho OAuth initiated with intent: join-poll
🌍 Using Zoho accounts domain: https://accounts.zoho.com
🌍 Using Zoho redirect URI: http://localhost:8000/oauth/callback
🔗 Redirecting to Zoho OAuth URL: https://accounts.zoho.com/oauth/v2/auth?...
```

After callback:
```
🔍 Zoho callback received with query params: { code: '...', state: '...', ... }
🔄 Exchanging authorization code for access token...
🌍 Using Zoho accounts server for token exchange: https://accounts.zoho.com
✅ Token exchange successful
👤 Zoho user info received: { email: '...', name: '...' }
✅ New user created via Zoho OAuth: email@example.com Role: student Intent: join-poll
```

#### Browser Console Should Show:
```
🎯 Starting Zoho OAuth with intent: join-poll
```

After redirect back from Zoho:
```
✅ Zoho OAuth success for user: email@example.com Role: student
🎯 Intent received: join-poll
🔄 Navigating to intended path: /student/join-poll
```

### 6. Common Errors and Solutions

#### Error: "redirect_uri_mismatch"
**Problem**: Redirect URI in Zoho app doesn't match callback URL
**Solution**: 
1. Go to Zoho API Console
2. Update "Authorized Redirect URIs" to include: `http://localhost:8000/oauth/callback`
3. Save and retry

#### Error: "No authorization code received"
**Problem**: Zoho isn't sending the authorization code
**Solution**: 
1. Check Zoho app is Active/Published (not in development mode)
2. Verify scopes are properly configured
3. Try clearing cookies and retry

#### Error: "invalid_client" during token exchange
**Problem**: Client ID or Client Secret is wrong, OR domain mismatch
**Solution**:
1. Verify `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` in `.env` are correct
2. Ensure `ZOHO_ACCOUNTS_DOMAIN` matches your Zoho app's domain
3. Check you're not mixing .com and .in domains

#### Error: "No email provided by Zoho"
**Problem**: User info request is failing
**Solution**:
1. Verify `AaaServer.profile.READ` scope is enabled in Zoho app
2. Check token exchange was successful
3. Ensure accounts domain is correct for user info request

### 7. Environment Variables Reference

Your `.env` file should have:
```env
# Zoho OAuth configuration
ZOHO_CLIENT_ID=1000.GUII83KI33WW7JA90NOAZC4BMOW07X
ZOHO_CLIENT_SECRET=4a49de7721c22a3c6208e01328c7e9606733dc8228
ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com

# Zoho Redirect URIs
ZOHO_REDIRECT_URI_LOCAL=http://localhost:8000/oauth/callback
ZOHO_REDIRECT_URI_PROD=https://automatic-poll-generation-backend.onrender.com/oauth/callback

# Environment
NODE_ENV=development

# Frontend URLs
FRONTEND_URL_LOCAL=http://localhost:5174
FRONTEND_URL_PROD=https://automatic-poll-generation-frontend.vercel.app
```

### 8. Quick Test Script

Create a test file to verify Zoho app configuration:

```bash
# In apps/backend directory
curl -v "http://localhost:8000/api/auth/zoho?intent=join-poll"
```

This should return a 302 redirect to Zoho's OAuth page.

## Summary of Changes Made

1. ✅ Added `ZOHO_ACCOUNTS_DOMAIN` environment variable for consistency
2. ✅ Updated `zoho-root.routes.ts` to use the same domain for both initiation and callback
3. ✅ Added `prompt=consent` to force proper authorization
4. ✅ Enhanced logging for better debugging
5. ✅ Updated GoogleAuthCallback component to handle both providers

## Next Steps

1. **Set the correct ZOHO_ACCOUNTS_DOMAIN** in your `.env` file based on your Zoho app's region
2. **Restart your backend server** to pick up the new environment variable
3. **Test the OAuth flow** by clicking "Continue with Zoho" on the login page
4. **Check console logs** on both frontend and backend to track the flow
5. **If it still fails**, share the exact error messages from both consoles

## Additional Resources

- [Zoho OAuth 2.0 Documentation](https://www.zoho.com/accounts/protocol/oauth/web-server-applications.html)
- [Zoho API Console](https://api-console.zoho.com/)
- [Zoho OAuth Scopes Reference](https://www.zoho.com/accounts/protocol/oauth/scopes.html)
