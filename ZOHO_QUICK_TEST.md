# Quick Test Guide for Zoho OAuth

## Step 1: Verify Configuration

1. **Start your backend server:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Test configuration endpoint:**
   Open in browser or use curl:
   ```bash
   curl http://localhost:8000/api/test/zoho-config
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "✅ All Zoho OAuth configuration variables are set",
     "checks": {
       "zoho_client_id": { "status": true, "valid": true },
       "zoho_client_secret": { "status": true },
       "zoho_accounts_domain": { "status": true, "valid": true }
       // ... more checks
     },
     "recommendations": [
       "✅ All configuration looks good! Try the OAuth flow."
     ]
   }
   ```

   **If you see errors**, follow the recommendations in the response.

## Step 2: Verify Zoho App Settings

1. Go to: https://api-console.zoho.com/
2. Select your OAuth client app
3. **Check these settings:**
   - ✅ Client ID matches your `.env` file
   - ✅ Client Secret matches your `.env` file
   - ✅ Authorized Redirect URIs includes: `http://localhost:8000/oauth/callback`
   - ✅ Scope `AaaServer.profile.READ` is enabled
   - ✅ Client Status is "Active" or "Published"

## Step 3: Test OAuth URL Generation

Get the OAuth authorization URL:
```bash
curl http://localhost:8000/api/test/zoho-oauth-url?intent=join-poll
```

**Response will include:**
```json
{
  "success": true,
  "authorization_url": "https://accounts.zoho.com/oauth/v2/auth?...",
  "instructions": [
    "1. Copy the authorization_url above",
    "2. Paste it in your browser",
    ...
  ]
}
```

## Step 4: Test Full OAuth Flow

### Option A: Via Frontend (Recommended)

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd apps/backend
   npm run dev

   # Terminal 2 - Frontend
   cd apps/frontend
   pnpm run dev
   ```

2. **Test the flow:**
   - Open: http://localhost:5174/login
   - Click "Continue with Zoho"
   - Log in with your Zoho account
   - You should be redirected back and logged in

3. **Watch the logs:**
   - **Backend console** should show:
     ```
     🎯 Manual Zoho OAuth initiated with intent: default
     🌍 Using Zoho accounts domain: https://accounts.zoho.com
     🔗 Redirecting to Zoho OAuth URL: ...
     ```
   
   After you log in and Zoho redirects back:
     ```
     🔍 Zoho callback received with query params: { code: '...', ... }
     🔄 Exchanging authorization code for access token...
     ✅ Token exchange successful
     👤 Zoho user info received: { email: '...', name: '...' }
     ✅ New user created via Zoho OAuth: email@example.com
     🔄 Redirecting to frontend callback: ...
     ```

   - **Browser console** should show:
     ```
     🎯 Starting Zoho OAuth with intent: default
     ```
   
   After redirect:
     ```
     ✅ Zoho OAuth success for user: email@example.com Role: student
     🔄 Navigating to intended path: /student
     ```

### Option B: Direct URL Test (Advanced)

1. **Get the OAuth URL:**
   ```bash
   curl http://localhost:8000/api/test/zoho-oauth-url
   ```

2. **Copy the `authorization_url` from the response**

3. **Paste it in your browser and press Enter**

4. **Log in with Zoho**

5. **You'll be redirected to:** `http://localhost:8000/oauth/callback?code=...`

6. **Backend will process and redirect to:** `http://localhost:5174/auth/google/callback?token=...&provider=zoho`

## Common Issues and Solutions

### Issue 1: "redirect_uri_mismatch"

**Problem:** Redirect URI in Zoho app doesn't match the callback URL

**Solution:**
1. Go to https://api-console.zoho.com/
2. Edit your OAuth client
3. In "Authorized Redirect URIs", add:
   - `http://localhost:8000/oauth/callback` (for development)
   - `https://your-backend-domain.com/oauth/callback` (for production)
4. Save and retry

### Issue 2: "invalid_client"

**Problem:** Client ID or Secret is wrong, OR domain mismatch

**Solution:**
1. Verify `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` in `.env`
2. Check `ZOHO_ACCOUNTS_DOMAIN` matches your Zoho account region:
   - If your Zoho account is in India: `https://accounts.zoho.in`
   - If your Zoho account is global/US: `https://accounts.zoho.com`
   - If your Zoho account is in Europe: `https://accounts.zoho.eu`
3. Update `.env` and restart server

### Issue 3: "No email provided by Zoho"

**Problem:** User info request is failing

**Solution:**
1. Check `AaaServer.profile.READ` scope is enabled in Zoho app
2. Verify token exchange was successful in backend logs
3. Ensure `ZOHO_ACCOUNTS_DOMAIN` is correct

### Issue 4: Backend shows "Failed to configure Passport Zoho Strategy"

**Problem:** Missing environment variables

**Solution:**
1. Check all required variables are in `.env`:
   ```env
   ZOHO_CLIENT_ID=1000.GUII83KI33WW7JA90NOAZC4BMOW07X
   ZOHO_CLIENT_SECRET=your_secret_here
   ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com
   ZOHO_REDIRECT_URI_LOCAL=http://localhost:8000/oauth/callback
   ZOHO_REDIRECT_URI_PROD=https://your-domain.com/oauth/callback
   ```
2. Restart backend server

## Verification Checklist

Before testing, ensure:
- [ ] Backend server is running on port 8000
- [ ] Frontend server is running on port 5174
- [ ] `/api/test/zoho-config` returns `"success": true`
- [ ] Zoho app has correct redirect URIs configured
- [ ] `ZOHO_ACCOUNTS_DOMAIN` matches your Zoho account region
- [ ] MongoDB is connected (for user creation)

## Success Indicators

✅ **Backend startup logs show:**
```
✅ Passport Google Strategy configured successfully
✅ Passport Zoho Strategy configured successfully
🧪 Test routes enabled at /api/test/zoho-config and /api/test/zoho-oauth-url
```

✅ **OAuth flow completes:**
```
🎯 Manual Zoho OAuth initiated
🔍 Zoho callback received
✅ Token exchange successful
👤 Zoho user info received
✅ New user created via Zoho OAuth
🔄 Redirecting to frontend callback
```

✅ **Frontend:**
- User is logged in
- Redirected to appropriate dashboard based on role
- User info visible in UI

## Need Help?

If you're still having issues:
1. Check backend console for error messages
2. Check browser console for frontend errors
3. Verify Zoho app is "Active" (not in test mode)
4. Try using Google OAuth - if it works, the issue is Zoho-specific configuration
5. Share the exact error message and logs
