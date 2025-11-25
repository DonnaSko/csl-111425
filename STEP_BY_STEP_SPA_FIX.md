# Step-by-Step: Fix 404 on /login Page in DigitalOcean

## The Easiest Way: Use the Dashboard (No Code Changes Needed)

### Step 1: Log into DigitalOcean
1. Go to https://cloud.digitalocean.com
2. Log in to your account

### Step 2: Navigate to Your App
1. Click on **"Apps"** in the left sidebar
2. Click on your app (the one that's giving 404 errors)

### Step 3: Go to Settings
1. Click on the **"Settings"** tab at the top
2. You should see several sections in the left sidebar

### Step 4: Find "Custom Pages" Section
1. In the left sidebar under Settings, look for **"Custom Pages"** or **"Pages"**
2. If you don't see it, look for **"Components"** instead (see Step 5)

### Step 5: If You See "Components" Instead
1. Click on **"Components"** in the left sidebar
2. You'll see a list of your components (backend, frontend, etc.)
3. **Click on your frontend component** (it might be named "frontend", "csl-frontend", or similar)
4. Scroll down to find **"Custom Pages"** or **"Error Pages"** section

### Step 6: Configure Catch-All Page
Look for one of these fields and set it to `index.html`:

- **"Catch-all Document"** → Set to: `index.html`
- **"Error Document"** → Set to: `index.html`  
- **"404 Page"** → Set to: `index.html`
- **"Catch-all Page"** → Set to: `index.html`

**The key is:** Any route that doesn't match a file should serve `index.html`

### Step 7: Save and Redeploy
1. Click **"Save"** or **"Save Changes"**
2. DigitalOcean will automatically redeploy your app
3. Wait for the deployment to complete (you'll see a green checkmark)

### Step 8: Test It
1. Once deployed, go to: `https://your-app.ondigitalocean.app/login`
2. It should work now! (No more 404)

---

## Alternative: If You Can't Find "Custom Pages"

If you don't see a "Custom Pages" section, try this:

### Option A: Switch to Web Service (Uses the server.js I created)

1. In **Settings** → **Components**
2. Click on your **frontend component**
3. Look for **"Edit"** or **"Change Type"** button
4. Change the component type from **"Static Site"** to **"Web Service"**
5. Update these settings:
   - **Run Command**: `node server.js`
   - **HTTP Port**: `5173` (or leave blank if using PORT env var)
6. Make sure **Build Command** is: `npm install && npm run build`
7. Make sure **Output Directory** is: `dist`
8. Save and redeploy

### Option B: Use App Spec File

1. I've created a file called `.do/app.yaml` in your repository
2. In DigitalOcean dashboard, go to **Settings** → **App Spec**
3. Click **"Edit"** or **"Download Spec"**
4. Copy the contents from `.do/app.yaml` (update the placeholder values first)
5. Paste it into the spec editor
6. Save - this will redeploy with proper SPA configuration

---

## Visual Guide - What to Look For

When you're in the frontend component settings, you should see something like:

```
Component: frontend
Type: Static Site
Source Directory: /frontend
Build Command: npm install && npm run build
Output Directory: dist

Custom Pages:
  Index Document: index.html
  Error Document: [THIS SHOULD BE index.html] ← Set this!
  Catch-all Document: [THIS SHOULD BE index.html] ← Set this!
```

---

## Still Can't Find It?

If you're still having trouble:

1. **Take a screenshot** of your Settings page and I can help identify where it is
2. **Check the component type**: Make sure your frontend is a "Static Site", not a "Web Service"
3. **Try the Web Service approach**: Use the `server.js` file I created (Option A above)

---

## Quick Test After Fix

Once you've made the change and it's redeployed:

✅ Go to `/login` - should work  
✅ Go to `/register` - should work  
✅ Refresh any page - should work  
✅ Login should work  
✅ Registration should work  

---

## Why This Happens

React Router uses **client-side routing**. When you go to `/login`, your browser asks the server for a file at that path. The server doesn't have a file called `login`, so it returns 404. 

By setting the "Catch-all Document" to `index.html`, you're telling the server: "If you can't find the file, just serve `index.html` instead." Then React Router takes over and shows the correct page.

This is a very common issue with SPAs, and DigitalOcean has a setting specifically for it - you just need to find it in the dashboard!

