# How to Add Backend Component to DigitalOcean

## The Problem
You only have a frontend component deployed. You need to add a backend component for the API to work.

## Step-by-Step: Add Backend Component

### Step 1: Go to Your App
1. Go to https://cloud.digitalocean.com/apps
2. Click on your app

### Step 2: Add a Component
1. Click on the **"Components"** tab (or go to **Settings** → **Components**)
2. Look for a button that says:
   - **"Edit Plan"**
   - **"Add Component"**
   - **"Create Component"**
   - Or a **"+"** button

3. Click it to add a new component

### Step 3: Configure Backend Component

When adding the component, you'll need to set:

**Component Type:**
- Select **"Web Service"** (not Static Site)

**Source:**
- **Source Directory:** `backend`
- **GitHub Branch:** `main` (or your branch name)

**Build Settings:**
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Run Command:** `npm start`
- **HTTP Port:** `3001`

**Environment:**
- Select **Node.js**

### Step 4: Set Environment Variables for Backend

After creating the component, go to **Settings** → **Environment Variables** and add these for the **backend component**:

**Required:**
- `NODE_ENV` = `production`
- `PORT` = `3001`
- `DATABASE_URL` = (your database connection string)
- `JWT_SECRET` = (generate a random secret string)
- `JWT_EXPIRES_IN` = `7d`
- `FRONTEND_URL` = `https://csl-bjg7z.ondigitalocean.app` (your frontend URL)

**For Stripe (if you have it set up):**
- `STRIPE_SECRET_KEY` = (your Stripe secret key)
- `STRIPE_PRICE_ID_MONTHLY` = (your monthly price ID)
- `STRIPE_PRICE_ID_ANNUAL` = (your annual price ID)
- `STRIPE_WEBHOOK_SECRET` = (your webhook secret)

### Step 5: Get Backend URL

After the backend component is deployed:
1. Go to **Components** tab
2. Click on your **backend component**
3. Find the **URL** or **Live App** link
4. That's your backend URL!

### Step 6: Update Frontend VITE_API_URL

1. Go to **Settings** → **Environment Variables**
2. Find `VITE_API_URL` for your **frontend component**
3. Set it to: `https://YOUR-BACKEND-URL.ondigitalocean.app/api`
4. Save - this will trigger a rebuild

## Alternative: Use App Spec File

If you can't find the "Add Component" button, you can use the App Spec file:

1. Go to **Settings** → **App Spec**
2. Click **"Edit"** or **"Download Spec"**
3. Copy the contents from `.do/app.yaml` in this repository
4. **Update the placeholders:**
   - Replace `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` with your actual GitHub repo
   - Replace all `YOUR_*` values with actual values
5. Paste into the spec editor
6. Save - this will deploy both frontend and backend

## Quick Checklist

- [ ] Backend component added (Web Service type)
- [ ] Source directory set to `backend`
- [ ] Build command: `npm install && npx prisma generate && npm run build`
- [ ] Run command: `npm start`
- [ ] HTTP port: `3001`
- [ ] Environment variables set for backend
- [ ] Backend deployed successfully
- [ ] Got backend URL
- [ ] Updated `VITE_API_URL` in frontend to point to backend
- [ ] Frontend redeployed

## Need Help?

If you can't find the "Add Component" button, tell me:
1. What you see in the Components tab
2. What buttons/options are available
3. Screenshot if possible (or describe what you see)

