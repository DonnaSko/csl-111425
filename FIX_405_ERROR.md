# Fixing 405 Method Not Allowed Error

## What 405 Means
The server found the route, but the HTTP method (GET, POST, etc.) is not allowed for that route.

## Most Likely Cause
The request is going to the wrong URL. Check what URL is actually being called.

## Step 1: Check the Actual Request URL

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Try to register again
4. Find the request (might be called `register` or `auth/register`)
5. Click on it
6. Look at the **Request URL** - what does it say?

**It should be:**
- `https://YOUR-BACKEND-URL.ondigitalocean.app/api/auth/register` (with POST method)

**Common wrong URLs:**
- `https://YOUR-BACKEND-URL.ondigitalocean.app/auth/register` (missing /api)
- `https://YOUR-FRONTEND-URL.ondigitalocean.app/api/auth/register` (wrong domain - going to frontend instead of backend)

## Step 2: Check VITE_API_URL

The `VITE_API_URL` environment variable must point to your **backend**, not your frontend.

1. In DigitalOcean, go to your app
2. Settings → Environment Variables
3. Find `VITE_API_URL` for the **frontend component**
4. It should be: `https://YOUR-BACKEND-URL.ondigitalocean.app/api`

**Important:** 
- Must be your **backend** URL (not frontend)
- Must end with `/api`
- After changing, frontend must be **rebuilt** (redeploy)

## Step 3: Verify Backend Routes

The backend should have the route at `/api/auth/register` with POST method. This is already configured correctly in the code.

## Quick Test

Test the backend directly with curl (replace with your actual backend URL):

```bash
curl -X POST https://YOUR-BACKEND-URL.ondigitalocean.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Company"
  }'
```

**Expected results:**
- **Success (201)**: Returns token and user data
- **405 Error**: Route exists but method wrong (unlikely with POST)
- **404 Error**: Route doesn't exist
- **500 Error**: Server error (database, etc.)

## Common Issues

### Issue 1: VITE_API_URL Points to Frontend
**Symptom:** Request goes to frontend URL instead of backend
**Fix:** Set `VITE_API_URL` to your backend URL + `/api`

### Issue 2: Missing /api in URL
**Symptom:** Request goes to `/auth/register` instead of `/api/auth/register`
**Fix:** Make sure `VITE_API_URL` ends with `/api`

### Issue 3: Frontend Not Rebuilt After Changing VITE_API_URL
**Symptom:** Still using old URL even after changing env var
**Fix:** Redeploy frontend after changing environment variables

## What to Share

To help debug, share:
1. The **Request URL** from Network tab
2. Your `VITE_API_URL` value (you can hide the domain)
3. Your backend URL
4. Result of the curl test above

