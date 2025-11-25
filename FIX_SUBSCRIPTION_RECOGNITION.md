# Fix Subscription Not Recognized

## The Problem
You're logged in but being redirected to the payment page. This means your subscription isn't being recognized as active.

## Step 1: Check Your Subscription in Database

In DigitalOcean Console, run this to check your subscription:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findUnique({ where: { email: 'donnaskolnick@gmail.com' }, include: { subscriptions: true } }).then(user => { console.log('User:', user?.email); console.log('Subscriptions:', JSON.stringify(user?.subscriptions, null, 2)); prisma.\$disconnect(); });"
```

This will show:
- Your user ID
- All subscriptions linked to your account
- Their status and dates

## Step 2: Check if Subscription is Active

The subscription must have:
- `status === 'active'`
- `currentPeriodEnd >= today`

## Step 3: Fix if Needed

If subscription is missing or expired, create/update it:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findUnique({ where: { email: 'donnaskolnick@gmail.com' } }).then(async user => { if (!user) { console.log('User not found'); prisma.\$disconnect(); return; } const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 30); const sub = await prisma.subscription.upsert({ where: { userId: user.id }, update: { status: 'active', currentPeriodEnd: futureDate }, create: { userId: user.id, stripeCustomerId: 'cus_manual_' + Date.now(), stripeSubscriptionId: 'sub_manual_' + Date.now(), stripePriceId: 'price_manual', status: 'active', currentPeriodEnd: futureDate } }); console.log('Subscription:', JSON.stringify(sub, null, 2)); prisma.\$disconnect(); });"
```

## Step 4: Test Again

After running the fix:
1. Refresh your browser
2. Go to: `https://csl-bjg7z.ondigitalocean.app/dashboard`
3. You should see the dashboard

## Quick Check

Run Step 1 first to see what's in the database, then we can fix it.

