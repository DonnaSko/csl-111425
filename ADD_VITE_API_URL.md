# How to Add VITE_API_URL Environment Variable

## The Problem
Your frontend doesn't have `VITE_API_URL` set, so it's trying to call `http://localhost:3001/api` which doesn't work in production.

## Step-by-Step: Add VITE_API_URL

### Step 1: Go to Environment Variables
1. In DigitalOcean, go to your app
2. Click **Settings** tab
3. Click **Environment Variables** in the left sidebar

### Step 2: Add VITE_API_URL for Frontend
1. Look for your **frontend component** in the environment variables section
2. Click **"Add Variable"** or **"Edit"** (if there are existing variables)
3. Add a new variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://csl-bjg7z.ondigitalocean.app/api` (for now, we'll update this once backend is deployed)
   - **Scope:** Make sure it's scoped to your **frontend component**

### Step 3: Save and Redeploy
1. Click **Save**
2. DigitalOcean will automatically rebuild and redeploy your frontend
3. Wait for deployment to complete

## Important Notes

**For now**, set it to `https://csl-bjg7z.ondigitalocean.app/api` even though the backend isn't there yet. This will:
- Fix the build (so it doesn't default to localhost)
- Once you deploy the backend, you can update this URL

**After you deploy the backend:**
- If backend is on the same domain: Keep it as `https://csl-bjg7z.ondigitalocean.app/api`
- If backend is on a different URL: Change it to `https://YOUR-BACKEND-URL.ondigitalocean.app/api`

## Why This Matters

`VITE_API_URL` is a **build-time** variable. It gets baked into your frontend code when it's built. Without it:
- Frontend defaults to `http://localhost:3001/api`
- This won't work in production
- You'll get connection errors

After adding this variable, the frontend will be rebuilt with the correct API URL.

