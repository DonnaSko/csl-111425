# Easy Fix: Fix Your Subscription (No Console Needed!)

## Simple Browser-Based Fix

I've created a special endpoint you can call from your browser to fix your subscription.

### Step 1: Make sure you're logged in
1. Go to: `https://csl-bjg7z.ondigitalocean.app/login`
2. Login with your email and password
3. **Keep this tab open** (you need to be logged in)

### Step 2: Open a new tab
1. Open a **new browser tab**
2. Go to: `https://csl-bjg7z.ondigitalocean.app/api/subscriptions/fix-subscription`
3. You'll see an error (that's normal - we need to use POST)

### Step 3: Use browser console to fix it
1. In the **same tab**, press **F12** (or right-click → Inspect)
2. Click the **Console** tab
3. Paste this code and press Enter:

```javascript
fetch('https://csl-bjg7z.ondigitalocean.app/api/subscriptions/fix-subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Success!', data);
  alert('Subscription fixed! Refresh the page.');
})
.catch(err => {
  console.error('Error:', err);
  alert('Error: ' + err.message);
});
```

### Step 4: Refresh your dashboard
1. Go back to: `https://csl-bjg7z.ondigitalocean.app/dashboard`
2. You should now see your dashboard!

---

## What This Does

This endpoint will:
- Find your user account
- Check if you have a subscription
- Create or update your subscription to be "active" for 30 days
- Set the status to "active"

After running this, your subscription will be recognized and you'll be able to access the dashboard.

