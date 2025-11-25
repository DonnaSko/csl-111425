# How to Fix 404 on /login - DigitalOcean SPA Configuration

## The Problem
DigitalOcean App Platform doesn't automatically know that your React app uses client-side routing. When you go to `/login`, it looks for a file at that path, which doesn't exist.

## Solution: Use App Spec File (Easiest Method)

I've created an App Spec file (`.do/app.yaml`) that will configure everything automatically. Here's how to use it:

### Step 1: Update the App Spec File

1. Open `.do/app.yaml` in this repository
2. Replace these placeholders with your actual values:
   - `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` - Your GitHub repo
   - `YOUR_JWT_SECRET` - Your JWT secret
   - `YOUR_STRIPE_SECRET_KEY` - Your Stripe secret key
   - `YOUR_STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
   - `YOUR_MONTHLY_PRICE_ID` - Your Stripe monthly price ID
   - `YOUR_ANNUAL_PRICE_ID` - Your Stripe annual price ID

### Step 2: Deploy Using App Spec

**Option A: Via DigitalOcean Dashboard (Recommended)**

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **"GitHub"** as your source
4. Choose your repository
5. DigitalOcean should detect the `.do/app.yaml` file automatically
6. Review the configuration
7. Click **"Create Resources"** and deploy

**Option B: Via DigitalOcean CLI**

```bash
# Install doctl if you haven't
brew install doctl

# Login to DigitalOcean
doctl auth init

# Deploy from the app spec
doctl apps create --spec .do/app.yaml
```

### Step 3: Update Existing App (If Already Deployed)

If you already have an app deployed:

1. Go to your app in DigitalOcean dashboard
2. Click **"Settings"** tab
3. Scroll down to **"App Spec"** section
4. Click **"Edit"** or **"Download Spec"**
5. Copy the contents of `.do/app.yaml` into the spec editor
6. Update the placeholder values
7. Click **"Save Changes"**
8. DigitalOcean will redeploy with the new configuration

## Alternative: Manual Configuration via Dashboard

If you prefer to configure manually without the spec file:

### For Static Site Component:

1. Go to https://cloud.digitalocean.com/apps
2. Click on your app
3. Click **"Settings"** tab
4. Click **"Components"** in the left sidebar
5. Find your **frontend component** and click on it
6. Look for these settings:

   **If it's a Static Site:**
   - Find **"Error Document"** or **"Catchall Document"** field
   - Set it to: `index.html`
   - Find **"Index Document"** field
   - Set it to: `index.html`
   - Save changes

   **If it's a Web Service:**
   - Change it to use the `server.js` file I created
   - Set **Run Command** to: `node server.js`
   - Set **HTTP Port** to: `5173` (or set PORT env var)

### The Key Settings:

The critical setting is **"Catchall Document"** or **"Error Document"** - this tells DigitalOcean to serve `index.html` for any route that doesn't match a file, which allows React Router to handle the routing.

## What the App Spec Does

The app spec file I created includes this critical configuration:

```yaml
static_sites:
  - name: frontend
    catchall_document: index.html  # ← This is the magic!
    error_document: index.html     # ← This too!
    index_document: index.html
```

This tells DigitalOcean: "For any route that doesn't match a file, serve `index.html` instead."

## Verify It's Working

After deploying:

1. Go to `https://your-app.ondigitalocean.app/login` - should work (no 404)
2. Go to `https://your-app.ondigitalocean.app/register` - should work (no 404)
3. Try navigating between pages - should all work
4. Test login functionality

## Still Having Issues?

If you're still getting 404s:

1. **Check the component type**: Make sure your frontend is configured as a "Static Site" component, not a "Web Service"
2. **Check build output**: Verify that `dist/index.html` exists after build
3. **Check routes**: In the component settings, make sure there's a route configured for `/`
4. **Try the Web Service approach**: Switch to using `server.js` as a web service instead

## Quick Test

To test if the backend is working (separate from the routing issue):

```bash
curl -X POST https://your-backend.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

If this returns a response (even an error about invalid credentials), your backend is working and the issue is purely frontend routing.

