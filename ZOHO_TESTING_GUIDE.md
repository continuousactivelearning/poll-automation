# 🧪 Zoho Authentication Testing Guide

## ✅ What Was Fixed

The Zoho OAuth was redirecting to `/login` after authentication instead of the intended dashboard pages. This has been fixed by:

1. **Standardized redirect URL pattern** - Both Google and Zoho now use identical URL structure
2. **Fixed parameter order** - Consistent `?token=...&provider=...&intent=...` format
3. **Updated production environment** - All OAuth credentials configured for deployment

## 🚀 Quick Test Instructions

### Prerequisites
- ✅ Backend running on port 8000
- ✅ Frontend running on port 5174

### Test #1: Create Poll Flow (Should create HOST user)

1. Open browser: http://localhost:5174
2. Click **"Create Poll"** button
3. Click **"Continue with Zoho"** button
4. Sign in with your Zoho account
5. Accept permissions if prompted

**Expected Result:**
- ✅ Redirected to: `/host/create-poll`
- ✅ User logged in with role: `host`
- ✅ User data saved in database

**Browser Console Should Show:**
```
🔍 GoogleAuthCallback mounted, checking URL parameters...
🔍 URL Parameters: {
  token: "eyJhbGc...",
  error: "none",
  intent: "create-poll",
  provider: "zoho"
}
✅ Token found, proceeding with authentication...
✅ Zoho OAuth success for user: your-email@zohomail.in Role: host
🎯 Intent received: create-poll
🎯 Intent: create-poll → Redirecting to /host/create-poll
🚀 Redirecting via window.location to: /host/create-poll
```

### Test #2: Join Poll Flow (Should create STUDENT user)

1. **Important:** Logout first or use incognito/private window
2. Open browser: http://localhost:5174
3. Click **"Join Poll"** button
4. Click **"Continue with Zoho"** button
5. Sign in with a DIFFERENT Zoho account
6. Accept permissions if prompted

**Expected Result:**
- ✅ Redirected to: `/student/join-poll`
- ✅ User logged in with role: `student`
- ✅ User data saved in database

**Browser Console Should Show:**
```
🔍 GoogleAuthCallback mounted, checking URL parameters...
🔍 URL Parameters: {
  token: "eyJhbGc...",
  error: "none",
  intent: "join-poll",
  provider: "zoho"
}
✅ Token found, proceeding with authentication...
✅ Zoho OAuth success for user: student@zohomail.in Role: student
🎯 Intent received: join-poll
🎯 Intent: join-poll → Redirecting to /student/join-poll
🚀 Redirecting via window.location to: /student/join-poll
```

## 🔍 Troubleshooting

### Issue: Redirects to /login after Zoho auth

**Check Browser Console:**
- Look for `❌` emoji indicating errors
- Check if `token` parameter is present
- Verify `intent` parameter is correctly passed

**Check Backend Logs:**
- Should show: `✅ Zoho OAuth success for user: ...`
- Should show: `🔄 Redirecting to frontend callback (Zoho): ...`

**Common Causes:**
1. Token not being passed correctly - check redirect URL in backend logs
2. Profile fetch failing - check `/api/users/profile` endpoint
3. Intent parameter missing - check URL parameters in console

### Issue: "No token received from Zoho OAuth"

**Solution:**
- Check backend logs for OAuth errors
- Verify `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` in `.env`
- Ensure Zoho redirect URI is registered in Zoho Console: http://localhost:8000/oauth/callback

### Issue: "Profile fetch failed"

**Solution:**
- Check if backend is running on port 8000
- Verify JWT token is valid
- Check CORS configuration in backend

## 📊 Backend Logs to Watch

When testing, your backend terminal should show:

```
🎯 Manual Zoho OAuth initiated with intent: create-poll
🌍 Using Zoho accounts domain: https://accounts.zoho.com
🌍 Using Zoho redirect URI: http://localhost:8000/oauth/callback
🔗 Redirecting to Zoho OAuth URL: https://accounts.zoho.com/oauth/v2/auth?...

🔍 Zoho callback received with query params: { code: '...', state: '...' }
🔄 Exchanging authorization code for access token...
🌍 Using Zoho accounts server for token exchange: https://accounts.zoho.com
✅ Token exchange successful
👤 Fetching user info from Zoho...
✅ User info response status: 200
👤 Zoho user info received: { email: 'user@zohomail.in', name: 'User Name' }
🎯 Intent extracted from state: create-poll
✅ New user created via Zoho OAuth: user@zohomail.in Role: host Intent: create-poll
🔄 Redirecting to frontend callback (Zoho): http://localhost:5174/auth/google/callback?token=...&provider=zoho&intent=create-poll
```

## ✅ Success Criteria

- [ ] Create Poll + Zoho Auth → Redirects to `/host/create-poll`
- [ ] Join Poll + Zoho Auth → Redirects to `/student/join-poll`
- [ ] User data saved correctly in MongoDB
- [ ] JWT token generated and stored in localStorage
- [ ] User remains logged in after page refresh
- [ ] Google Auth still works (not broken by changes)

## 🌐 Production Testing

Once local testing passes, test on production:

1. **Backend:** https://automatic-poll-generation-backend.onrender.com
2. **Frontend:** https://automatic-poll-generation-frontend.vercel.app

**Important:** Ensure Zoho Console has production redirect URI registered:
```
https://automatic-poll-generation-backend.onrender.com/oauth/callback
```

## 📝 Database Verification

Check MongoDB to verify user records:

```javascript
// Connect to MongoDB and run:
db.users.find({ zohoId: { $exists: true } }).pretty()
```

**Expected Fields:**
- `zohoId`: Zoho user ID (e.g., "75XXXX")
- `email`: User's Zoho email
- `fullName`: User's display name
- `role`: Either `"host"` or `"student"` (based on intent)
- `isEmailVerified`: `true`
- `createdAt`, `updatedAt`: Timestamps

## 🎯 Key Files Modified

1. **Backend:**
   - `apps/backend/src/web/routes/zoho-root.routes.ts` - Fixed redirect URL
   - `apps/backend/src/web/routes/passport-auth.routes.ts` - Standardized redirect URL
   - `apps/backend/.env.production` - Added OAuth credentials

2. **Frontend:**
   - `apps/frontend/src/pages/GoogleAuthCallback.tsx` - Already handles both providers (no changes needed)

3. **Documentation:**
   - `ZOHO_AUTH_COMPLETE_FIX.md` - Complete fix documentation
   - `ZOHO_TESTING_GUIDE.md` - This file

## 🚨 Critical Notes

1. **Provider Parameter:** Both Google and Zoho now include `provider` parameter in callback URL
2. **URL Pattern:** Format is: `?token=...&provider=...&intent=...`
3. **Intent Preservation:** Intent is preserved through entire OAuth flow
4. **Full Page Reload:** Uses `window.location.href` to ensure AuthContext syncs correctly
5. **No Breaking Changes:** Google Auth still works exactly as before

## 📞 Support

If you encounter issues:

1. Check browser console for detailed logs (look for 🔍, ✅, ❌ emojis)
2. Check backend terminal for OAuth flow logs
3. Verify environment variables are set correctly
4. Ensure Zoho redirect URIs are registered in Zoho Console
5. Check `ZOHO_AUTH_COMPLETE_FIX.md` for comprehensive troubleshooting

---

**Status:** ✅ Ready for Testing
**Date:** October 21, 2025
**Version:** 1.0
