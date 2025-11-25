# Fix "Failed to create checkout session" Error

## The Problem
Registration works! ✅ But Stripe checkout is failing.

## Step 1: Check Backend Logs for the Actual Error

1. In DigitalOcean, go to your app
2. Click **"Runtime Logs"** tab
3. Look for recent errors (red text)
4. Look for "Checkout session error" messages
5. What's the actual error message?

## Step 2: Check Environment Variables

The subscription code needs these environment variables set in your **backend component**:

1. Go to **Settings** → **Environment Variables**
2. Find your **backend component** variables
3. Check if these are set:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_PRICE_ID_MONTHLY` - Monthly plan price ID
   - `STRIPE_PRICE_ID_ANNUAL` - Annual plan price ID
   - `FRONTEND_URL` - Should be `https://csl-bjg7z.ondigitalocean.app`

## Common Issues

### Issue 1: Missing STRIPE_SECRET_KEY
- Error: "Stripe API key not set"
- Fix: Add your Stripe secret key

### Issue 2: Missing Price IDs
- Error: "Invalid price ID"
- Fix: Add STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_ANNUAL

### Issue 3: Wrong FRONTEND_URL
- Error: Checkout session can't redirect
- Fix: Set FRONTEND_URL to your frontend URL

## Quick Check

**What do you see in the Runtime Logs?** 
- Look for the actual error message
- It will tell you exactly what's missing

Share the error message and I'll help fix it!

