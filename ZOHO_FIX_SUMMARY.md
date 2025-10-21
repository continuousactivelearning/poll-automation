# Zoho OAuth Fix Summary

## Problem Statement
Zoho authentication was not working - clicking "Continue with Zoho" was redirecting to Google auth callback and returning to login page.

## Root Cause Analysis
1. **Domain Mismatch**: OAuth initiation used `.in` domain but callback defaulted to `.com` domain
2. **Missing Configuration**: No explicit `ZOHO_ACCOUNTS_DOMAIN` variable to ensure consistency
3. **Insufficient Debugging**: Lack of test endpoints to verify configuration before attempting OAuth flow

## Solutions Implemented

### 1. Fixed Domain Consistency ✅
**File:** `apps/backend/src/web/routes/zoho-root.routes.ts`

**Changes:**
- Added `ZOHO_ACCOUNTS_DOMAIN` environment variable for consistent domain usage
- Updated both OAuth initiation and callback to use the same domain
- Added `prompt=consent` parameter to force proper authorization

**Before:**
```typescript
const authUrl = `https://accounts.zoho.in/oauth/v2/auth?...` // Hardcoded .in
// ...
const accountsServer = req.query['accounts-server'] as string || 'https://accounts.zoho.com'; // Defaulted to .com
```

**After:**
```typescript
const zohoAccountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com';
const authUrl = `${zohoAccountsDomain}/oauth/v2/auth?...`
// ...
const accountsServer = req.query['accounts-server'] as string || zohoAccountsDomain;
```

### 2. Updated Environment Variables ✅
**File:** `apps/backend/.env`

**Added:**
```env
ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com
```

**Documentation:** Added comments explaining region-specific domains (.com, .in, .eu, .com.au)

### 3. Created Test Endpoints ✅
**File:** `apps/backend/src/web/routes/test-zoho.routes.ts` (NEW)

**Endpoints:**
- `GET /api/test/zoho-config` - Verify all environment variables are set correctly
- `GET /api/test/zoho-oauth-url` - Generate OAuth URL for manual testing

**Features:**
- Validates all Zoho OAuth configuration
- Provides actionable recommendations
- Shows computed values (redirect URIs, frontend URLs)
- Only enabled in development mode

### 4. Enhanced Logging ✅
**Files:** `apps/backend/src/web/routes/zoho-root.routes.ts`, `apps/backend/src/config/passport.ts`

**Added console logs for:**
- OAuth initiation with intent tracking
- Domain usage (accounts server)
- Redirect URI being used
- Token exchange process
- User info retrieval
- User creation/update
- Final redirect to frontend

### 5. Created Documentation ✅
**Files:**
- `ZOHO_OAUTH_DIAGNOSTIC.md` - Comprehensive troubleshooting guide
- `ZOHO_QUICK_TEST.md` - Step-by-step testing instructions

**Contents:**
- Configuration verification steps
- Common errors and solutions
- Zoho app settings checklist
- Expected log outputs
- Success indicators

## Files Modified

1. ✅ `apps/backend/src/web/routes/zoho-root.routes.ts` - Fixed domain consistency
2. ✅ `apps/backend/.env` - Added ZOHO_ACCOUNTS_DOMAIN
3. ✅ `apps/backend/src/web/routes/test-zoho.routes.ts` - NEW - Test endpoints
4. ✅ `apps/backend/src/app.ts` - Registered test routes
5. ✅ `ZOHO_OAUTH_DIAGNOSTIC.md` - NEW - Diagnostic guide
6. ✅ `ZOHO_QUICK_TEST.md` - NEW - Quick test guide

## Testing Instructions

### Step 1: Verify Backend Configuration
```bash
cd apps/backend
npm run dev
```

Then test:
```bash
curl http://localhost:8000/api/test/zoho-config
```

**Expected:** All checks should pass with `"success": true`

### Step 2: Check Zoho App Settings
1. Go to: https://api-console.zoho.com/
2. Verify redirect URI: `http://localhost:8000/oauth/callback`
3. Verify scope: `AaaServer.profile.READ`
4. Note the domain (accounts.zoho.com, .in, .eu, etc.)
5. Update `ZOHO_ACCOUNTS_DOMAIN` in .env if needed

### Step 3: Test OAuth Flow
1. Start frontend: `pnpm run dev` in `apps/frontend`
2. Open: http://localhost:5174/login
3. Click "Continue with Zoho"
4. Log in with Zoho account
5. Verify you're redirected back and logged in

### Expected Console Output

