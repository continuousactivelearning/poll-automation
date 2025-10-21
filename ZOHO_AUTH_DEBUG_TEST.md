# 🔬 Zoho Auth Debug Test - Zoho Email vs Google Email

## 📋 Test Scenario

**Problem:** Zoho OAuth works with Google email but fails with Zoho-specific email (@zohomail.in)

**Symptoms:**
- ✅ Click "Continue with Zoho" → Select Google icon → Works correctly
- ❌ Click "Continue with Zoho" → Use Zoho email (@zohomail.in) → Redirects to `/login`

## 🧪 Test Instructions

### Test 1: Zoho OAuth with Zoho Email (CURRENTLY FAILING)

1. **Open Backend Terminal** - Watch for logs starting with 🔍, ✅, ❌

2. **Open Frontend** in browser: http://localhost:5174

3. **Open Browser Console** (F12) and keep it open

4. **Click "Create Poll"** button

5. **Click "Continue with Zoho"** button

6. **Sign in with ZOHO-SPECIFIC email** (e.g., `user@zohomail.in`)

7. **Accept permissions** when prompted:
   ```
   POLLGEN would like to access the following information:
   - Accounts
   - Read your basic profile information
   
   [Accept] [Reject]
   ```
   Click **[Accept]**

8. **WATCH WHAT HAPPENS:**
   - Expected: Redirect to `/host/create-poll`
   - Actual: Redirects to `/login`

9. **COPY ALL LOGS:**
   - Backend terminal logs (everything with 🔍, ✅, ❌)
   - Browser console logs (everything from GoogleAuthCallback)

### Test 2: Zoho OAuth with Google Email (CURRENTLY WORKING)

1. **Logout or use incognito window**

2. **Open Backend Terminal** - Watch for logs

3. **Open Frontend**: http://localhost:5174

4. **Click "Join Poll"** button

5. **Click "Continue with Zoho"** button

6. **On Zoho login page, click the GOOGLE ICON**

7. **Sign in with your GOOGLE account**

8. **Accept permissions**

9. **WATCH WHAT HAPPENS:**
   - Expected: Redirect to `/student/join-poll`
   - Actual: Should work correctly (this is the working case)

10. **COPY ALL LOGS** for comparison

## 📊 Expected Backend Logs (Success Case)

```
🔍 ===== ZOHO OAUTH CALLBACK STARTED =====
🔍 Full URL: /oauth/callback?code=...&state=...
🔍 Query params: {
  "code": "1000.xxx...",
  "state": "eyJpbnRlbnQiOiJjcmVhdGUtcG9sbCJ9",
  "accounts-server": "https://accounts.zoho.com"
}
🔍 Extracted values: { code: 'EXISTS', state: 'eyJpbnRlbnQi...', error: undefined }
🔄 Exchanging authorization code for access token...
🌍 Using Zoho accounts server for token exchange: https://accounts.zoho.com
🔗 Token exchange URL: https://accounts.zoho.com/oauth/v2/token
✅ Token exchange successful
🔍 Token response: {
  "access_token": "1000.xxx...",
  "refresh_token": "1000.yyy...",
  "expires_in": 3600,
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer"
}
🎟️ Access token length: 150
👤 Fetching user info from Zoho...
🔍 Making request to Zoho user info API with token...
🔗 Request URL: https://accounts.zoho.com/oauth/user/info
🔑 Authorization header: Zoho-oauthtoken [TOKEN_HIDDEN]
✅ User info response status: 200
👤 Zoho user info received: { email: 'user@zohomail.in', name: 'User Name' }
🎯 Intent extracted from state: create-poll
✅ New user created via Zoho OAuth: user@zohomail.in Role: host Intent: create-poll
🎟️ Generating JWT token for user: user@zohomail.in
✅ JWT token generated, length: 200
🔄 ===== ZOHO CALLBACK SUCCESS =====
🔄 Frontend URL: http://localhost:5174
🔄 Full redirect URL: http://localhost:5174/auth/google/callback?token=eyJhbGc...&provider=zoho&intent=create-poll
🔄 Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M...
🔄 Provider: zoho
🔄 Intent: create-poll
🔄 User: user@zohomail.in Role: host
🔄 ===== REDIRECTING TO FRONTEND =====
```

## 📊 Expected Frontend Logs (Success Case)

