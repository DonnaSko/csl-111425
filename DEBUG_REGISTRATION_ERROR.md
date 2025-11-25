# Debugging "Registration Failed" Error

## Step 1: Check Browser Console

1. Open your browser's Developer Tools:
   - **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - **Safari**: Enable Developer menu first, then `Cmd+Option+I`
   - **Firefox**: Press `F12`

2. Go to the **Console** tab

3. Try to register again

4. Look for error messages - they will tell you what's wrong:
   - **Network error** = Can't reach backend (API URL wrong or backend down)
   - **CORS error** = Backend not allowing frontend origin
   - **400/500 error** = Backend error (check the error message)

## Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Try to register again
3. Look for the request to `/auth/register`
4. Click on it to see:
   - **Request URL** - Is it going to the right backend?
   - **Status Code** - What error code?
   - **Response** - What error message?

## Step 3: Verify Environment Variables

The most common issue is the `VITE_API_URL` not being set correctly.

### Check in DigitalOcean:

1. Go to your app in DigitalOcean
2. Click **Settings** → **Environment Variables**
3. Find `VITE_API_URL` for your **frontend component**
4. It should be: `https://YOUR-BACKEND-URL.ondigitalocean.app/api`

**Important:** 
- Replace `YOUR-BACKEND-URL` with your actual backend URL
- Must include `/api` at the end
- Must use `https://` (not `http://`)

### Example:
If your backend URL is `https://csl-backend-abc123.ondigitalocean.app`, then:
```
VITE_API_URL=https://csl-backend-abc123.ondigitalocean.app/api
```

## Step 4: Verify Backend is Running

1. In DigitalOcean, check your backend component
2. Make sure it shows **"Running"** status (green)
3. Check the logs for any errors

## Step 5: Test Backend Directly

Test if your backend is working by running this in Terminal (replace with your actual backend URL):

```bash
curl -X POST https://YOUR-BACKEND-URL.ondigitalocean.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Company"
  }'
```

**What to expect:**
- **Success**: Returns JSON with token and user data
- **Error**: Returns error message (this tells you what's wrong)

## Common Issues and Fixes

### Issue 1: "Network Error" or "Cannot connect to server"

**Cause:** `VITE_API_URL` is wrong or not set

**Fix:**
1. Check `VITE_API_URL` in DigitalOcean environment variables
2. Make sure it's your backend URL + `/api`
3. **Important:** After changing environment variables, you must **rebuild and redeploy** the frontend

### Issue 2: CORS Error

**Cause:** Backend doesn't have `FRONTEND_URL` set correctly

**Fix:**
1. In DigitalOcean, go to backend component environment variables
2. Set `FRONTEND_URL` to your frontend URL: `https://YOUR-FRONTEND-URL.ondigitalocean.app`
3. Redeploy backend

### Issue 3: "User already exists"

**Cause:** You're trying to register with an email that's already in the database

**Fix:** Use a different email address

### Issue 4: Database Connection Error

**Cause:** Backend can't connect to database

**Fix:**
1. Check that database is running in DigitalOcean
2. Verify `DATABASE_URL` is set correctly in backend environment variables
3. Check backend logs for database connection errors

### Issue 5: "All fields are required"

**Cause:** One of the form fields is empty

**Fix:** Make sure all fields are filled in

## Quick Checklist

- [ ] Browser console shows specific error (not just "Registration failed")
- [ ] `VITE_API_URL` is set correctly in DigitalOcean
- [ ] Frontend was rebuilt after setting `VITE_API_URL`
- [ ] Backend is running (green status)
- [ ] `FRONTEND_URL` is set in backend environment variables
- [ ] Database is running and connected
- [ ] Tested backend directly with curl (works)

## After Fixing Environment Variables

**Important:** If you change `VITE_API_URL`:
1. The frontend must be **rebuilt** (environment variables are baked into the build)
2. DigitalOcean should do this automatically when you save the env var
3. Wait for the deployment to complete
4. Try again

## Still Stuck?

Share with me:
1. The error message from browser console
2. The Network tab request details (URL, status code, response)
3. Your `VITE_API_URL` value (you can hide the domain if you want)
4. Whether backend is running

