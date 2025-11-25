# Fix: Subscription Paid But Not Recognized

## The Problem
You paid successfully, but the app doesn't recognize your subscription. This means the Stripe webhook didn't create the subscription record in your database.

## Step 1: Check if Webhook is Configured in Stripe

1. Go to https://dashboard.stripe.com
2. Click "Developers" → "Webhooks"
3. Do you see a webhook endpoint configured?
4. If yes, what's the endpoint URL?
5. If no, you need to create one

## Step 2: Create Webhook (If Not Exists)

1. In Stripe, go to "Developers" → "Webhooks"
2. Click "+ Add endpoint"
3. Endpoint URL should be: `https://csl-bjg7z.ondigitalocean.app/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)

## Step 3: Add Webhook Secret to DigitalOcean

1. In DigitalOcean, go to Settings → Environment Variables
2. For your **backend component**, add:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: The signing secret you copied (starts with `whsec_`)
3. Save

## Step 4: Test Webhook

After setting up the webhook, you can:
1. Go to the webhook in Stripe
2. Click "Send test webhook" to test it
3. Or wait for the next payment event

## Quick Check

**Do you have a webhook configured in Stripe?** If not, that's why your subscription isn't being recognized.

