# 👨‍💼 Manage Users via Stripe Dashboard - Quick Guide

## ✅ THE SMART WAY TO MANAGE USERS

**Use Stripe Dashboard** to manage subscriptions and block users - it's easy, safe, and automatic!

---

## 🚀 QUICK START

**Login:** https://dashboard.stripe.com

**What You Can Do:**
- ✅ View all customers and subscriptions
- ✅ Cancel subscriptions (blocks user access)
- ✅ Issue refunds
- ✅ View payment history
- ✅ Search by email or name
- ✅ See subscription status

---

## 🚫 HOW TO BLOCK A USER

### **Step-by-Step:**

1. **Go to Stripe Dashboard**
   - https://dashboard.stripe.com

2. **Search for the user**
   - Use the search bar at the top
   - Type their email address
   - Press Enter

3. **Click on their customer profile**
   - You'll see their name and email
   - See their subscription(s)

4. **Find their active subscription**
   - Look for status: "Active"
   - Click on the subscription

5. **Cancel the subscription**
   - Click the "..." menu (three dots) in top right
   - Select "Cancel subscription"
   - Choose "Cancel immediately" (not "at period end")
   - Click "Cancel subscription" to confirm

6. **Done! User is blocked**
   - Stripe sends webhook to your app
   - Your database updates automatically
   - User loses access immediately

---

## 💰 HOW TO ISSUE A REFUND

Sometimes you want to refund a user (and block them):

1. **Find the user** (steps above)

2. **Go to their payments**
   - Click "Payments" tab on their profile
   - Find the payment to refund

3. **Click the payment**

4. **Click "Refund payment"**
   - Choose full or partial refund
   - Add a reason (optional)
   - Click "Refund"

5. **Then cancel their subscription** (steps above)

---

## 📊 VIEW ALL CUSTOMERS

**To see everyone who's paid:**

1. Go to **Customers** section (left sidebar)
2. See list of all customers
3. Filter by:
   - Active subscriptions
   - Canceled subscriptions
   - Specific date range
4. Export to CSV if needed

---

## 🔍 SEARCH FOR A USER

**Quick search:**
- Type email in search bar at top
- Or type name
- Or type subscription ID

**Advanced search:**
- Go to Customers
- Use filters:
  - Subscription status
  - Created date
  - Amount spent
  - etc.

---

## 📋 CHECK SUBSCRIPTION STATUS

**To see if a user has active subscription:**

1. Search for their email
2. Click on their profile
3. Look at "Subscriptions" section:
   - **Active** = They can access app ✅
   - **Canceled** = They're blocked ❌
   - **Past due** = Payment failed ⚠️
   - **Trialing** = Free trial period

---

## ⏰ WHAT HAPPENS AFTER YOU CANCEL

### **Immediate Effects:**

1. **Stripe marks subscription as "Canceled"**
2. **Stripe sends webhook to your app**
3. **Your app updates database:**
   - Sets `status` to "canceled"
   - Records `canceledAt` date
4. **User tries to access app:**
   - Backend checks subscription
   - Sees it's canceled
   - Returns 403 Forbidden
   - Frontend redirects to subscription page
5. **User is blocked!** ✅

**Happens in seconds!**

---

## 🎯 COMMON SCENARIOS

### **Scenario 1: User Violates Terms**

```
1. Search for user in Stripe
2. Cancel subscription immediately
3. Optionally: Add note explaining why
4. User is blocked instantly
5. Keep their data (in case of dispute)
```

---

### **Scenario 2: User Requests Refund**

```
1. Search for user in Stripe
2. Go to their payment
3. Issue full or partial refund
4. Cancel subscription
5. User gets refund and loses access
```

---

### **Scenario 3: Billing Issue**

```
1. Search for user
2. Check payment status
3. If payment failed:
   - Stripe will retry automatically
   - Or you can send them link to update card
4. If they don't fix it:
   - Subscription auto-cancels after retries fail
```

---

## 💡 PRO TIPS

### **Tip 1: Add Notes**
When canceling, add a note explaining why:
- Helps you remember later
- Useful for customer service
- Good for disputes

### **Tip 2: Check Before Canceling**
Make sure it's the right person:
- Verify email
- Check subscription dates
- Review payment history

### **Tip 3: Consider Partial Refunds**
If user paid for a year but only used 1 month:
- Cancel subscription
- Refund 11 months pro-rated

### **Tip 4: Export Data**
Export customer list monthly:
- Good for records
- Useful for accounting
- Backup in case needed

### **Tip 5: Monitor Webhooks**
Check webhook logs to ensure:
- Cancellations sync to your app
- No failed webhooks
- Database stays updated

---

## 🛡️ SAFETY FEATURES

### **Stripe Protects You:**

1. **Audit logs** - Every action is recorded
2. **Undo option** - Can reactivate canceled subscriptions
3. **Dispute protection** - Stripe handles chargebacks
4. **Fraud detection** - Automatic fraud screening
5. **Secure** - PCI compliant, encrypted

### **Your App Protects Users:**

1. **Webhook verification** - Only accepts real Stripe webhooks
2. **Instant blocking** - No delay when subscription canceled
3. **Data preserved** - Canceling doesn't delete their data
4. **Can reactivate** - User can resubscribe anytime

---

## 🔗 USEFUL STRIPE LINKS

**Dashboard:**
- Main: https://dashboard.stripe.com
- Customers: https://dashboard.stripe.com/customers
- Subscriptions: https://dashboard.stripe.com/subscriptions
- Payments: https://dashboard.stripe.com/payments
- Webhooks: https://dashboard.stripe.com/webhooks

**Help:**
- Stripe Docs: https://stripe.com/docs
- Support: https://support.stripe.com

---

## ❓ FAQ

### **Q: How long until user is blocked after I cancel?**
**A:** Immediately! Usually within seconds. Your webhook receives the cancellation and updates the database instantly.

---

### **Q: Can I undo a cancellation?**
**A:** Yes! In Stripe, you can reactivate a subscription. Or the user can resubscribe with a new subscription.

---

### **Q: Will canceling delete their data?**
**A:** No! Canceling only blocks access. Their dealers, trade shows, etc. remain in your database. To delete data, you'd need the admin script or database access.

---

### **Q: What if I cancel by mistake?**
**A:** Reactivate it immediately in Stripe, or have the user resubscribe. No data is lost.

---

### **Q: Can users see I canceled them?**
**A:** They'll see they can't access the app anymore. They'll be redirected to the subscription page. They can check their Stripe receipts to see subscription was canceled.

---

### **Q: Should I refund when I cancel?**
**A:** Depends on your policy:
- Violation of terms → No refund
- Your mistake → Full refund
- User requests → Pro-rated refund
- Billing error → Case by case

---

## ✅ SUMMARY

### **To Block a User:**
1. Login to Stripe Dashboard
2. Search for user's email
3. Cancel their subscription immediately
4. Done! They're blocked instantly

### **Why This Works:**
- Stripe sends webhook to your app
- Your app updates database
- User's next request is blocked
- Simple, safe, automatic

### **Benefits:**
- ✅ Easy to use
- ✅ No database access needed
- ✅ Audit trail built-in
- ✅ Can issue refunds
- ✅ Instant blocking
- ✅ Secure and safe

---

**For 99% of admin tasks, Stripe Dashboard is all you need!** 🎉

---

**Need to delete user data completely?** That's when you'd use the admin script or direct database access (for GDPR requests, etc.)

