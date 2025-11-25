# How to Find Your Backend URL

## The Problem
Your `VITE_API_URL` is pointing to `https://csl-bjg7z.ondigitalocean.app/api`, which appears to be your **frontend** URL, not your backend URL.

## How to Find Your Backend URL

### Method 1: Check DigitalOcean Dashboard

1. Go to https://cloud.digitalocean.com/apps
2. Click on your app
3. Look at the **Components** section
4. You should see multiple components:
   - **Frontend component** - This is your React app
   - **Backend component** - This is your Node.js API server

5. Click on the **Backend component**
6. Look for the **URL** or **Live App** link
7. That's your backend URL!

### Method 2: Check App Settings

1. In your app, go to **Settings** → **Components**
2. Find the component that has:
   - Type: **Web Service**
   - Run Command: `npm start` or similar
   - HTTP Port: `3001` or similar
3. That component's URL is your backend URL

### Method 3: Check Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Look at the **backend component** environment variables
3. The backend URL might be referenced there

## What Your URLs Should Look Like

Typically in DigitalOcean, you'll have:

- **Frontend URL**: `https://csl-bjg7z.ondigitalocean.app` (or similar)
- **Backend URL**: Usually one of these:
  - `https://csl-backend-xxxxx.ondigitalocean.app`
  - `https://csl-bjg7z.ondigitalocean.app` (if backend is on same domain with different path)
  - A different subdomain entirely

## How to Fix

Once you find your backend URL:

1. Go to **Settings** → **Environment Variables**
2. Find `VITE_API_URL` for your **frontend component**
3. Set it to: `https://YOUR-BACKEND-URL.ondigitalocean.app/api`
4. **Save** - this will trigger a rebuild
5. Wait for deployment to complete
6. Test registration again

## Quick Test

To verify which URL is your backend, try accessing:

- `https://csl-bjg7z.ondigitalocean.app/api/health` - Should return `{"status":"ok"}` if it's the backend
- `https://csl-bjg7z.ondigitalocean.app/health` - Should return `{"status":"ok"}` if it's the backend

If neither works, that confirms it's the frontend, not the backend.

