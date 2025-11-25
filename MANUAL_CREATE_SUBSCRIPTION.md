# Manually Create Subscription Record

## The Problem
You paid for a subscription, but the webhook wasn't set up at the time, so the subscription record wasn't created in your database.

## Solution: Create it manually using DigitalOcean Console

### Step 1: Get Your User ID

1. In DigitalOcean, go to your app → **Console** tab
2. Select **backend component**
3. Type this command to find your user ID:
   ```bash
   npx prisma studio
   ```
   OR use this simpler command:
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => { console.log(JSON.stringify(users, null, 2)); prisma.\$disconnect(); });"
   ```

### Step 2: Create Subscription Record

Once you have your user ID, run this command (replace `YOUR_USER_ID` with the actual ID):

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.subscription.create({
  data: {
    userId: 'YOUR_USER_ID',
    stripeCustomerId: 'cus_TU66IB5KFSdHAp',
    stripeSubscriptionId: 'sub_1SX7uLFKdUzwA7MkQhg17kCf',
    stripePriceId: 'price_1SUXZ1FKdUzwA7Mk9xZFBcj3',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false
  }
}).then(sub => {
  console.log('Subscription created:', sub);
  prisma.\$disconnect();
}).catch(err => {
  console.error('Error:', err);
  prisma.\$disconnect();
});
"
```

## Alternative: Use Prisma Studio (Easier)

1. In DigitalOcean Console, run: `npx prisma studio`
2. This opens a web interface
3. Go to the Subscription table
4. Click "Add record"
5. Fill in the fields with your Stripe details

