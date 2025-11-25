# Find Your Backend URL (It's Already Deployed!)

## Step 1: Find Backend Component
1. In DigitalOcean, go to your app
2. Click **Components** tab
3. Look for the component that is NOT the frontend
4. It might be named:
   - "backend"
   - "api"
   - "server"
   - Or something similar

## Step 2: Get the Backend URL
1. Click on the **backend component**
2. Look for:
   - A **URL** field
   - A **"Live App"** or **"Visit App"** button
   - Or check the component details/settings

The backend URL will be different from your frontend URL (`https://csl-bjg7z.ondigitalocean.app`)

## Step 3: Update VITE_API_URL
1. Go to **Settings** → **Environment Variables**
2. Find `VITE_API_URL` for your **frontend component**
3. If it doesn't exist, add it
4. Set it to: `https://YOUR-BACKEND-URL.ondigitalocean.app/api`
5. Save and wait for redeploy

## What to Look For
The backend component should show:
- Type: **Web Service** (not Static Site)
- Has a URL that's different from the frontend
- Might show port 3001 or similar

