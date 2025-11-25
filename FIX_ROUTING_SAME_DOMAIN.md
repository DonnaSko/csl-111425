# Fix Routing When Backend and Frontend Share Same Domain

## The Problem
Both backend and frontend are on `https://csl-bjg7z.ondigitalocean.app`, but `/api/*` requests are going to the frontend (static site) instead of the backend.

## Solution: Configure Routes in DigitalOcean

### Step 1: Check Backend Component Routes
1. Go to your app → **Components** tab
2. Click on the **backend component**
3. Look for **"Routes"** or **"HTTP Routes"** section
4. The backend should have a route for `/api` or `/api/*`

### Step 2: Configure Backend Routes
The backend component needs:
- **Route:** `/api` or `/api/*`
- This tells DigitalOcean to send all `/api/*` requests to the backend

### Step 3: Configure Frontend Routes  
The frontend component should have:
- **Route:** `/` (catch-all for everything else)
- This handles all non-API requests

### Step 4: Update VITE_API_URL
Since they're on the same domain:
- Set `VITE_API_URL` to: `https://csl-bjg7z.ondigitalocean.app/api`
- This should already be set, but verify it

## If Routes Can't Be Changed in UI

You may need to use the App Spec file:

1. Go to **Settings** → **App Spec**
2. Click **"Edit"**
3. Make sure the backend component has:
   ```yaml
   routes:
     - path: /api
   ```
4. And frontend has:
   ```yaml
   routes:
     - path: /
   ```
5. Save and redeploy

## Verify It's Working

After fixing routes, test:
```bash
curl https://csl-bjg7z.ondigitalocean.app/api/health
```

Should return: `{"status":"ok"}` (not HTML)

