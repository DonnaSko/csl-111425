# How to Find Error Logs in DigitalOcean

## Method 1: Deployment Logs (For Build/Deploy Errors)

1. Go to https://cloud.digitalocean.com/apps
2. Click on your app
3. Click the **"Activity"** tab (or **"Deployments"** tab)
4. You'll see a list of deployments
5. Click on the **failed deployment** (it will show "Failed" status)
6. You'll see tabs like:
   - **"Build Logs"** - Shows build errors
   - **"Deploy Logs"** - Shows deployment errors
   - **"Runtime Logs"** - Shows server errors after deployment

7. Click on **"Build Logs"** first - scroll to the bottom to see the error

## Method 2: Component Logs (For Runtime Errors)

1. Go to your app
2. Click **"Components"** tab
3. Click on the **backend component**
4. Look for:
   - **"Runtime Logs"** tab
   - **"Logs"** tab
   - Or a **"View Logs"** button

5. This shows what's happening while the server is running

## Method 3: App-Level Logs

1. Go to your app
2. Click **"Logs"** in the left sidebar (if available)
3. This shows all logs from all components

## What to Look For

In the logs, look for:
- **Red text** = Errors
- **"Error:"** or **"Failed:"** messages
- **Stack traces** (long error messages with file paths)
- The **last few lines** usually contain the actual error

## Quick Navigation

**For deployment/build errors:**
App → Activity/Deployments → [Failed Deployment] → Build Logs

**For runtime/server errors:**
App → Components → [Backend Component] → Runtime Logs

## Screenshot Locations

If you can't find it, look for these buttons/links:
- "View Logs"
- "Build Logs"
- "Deploy Logs"
- "Runtime Logs"
- "Activity"
- "Deployments"