```
🔍 GoogleAuthCallback mounted, checking URL parameters...
🔍 Full URL: http://localhost:5174/auth/google/callback?token=eyJhbGc...&provider=zoho&intent=create-poll
🔍 URL Parameters: {
  token: "eyJhbGciOiJIUzI1NiIs...",
  error: "none",
  intent: "create-poll",
  provider: "zoho"
}
🔍 Token present: true
✅ Token found, proceeding with authentication...
✅ Zoho OAuth success for user: user@zohomail.in Role: host
🎯 Intent received: create-poll
💾 Saved to localStorage - token: eyJhbGc... user: user@zohomail.in
🔄 Updated AuthContext with user data
🎯 Intent: create-poll → Redirecting to /host/create-poll
🔄 Final redirect path: /host/create-poll
🚀 Redirecting via window.location to: /host/create-poll
```

## ❌ Expected Backend Logs (Failure Case)

Look for any of these error patterns:

```
❌ ===== ZOHO OAuth CALLBACK ERROR =====
❌ Error message: ...
❌ Zoho API Error Response: {...}
❌ Zoho API Error Status: 401 / 400 / 500
```

OR

```
❌ No authorization code received from Zoho
```

OR

```
❌ Zoho OAuth error: access_denied
```

## ❌ Expected Frontend Logs (Failure Case)

Look for:

```
❌ No token received from Zoho OAuth
```

OR

```
❌ Failed to fetch user profile: 401 Unauthorized
```

OR

```
❌ Profile fetch error: NetworkError
```

## 🔍 What to Check

### 1. Backend Logs Analysis

**If token exchange fails:**
- Check `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` in `.env`
- Check if `accounts-server` parameter matches the domain
- Look for API error codes (401, 400, 403)

**If user info fetch fails:**
- Check if access token is present and valid
- Check authorization header format
- Look for scope permission errors

**If user creation/update fails:**
- Check MongoDB connection
- Check user model validation errors

### 2. Frontend Logs Analysis

**If "No token received":**
- Backend didn't redirect with token
- Check backend error logs for why redirect failed

**If "Profile fetch failed":**
- Token is invalid or expired
- `/api/users/profile` endpoint is failing
- Check if JWT_SECRET matches between token generation and validation

**If "Connection error":**
- Backend server not running
- CORS issue
- Network connectivity problem

### 3. URL Analysis

**Check the callback URL structure:**

Correct format:
```
http://localhost:5174/auth/google/callback?token=eyJhbGc...&provider=zoho&intent=create-poll
```

Missing parameters would indicate backend redirect issue.

## 📝 Information to Collect

Please provide:

1. **Backend Terminal Output** - Everything from the moment you click "Continue with Zoho" until redirect happens

2. **Browser Console Output** - All logs from GoogleAuthCallback component

3. **Network Tab** - Check the following requests:
   - Initial redirect to Zoho: `https://accounts.zoho.com/oauth/v2/auth?...`
   - Callback to backend: `http://localhost:8000/oauth/callback?code=...`
   - Redirect to frontend: `http://localhost:5174/auth/google/callback?token=...`
   - Profile fetch: `http://localhost:8000/api/users/profile` (with Authorization header)

4. **Final URL** - What URL does the browser end up on?
   - Success: `/host/create-poll` or `/student/join-poll`
   - Failure: `/login` or `/login?error=...`

5. **Zoho Email Used** - What email address did you use? (e.g., `user@zohomail.in`)

6. **Browser Used** - Chrome / Firefox / Safari / Edge

## 🎯 Test Checklist

- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:5174
- [ ] Browser console open (F12)
- [ ] Backend terminal visible
- [ ] Test 1: Zoho OAuth with Zoho email - COLLECT LOGS
- [ ] Test 2: Zoho OAuth with Google email - COLLECT LOGS
- [ ] Compare logs between working and failing cases
- [ ] Share all logs in the chat

## 💡 Quick Diagnostic Commands

Check backend is working:
```bash
curl http://localhost:8000/api/test/zoho-config
```

Check frontend is working:
```bash
curl http://localhost:5174
```

Check Zoho OAuth URL generation:
```bash
curl "http://localhost:8000/api/test/zoho-oauth-url?intent=create-poll"
```

---

**After you test, please share:**
1. Complete backend logs (from start to finish of one OAuth attempt)
2. Complete browser console logs
3. Final URL where browser lands
4. Any error messages you see

This will help me identify the exact point of failure and fix it!
