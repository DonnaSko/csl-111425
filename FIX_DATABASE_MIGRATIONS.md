# Fix Database Migrations - Tables Don't Exist

## The Problem
The database tables don't exist. Error: `The table csl.User does not exist in the current database.`

## Solution: Run Migrations

I've updated the `start` script to automatically run migrations before starting the server.

### Step 1: Create Initial Migration (If Not Already Done)

You need to create the initial migration. Do this locally first:

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create migration files in `backend/prisma/migrations/`
- Apply them to your local database (if you have one)

**Important:** Commit these migration files to git:
```bash
git add backend/prisma/migrations/
git commit -m "Add initial database migration"
git push
```

### Step 2: Update DigitalOcean Run Command

In DigitalOcean:

1. Go to your app → **Components** tab
2. Click on the **backend component**
3. Find **"Run Command"** or **"Start Command"**
4. Change it from: `npm start`
5. To: `npm start` (it should now automatically run migrations)

OR if that doesn't work, change it to:
```
prisma migrate deploy && npm start
```

### Step 3: Redeploy Backend

After updating the run command:
1. Save the changes
2. DigitalOcean will redeploy the backend
3. Check the logs - you should see migration output
4. Then the server should start

### Step 4: Verify

After deployment, check the logs. You should see:
- Migration output (creating tables)
- "Server running on port 8080"
- No more "table does not exist" errors

Then test registration again!

## Alternative: Run Migrations Manually

If you can't update the run command, you can run migrations manually:

1. In DigitalOcean, go to your backend component
2. Find **"Console"** or **"Terminal"** option
3. Run: `npx prisma migrate deploy`
4. This will create all the tables

## What Migrations Do

Migrations create the database schema (tables) based on your Prisma schema. Without them, the tables don't exist, so the app can't work.

