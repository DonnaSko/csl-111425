# Frontend Routing 404 Fix

## Problem
Getting 404 errors when accessing routes directly (e.g., `/login`, `/register`) on DigitalOcean.

## Root Cause
React Router uses client-side routing. When you navigate directly to `/login`, the server tries to find a file at that path, which doesn't exist. The server needs to serve `index.html` for all routes so React Router can handle the routing.

## Solutions

### Solution 1: DigitalOcean App Platform Static Site Configuration (Recommended)

If your frontend is deployed as a **Static Site** on DigitalOcean:

1. Go to your DigitalOcean App Platform dashboard
2. Select your app
3. Go to **Settings** → **App-Level Settings**
4. Find **Routes** or **Routing** section
5. Add a catch-all route:
   - **Path**: `/*`
   - **Component**: Your static site component
   - **Rewrite**: Enable "Rewrite all routes to index.html" or similar option

OR

1. Go to **Settings** → **Components**
2. Select your frontend component
3. Look for **Routes** or **Static Site** settings
4. Enable "Single Page Application (SPA)" mode or "Catch-all routing"

### Solution 2: Use Web Service Instead of Static Site

If Solution 1 doesn't work, deploy the frontend as a **Web Service**:

1. Update `frontend/package.json` to include express:
   ```json
   "dependencies": {
     "express": "^4.18.2"
   }
   ```

2. In DigitalOcean App Platform:
   - Change frontend component type from "Static Site" to "Web Service"
   - Set build command: `npm run build`
   - Set run command: `node server.js`
   - Set HTTP port: `5173` (or whatever PORT env var is set)

3. The `server.js` file I created will handle SPA routing automatically.

### Solution 3: Verify Environment Variables

Make sure `VITE_API_URL` is set correctly in DigitalOcean:

1. Go to your app settings
2. Navigate to **Environment Variables**
3. For the frontend component, ensure:
   ```
   VITE_API_URL=https://your-backend-url.ondigitalocean.app/api
   ```
   (Replace with your actual backend URL)

### Solution 4: Manual Verification

To test if the backend is working:

1. Test registration endpoint:
   ```bash
   curl -X POST https://your-backend.ondigitalocean.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "test123",
       "firstName": "Test",
       "lastName": "User",
       "companyName": "Test Company"
     }'
   ```

2. Test login endpoint:
   ```bash
   curl -X POST https://your-backend.ondigitalocean.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "test123"
     }'
   ```

## Files Created/Modified

1. ✅ `frontend/public/_redirects` - Netlify-style redirects (may not work on DigitalOcean)
2. ✅ `frontend/nginx.conf` - Nginx configuration (if using custom nginx)
3. ✅ `frontend/.htaccess` - Apache configuration (if using Apache)
4. ✅ `frontend/server.js` - Express server for SPA routing (fallback solution)
5. ✅ `frontend/src/services/api.ts` - Verified API configuration

## Next Steps

1. **Immediate**: Configure SPA routing in DigitalOcean dashboard (Solution 1)
2. **If that fails**: Switch to Web Service deployment (Solution 2)
3. **Verify**: Test login and registration after fixing routing
4. **Check**: Ensure `VITE_API_URL` environment variable is set correctly

## Testing Checklist

- [ ] Can access `/login` directly without 404
- [ ] Can access `/register` directly without 404
- [ ] Can navigate between pages using React Router
- [ ] Login form submits successfully
- [ ] Registration form submits successfully
- [ ] API calls are going to correct backend URL
- [ ] No CORS errors in browser console

