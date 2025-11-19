# DigitalOcean App Platform Setup Guide

This guide will help you fix the "files don't exist" error and properly configure your app on DigitalOcean App Platform.

## Issues Fixed

1. ✅ Updated backend build script to generate Prisma client
2. ✅ Created `.do/app.yaml` configuration file
3. ✅ Updated start script to run database migrations
4. ✅ Fixed `.gitignore` to allow Prisma migrations

## Before Deploying

### 1. Create Initial Database Migration

You need to create an initial Prisma migration before deploying:

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create the migration files
- Apply them to your local database (if you have one)
- Generate the Prisma client

**Important:** Commit the migration files to git:
```bash
git add backend/prisma/migrations/
git commit -m "Add initial database migration"
git push
```

### 2. Push Updated Files to GitHub

The following files have been updated/created:
- `backend/package.json` - Updated build and start scripts
- `.do/app.yaml` - App Platform configuration
- `.gitignore` - Fixed to allow migrations

Push these changes:
```bash
git add .
git commit -m "Fix App Platform configuration"
git push
```

## App Platform Configuration

### Option 1: Use the `.do/app.yaml` file (Recommended)

1. In DigitalOcean App Platform, when creating/editing your app:
   - **IMPORTANT:** At the top of the setup page, look for "How do you want to configure your app?"
   - Select **"App Spec"** (not "GitHub" or "Dockerfile")
   - Connect your GitHub account and select the repository
   - The `.do/app.yaml` file will be automatically detected from your repo
   - This will configure both backend and frontend services automatically

2. The configuration includes:
   - Backend service on port 3001
   - Frontend static site
   - All required environment variables (set as secrets)

### Option 2: Manual Configuration (If App Spec doesn't work)

If you need to configure manually using GitHub source:

1. When you see "No components detected", click **"Edit Plan"** or **"Add Component"**
2. Add two components:

#### Backend Service:
- **Type:** Web Service
- **Source Directory:** `backend` ← **This is important!**
- **Build Command:** `npm install && npm run build`
- **Run Command:** `npm start`
- **HTTP Port:** `3001`
- **Environment:** Node.js

#### Frontend Service:
- **Type:** Static Site
- **Source Directory:** `frontend` ← **This is important!**
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Environment:** Static Site

**Note:** The "Source directories" field at the top is for the entire app. You need to add individual components and specify their source directories in each component's settings.

## Required Environment Variables

Set these in App Platform (as secrets):

### Backend:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - A random secret string (generate one)
- `JWT_EXPIRES_IN` - `7d` (or your preference)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PRICE_ID_MONTHLY` - Monthly plan price ID
- `STRIPE_PRICE_ID_ANNUAL` - Annual plan price ID
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (set after first deploy)
- `FRONTEND_URL` - Your frontend URL (e.g., `https://your-app.ondigitalocean.app`)
- `NODE_ENV` - `production`
- `PORT` - `3001`

### Frontend:
- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.ondigitalocean.app/api`)

## Common Issues and Solutions

### Issue: "Files don't exist" or "Cannot find module"

**Solution:**
1. Make sure you've pushed all files to GitHub
2. Verify the source directory is correct (`backend` for backend, `frontend` for frontend)
3. Check that `package.json` files exist in both directories
4. Ensure the build command runs successfully

### Issue: "Prisma Client not generated"

**Solution:**
- The build script now includes `prisma generate`
- Make sure `DATABASE_URL` is set (even if migrations haven't run yet)
- Check that `prisma/schema.prisma` exists

### Issue: "Database connection failed"

**Solution:**
1. Create a PostgreSQL database in DigitalOcean
2. Add it as a resource to your app (this auto-sets `DATABASE_URL`)
3. Or manually set `DATABASE_URL` environment variable
4. Make sure migrations have run (they run automatically on start)

### Issue: "Build fails"

**Solution:**
1. Check the build logs in App Platform
2. Verify all dependencies are in `package.json`
3. Make sure Node.js version is compatible (18+)
4. Check that TypeScript compiles without errors locally first

## Testing Locally First

Before deploying, test the build locally:

```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend (in another terminal)
cd frontend
npm install
npm run build
```

If these work locally, they should work on App Platform.

## Deployment Steps

1. ✅ Create initial Prisma migration
2. ✅ Commit and push all changes to GitHub
3. ✅ Create PostgreSQL database in DigitalOcean
4. ✅ Create App Platform app
5. ✅ Connect GitHub repository
6. ✅ Configure services (or use app.yaml)
7. ✅ Set environment variables
8. ✅ Add database as resource
9. ✅ Deploy
10. ✅ Configure Stripe webhooks
11. ✅ Test the application

## Need Help?

If you're still having issues:
1. Check the build logs in App Platform dashboard
2. Verify all files are in the correct directories
3. Make sure environment variables are set correctly
4. Check that the database is accessible