**Backend (during initiation):**
```
🎯 Manual Zoho OAuth initiated with intent: default
🌍 Using Zoho accounts domain: https://accounts.zoho.com
🌍 Using Zoho redirect URI: http://localhost:8000/oauth/callback
🔗 Redirecting to Zoho OAuth URL: https://accounts.zoho.com/oauth/v2/auth?...
```

**Backend (after callback):**
```
🔍 Zoho callback received with query params: { code: '...', state: '...', ... }
🔄 Exchanging authorization code for access token...
🌍 Using Zoho accounts server for token exchange: https://accounts.zoho.com
✅ Token exchange successful
👤 Zoho user info received: { email: 'user@example.com', name: 'John Doe' }
✅ New user created via Zoho OAuth: user@example.com Role: student Intent: default
🔄 Redirecting to frontend callback: http://localhost:5174/auth/google/callback?token=...&provider=zoho
```

**Frontend:**
```
🎯 Starting Zoho OAuth with intent: default
// (after redirect back)
✅ Zoho OAuth success for user: user@example.com Role: student
🔄 Navigating to intended path: /student
```

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution:** Add `http://localhost:8000/oauth/callback` to Zoho app's Authorized Redirect URIs

### Issue: "invalid_client"
**Solution:** Verify ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET match Zoho app credentials

### Issue: Domain mismatch errors
**Solution:** Set ZOHO_ACCOUNTS_DOMAIN to match your Zoho account region:
- Global/US: `https://accounts.zoho.com`
- India: `https://accounts.zoho.in`
- Europe: `https://accounts.zoho.eu`
- Australia: `https://accounts.zoho.com.au`

### Issue: "No email provided by Zoho"
**Solution:** Ensure `AaaServer.profile.READ` scope is enabled in Zoho app

## Next Steps

1. **Run the configuration test:**
   ```bash
   curl http://localhost:8000/api/test/zoho-config
   ```

2. **Fix any issues** reported by the test endpoint

3. **Verify Zoho app settings** at api-console.zoho.com

4. **Update ZOHO_ACCOUNTS_DOMAIN** in .env to match your Zoho account region

5. **Restart backend server** to load new environment variables

6. **Test the OAuth flow** by clicking "Continue with Zoho" on login page

7. **Check console logs** on both frontend and backend to verify flow completion

## Architecture Notes

### Why Use GoogleAuthCallback for Both Providers?
The frontend uses a single `GoogleAuthCallback` component for both Google and Zoho OAuth. This is intentional because:
- Both follow the same OAuth 2.0 flow
- Backend sends a `provider` parameter to differentiate
- Reduces code duplication
- Simplifies maintenance

### Why Manual Implementation for Zoho?
Zoho OAuth uses a manual implementation (bypassing Passport.js strategy in the callback) because:
- Passport OAuth2 strategy had issues with Zoho's token exchange
- Manual implementation provides better error handling
- More control over the OAuth flow
- Easier debugging with explicit logging

### Route Structure
- `/api/auth/zoho` - Initiates OAuth (registered in zoho-root.routes.ts)
- `/oauth/callback` - Receives OAuth callback (registered in zoho-root.routes.ts)
- `/auth/google/callback` - Frontend callback for both Google and Zoho (registered in App.tsx)

## Support

If you encounter issues:
1. Check backend console for detailed error logs
2. Check frontend browser console for client-side errors
3. Run `/api/test/zoho-config` to verify configuration
4. Review `ZOHO_OAUTH_DIAGNOSTIC.md` for troubleshooting
5. Follow `ZOHO_QUICK_TEST.md` for step-by-step testing

## Configuration Reference

**Required Environment Variables:**
```env
# Zoho OAuth
ZOHO_CLIENT_ID=1000.GUII83KI33WW7JA90NOAZC4BMOW07X
ZOHO_CLIENT_SECRET=your_secret_here
ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com

# Redirect URIs
ZOHO_REDIRECT_URI_LOCAL=http://localhost:8000/oauth/callback
ZOHO_REDIRECT_URI_PROD=https://your-backend-domain.com/oauth/callback

# Frontend URLs
FRONTEND_URL_LOCAL=http://localhost:5174
FRONTEND_URL_PROD=https://your-frontend-domain.com

# Environment
NODE_ENV=development
```

## Success Criteria

✅ Configuration test passes: `/api/test/zoho-config` returns success
✅ OAuth URL generates correctly: `/api/test/zoho-oauth-url` returns valid URL
✅ Clicking "Continue with Zoho" redirects to Zoho login
✅ After Zoho login, user is redirected back to application
✅ User is created in database with correct role
✅ User is logged in and redirected to appropriate dashboard
✅ Backend logs show complete OAuth flow
✅ Frontend shows user information correctly

---

**Last Updated:** October 21, 2025
**Status:** ✅ Implementation Complete - Ready for Testing
