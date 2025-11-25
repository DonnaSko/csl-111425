# Check Subscription in DigitalOcean Console

## Step 1: Navigate to Backend Directory

In DigitalOcean Console, first navigate to the backend directory:

```bash
cd backend
```

## Step 2: Check Your Subscription

Then run this command:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findUnique({ where: { email: 'donnaskolnick@gmail.com' }, include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } } }).then(async user => { if (user) { console.log('User ID:', user.id); console.log('Email:', user.email); if (user.subscriptions && user.subscriptions.length > 0) { const sub = user.subscriptions[0]; console.log('Subscription Status:', sub.status); console.log('Period End:', sub.currentPeriodEnd); console.log('Is Active:', sub.status === 'active' && new Date(sub.currentPeriodEnd) >= new Date()); } else { console.log('No subscription found'); } } else { console.log('User not found'); } await prisma.\$disconnect(); });"
```

## Step 3: If Subscription is Missing or Expired

If you need to create/update the subscription, run this (still in the `backend` directory):

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findUnique({ where: { email: 'donnaskolnick@gmail.com' } }).then(async user => { if (!user) { console.log('User not found'); await prisma.\$disconnect(); return; } const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 30); const sub = await prisma.subscription.upsert({ where: { userId: user.id }, update: { status: 'active', currentPeriodEnd: futureDate }, create: { userId: user.id, stripeCustomerId: 'cus_manual_' + Date.now(), stripeSubscriptionId: 'sub_manual_' + Date.now(), stripePriceId: 'price_manual', status: 'active', currentPeriodEnd: futureDate } }); console.log('Subscription updated/created:', JSON.stringify(sub, null, 2)); await prisma.\$disconnect(); });"
```

## Alternative: Use npx prisma

If the above doesn't work, try using npx:

```bash
cd backend
npx prisma db execute --stdin <<< "SELECT u.email, s.status, s.\"currentPeriodEnd\" FROM \"csl\".\"User\" u LEFT JOIN \"csl\".\"Subscription\" s ON s.\"userId\" = u.id WHERE u.email = 'donnaskolnick@gmail.com' ORDER BY s.\"createdAt\" DESC LIMIT 1;"
```

