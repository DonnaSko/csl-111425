# Fix Blank Screen After Payment

## The Problem
After paying, Stripe redirects you but you see a blank screen.

## Step 1: Check FRONTEND_URL Environment Variable

The backend needs `FRONTEND_URL` set correctly for the redirect to work.

1. In DigitalOcean, go to Settings → Environment Variables
2. Find `FRONTEND_URL` for your **backend component**
3. It should be: `https://csl-bjg7z.ondigitalocean.app`
4. If it's wrong or missing, update it and save

## Step 2: Check the URL You're Redirected To

After payment, what URL are you on?
- Should be: `https://csl-bjg7z.ondigitalocean.app/subscription/success?session_id=...`
- If it's different, that's the problem

## Step 3: Manual Redirect

If you're stuck on a blank screen:
1. Go directly to: `https://csl-bjg7z.ondigitalocean.app/dashboard`
2. Your subscription should be active

## Quick Fix

**What URL do you see in your browser after payment?** Share it and I'll help fix it.

