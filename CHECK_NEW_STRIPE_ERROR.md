# Check New Stripe Error

## Step 1: Check Backend Logs Again

1. In DigitalOcean, go to your app
2. Click **"Runtime Logs"** tab
3. Scroll to the bottom (most recent entries)
4. Look for the latest "Checkout session error" message
5. What's the NEW error message?

## Common New Errors After Adding API Key

### Error 1: Missing Price IDs
- Error: "Invalid price" or "No such price"
- Fix: Add STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_ANNUAL

### Error 2: Wrong Price ID Format
- Error: "Invalid price ID"
- Fix: Make sure price IDs start with `price_`

### Error 3: Price ID Doesn't Match API Key
- Error: "This price belongs to a different account"
- Fix: Make sure you're using live price IDs with live API key

### Error 4: Missing FRONTEND_URL
- Error: Checkout session can't redirect
- Fix: Set FRONTEND_URL to `https://csl-bjg7z.ondigitalocean.app`

## What to Share

**What's the NEW error message in the Runtime Logs?**

This will tell us exactly what's missing or wrong.

