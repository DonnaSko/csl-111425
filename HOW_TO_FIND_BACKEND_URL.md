# How to Find Your Backend URL in DigitalOcean

## Method 1: Check Components Tab

1. Go to https://cloud.digitalocean.com/apps
2. Click on your app
3. Click **"Components"** tab
4. You'll see a list of components (frontend, backend, etc.)
5. **Click on the backend component** (the one that's NOT the frontend)
6. Look for:
   - A **URL** field showing the backend URL
   - A **"Live App"** or **"Visit App"** button/link
   - In the component details, there should be a URL displayed

## Method 2: Check App Settings

1. Go to your app → **Settings** tab
2. Look at **"App-Level Settings"** or **"Components"**
3. The backend component should list its URL there

## Method 3: Check Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Look for variables that might reference the backend URL
3. Check if there's a `PUBLIC_URL` or similar for the backend component

## What to Look For

The backend URL will typically be:
- A different subdomain: `https://csl-backend-xxxxx.ondigitalocean.app`
- Or the same domain with different routing: `https://csl-bjg7z.ondigitalocean.app` (but routes configured differently)

## Once You Find It

Share the backend URL with me, and I'll tell you exactly what to set `VITE_API_URL` to.

