# Run Database Migrations - URGENT

## The Problem
Database tables don't exist. The error shows: `The table csl.User does not exist`

## Quick Fix: Run Migrations in DigitalOcean

### Option 1: Update Run Command (Recommended)

1. Go to your app in DigitalOcean
2. Click **Components** → **backend component**
3. Find **"Run Command"** or **"Start Command"**
4. Change it to:
   ```
   npx prisma migrate deploy && npm start
   ```
5. Save and redeploy

This will:
- Run migrations to create all tables
- Then start the server

### Option 2: Use Console/Terminal (If Available)

1. In DigitalOcean, go to your backend component
2. Look for **"Console"** or **"Terminal"** option
3. Run:
   ```bash
   npx prisma migrate deploy
   ```
4. This creates all the tables

### Option 3: Create Migration First (If Needed)

If migrations don't exist yet, you may need to create them. But since you're in production, `prisma migrate deploy` should work if the schema is correct.

## After Running Migrations

1. Check backend logs - you should see migration output
2. Tables should be created
3. Test registration again - it should work!

## What I Changed

I updated `backend/package.json` to run migrations on start:
```json
"start": "prisma migrate deploy && node dist/index.js"
```

But you need to:
1. Commit and push this change to git
2. OR update the run command in DigitalOcean directly

## Quick Test After Migrations

Once migrations run, test:
```bash
curl -X POST https://csl-bjg7z.ondigitalocean.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","companyName":"Test Co"}'
```

Should return a token and user data (not an error)!

