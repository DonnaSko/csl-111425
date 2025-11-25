# Debug Subscription Status

## The Problem
After login, you're being redirected to the subscription page even though you have an active subscription.

## Step 1: Check Subscription in Database

In DigitalOcean Console, run this to check your subscription:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.subscription.findMany({ where: { userId: 'cmidlif5j0001hbowsdpf0gh6' }, include: { user: { select: { email: true } } } }).then(subs => { console.log(JSON.stringify(subs, null, 2)); prisma.\$disconnect(); });"
```

This will show:
- If the subscription exists
- The status
- The currentPeriodEnd date
- If it's linked to the right user

## Step 2: Check the Date

The subscription check requires:
- status === 'active'
- currentPeriodEnd >= today

If currentPeriodEnd is in the past, it will fail.

## Step 3: Check Browser Console

1. Login to your app
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Look for errors about subscription status
5. Check Network tab - look for the `/subscriptions/status` request
6. What does it return?

Share what you see and I'll help fix it!

