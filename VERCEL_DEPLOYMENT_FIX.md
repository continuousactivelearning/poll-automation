# Vercel Deployment Update Guide

## Current Issue
The frontend deployed to Vercel with URL: `https://automatic-poll-generation-frontend-g7cx6q6zg.vercel.app`
But the backend CORS is configured with: `https://automatic-poll-generation-frontend.vercel.app/`

## Required Fix in Render Dashboard

1. Go to your Render dashboard
2. Navigate to the backend service: `automatic-poll-generation-backend`
3. Go to "Environment" tab
4. Update the following environment variable:

**FRONTEND_URL**: Change from `https://automatic-poll-generation-frontend.vercel.app/` 
to `https://automatic-poll-generation-frontend-g7cx6q6zg.vercel.app`

Note: Remove the trailing slash and use the actual Vercel deployment URL

## Vercel Configuration Updated

The `vercel.json` has been updated with:
- Proper SPA routing using filesystem handler + fallback to index.html
- All required environment variables for production
- Correct build configuration for monorepo structure

## After Making These Changes

1. Redeploy the backend on Render (or it will auto-deploy after env var change)
2. Test the authentication flow at your Vercel URL
3. Verify CORS errors are resolved
4. Check that login/register pages load correctly (no more 404s)

## Expected Result
- Frontend accessible at: `https://automatic-poll-generation-frontend-g7cx6q6zg.vercel.app`
- No more 404 errors on login/register pages
- CORS properly configured between frontend and backend
- JWT authentication working end-to-end