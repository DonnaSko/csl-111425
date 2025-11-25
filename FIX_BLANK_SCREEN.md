# Fix Blank Screen After Hard Refresh

## Immediate Steps to Diagnose

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Click **Console** tab
3. Look for **red error messages**
4. **Copy all errors** and share them

### Step 2: Check Network Tab
1. In DevTools, click **Network** tab
2. Refresh the page
3. Look for **failed requests** (red)
4. Check if API calls are failing

### Step 3: Check What's Loading
1. In DevTools Console, type: `document.getElementById('root')`
2. See if it returns an element or null
3. Check if React is mounting

## Common Causes

### 1. JavaScript Error
- Check Console for errors
- Look for import errors
- Check for undefined variables

### 2. API Connection Failed
- Check Network tab
- Look for failed `/api/` requests
- Verify backend is running

### 3. Authentication Issue
- Token might be invalid
- API might be down
- CORS error

### 4. Build Error
- Frontend build might have failed
- Missing dependencies
- TypeScript errors

## Quick Fixes to Try

### Fix 1: Clear All Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 2: Check if Backend is Running
1. Go to: `https://csl-bjg7z.ondigitalocean.app/api/health`
2. Should return: `{"status":"ok",...}`
3. If it fails, backend is down

### Fix 3: Check Browser Console
- Most important: **Check for JavaScript errors**
- Share the error message

## What I Need

**Please share:**
1. **Browser Console errors** (F12 → Console tab)
2. **Network tab errors** (any failed requests)
3. **What URL you're on** (dashboard, login, etc.)

This will help me fix it quickly!

