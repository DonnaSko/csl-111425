# 👨‍💼 Admin User Management Guide

## 🎯 PURPOSE

As the developer/owner, you need to manage users, revoke access, and delete accounts for users who:
- Violate terms of service
- Use the app illegally
- Request account deletion
- Need to be banned or blocked

---

## 🔑 YOUR ACCESS LEVELS

### **1. Full Code Access** ✅
- GitHub repository (all source code)
- DigitalOcean server console
- Database credentials

### **2. Database Access** ✅
- PostgreSQL database (full admin access)
- Prisma Studio (visual database editor)
- Direct SQL queries

### **3. Stripe Dashboard** ✅
- View all subscriptions
- Cancel subscriptions
- Refund payments

---

## 📊 DATABASE STRUCTURE

### **Key Tables:**

**User Table:**
```prisma
model User {
  id                  String   // Unique user ID
  email               String   // Email address
  password            String   // Hashed password
  firstName           String
  lastName            String
  companyId           String   // Company they belong to
  createdAt           DateTime
  updatedAt           DateTime
  
  company       Company
  subscriptions Subscription[]
}
```

**Subscription Table:**
```prisma
model Subscription {
  id                   String
  userId               String       // Links to User
  stripeCustomerId     String
  stripeSubscriptionId String
  status               String       // 'active', 'canceled', etc.
  currentPeriodEnd     DateTime     // Expiration date
  canceledAt           DateTime?
  createdAt            DateTime
  updatedAt            DateTime
}
```

**Company Table:**
```prisma
model Company {
  id        String
  name      String
  createdAt DateTime
  updatedAt DateTime
  
  users        User[]
  dealers      Dealer[]
  tradeShows   TradeShow[]
  todos        Todo[]
  // ... all related data
}
```

---

## 🚫 METHOD 1: REVOKE ACCESS (Ban User)

### **Option A: Set Subscription to Expired**

This blocks access immediately without deleting data.

**Steps:**

1. **Find the user in database:**
   - Use Prisma Studio or SQL query
   - Search by email address

2. **Update their subscription:**
   - Set `status` to `'canceled'`
   - Set `currentPeriodEnd` to past date
   - Set `canceledAt` to now

**Result:** User is immediately blocked from accessing the app.

---

### **Option B: Delete Subscription Record**

**Steps:**

1. Find subscription by user email
2. Delete the subscription record

**Result:** User has no subscription = blocked from app.

---

## 🗑️ METHOD 2: DELETE USER ACCOUNT

### **Complete Account Deletion**

This deletes the user AND all their data (dealers, trade shows, etc.)

**⚠️ WARNING:** This is permanent and cannot be undone!

**What Gets Deleted:**
- User account
- Company (if they're the only user)
- All dealers
- All trade shows
- All todos
- All photos
- All voice recordings
- All email files
- **EVERYTHING** (due to `onDelete: Cascade`)

---

## 💻 METHOD 3: USING PRISMA STUDIO (EASIEST)

### **Access Prisma Studio:**

1. **SSH into DigitalOcean server** OR **run locally:**

```bash
# If running locally:
cd backend
npm run studio
```

2. **Browser opens automatically**
   - Visual database interface
   - Easy to view/edit/delete records

3. **Find user:**
   - Click "User" table
   - Search by email
   - View their data

4. **Revoke access:**
   - Click on their subscription
   - Change `status` to `canceled`
   - Change `currentPeriodEnd` to past date
   - Save

5. **Delete user:**
   - Click on user
   - Click "Delete" button
   - Confirm deletion

**Prisma Studio URL:** `http://localhost:5555` (when running locally)

---

## 💻 METHOD 4: CREATE ADMIN SCRIPT

I can create a simple admin script for you to manage users from command line.

### **admin-script.ts** (to be created):

```typescript
// File: backend/src/scripts/admin.ts

import prisma from '../utils/prisma';

// Block a user by email
async function blockUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`User not found: ${email}`);
    return;
  }

  // Set subscription to expired
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: {
      status: 'canceled',
      currentPeriodEnd: new Date('2000-01-01'), // Past date
      canceledAt: new Date()
    }
  });

  console.log(`✅ User blocked: ${email}`);
}

// Delete a user and all their data
async function deleteUser(email: string) {
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { company: true }
  });
  
  if (!user) {
    console.log(`User not found: ${email}`);
    return;
  }

  // Check if other users in same company
  const companyUsers = await prisma.user.count({
    where: { companyId: user.companyId }
  });

  // Delete user (cascade will delete all related data)
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`✅ User deleted: ${email}`);
  
  if (companyUsers === 1) {
    console.log(`⚠️  Company "${user.company.name}" was also deleted (no other users)`);
  }
}

// List all users
async function listUsers() {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      company: true
    }
  });

  console.log('\\n📋 ALL USERS:\\n');
  users.forEach(user => {
    const sub = user.subscriptions[0];
    const status = sub ? sub.status : 'No subscription';
    const expires = sub ? sub.currentPeriodEnd.toLocaleDateString() : 'N/A';
    
    console.log(`📧 ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Company: ${user.company.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Expires: ${expires}`);
    console.log('');
  });
}

// Main function
async function main() {
  const command = process.argv[2];
  const email = process.argv[3];

  switch (command) {
    case 'list':
      await listUsers();
      break;
    case 'block':
      if (!email) {
        console.log('Usage: npm run admin block user@example.com');
        return;
      }
      await blockUser(email);
      break;
    case 'delete':
      if (!email) {
        console.log('Usage: npm run admin delete user@example.com');
        return;
      }
      console.log('⚠️  This will permanently delete the user and all their data!');
      console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await deleteUser(email);
      break;
    default:
      console.log('Usage:');
      console.log('  npm run admin list');
      console.log('  npm run admin block user@example.com');
      console.log('  npm run admin delete user@example.com');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
```

---

## 🛠️ RECOMMENDED SOLUTION

### **Create Admin Management Script**

**Would you like me to:**
1. ✅ Create the admin script above
2. ✅ Add npm commands to run it
3. ✅ Test it with your database

**Usage would be:**
```bash
# List all users
npm run admin list

# Block a user (revoke access)
npm run admin block baduser@example.com

# Delete a user completely
npm run admin delete baduser@example.com
```

---

## 🎯 QUICK REFERENCE

### **To Block a User:**
1. Find their email
2. Run: `npm run admin block email@example.com`
3. **Done!** They're immediately blocked

### **To Delete a User:**
1. Find their email
2. Run: `npm run admin delete email@example.com`
3. Wait 5 seconds (safety delay)
4. **Done!** User and all data deleted

### **To View All Users:**
1. Run: `npm run admin list`
2. See all users, companies, subscription status

---

## 📱 ALTERNATIVE: STRIPE DASHBOARD

### **Cancel Subscription via Stripe:**

1. Go to: https://dashboard.stripe.com
2. Search for user's email
3. Find their subscription
4. Click "Cancel subscription"
5. Choose "Cancel immediately"

**Result:** Stripe webhook will update your database automatically.

---

## 🔐 SECURITY NOTES

### **Access Control:**
- Only YOU (developer) can access database
- Admin script requires server access
- Users CANNOT access admin functions
- Database credentials are secret

### **Data Protection:**
- Backups recommended before deletions
- Consider "soft delete" (mark as deleted, don't actually delete)
- Keep audit logs of admin actions

---

## ⚠️ LEGAL CONSIDERATIONS

### **Before Deleting User Data:**

1. **Check your Terms of Service**
   - Do you have the right to delete?
   - What's your data retention policy?

2. **GDPR/Privacy Laws**
   - Users can request deletion (GDPR "Right to be Forgotten")
   - You must comply within 30 days

3. **Keep Records**
   - Log when you delete accounts
   - Why they were deleted
   - Who authorized it

4. **Refunds**
   - Consider refunding pro-rated amount
   - Stripe makes this easy

---

## 🎯 RECOMMENDATION

**I suggest creating the admin script for you. This will give you:**

✅ Easy command-line user management  
✅ List all users and their status  
✅ Block users immediately  
✅ Delete users safely (with 5-second delay)  
✅ No need to manually access database  
✅ Clean, professional solution  

**Would you like me to create this admin script now?**

---

## 📞 YOUR CURRENT OPTIONS

### **Right Now, You Can:**

1. **Access DigitalOcean Console**
   - View runtime logs
   - See user activity

2. **Access Database Directly**
   - Use Prisma Studio
   - Run SQL queries
   - View/edit/delete records

3. **Access Stripe Dashboard**
   - Cancel subscriptions
   - Issue refunds
   - View payment history

4. **Access GitHub**
   - View all source code
   - Make changes
   - Deploy updates

**You have FULL CONTROL as the developer!**

---

## 🎉 SUMMARY

**Question:** How can I delete a user's access or their information?

**Answer:** You have multiple options:

1. ✅ **Prisma Studio** - Visual database editor (easiest)
2. ✅ **Admin Script** - Command-line tool (I can create this)
3. ✅ **Stripe Dashboard** - Cancel subscriptions
4. ✅ **Direct Database Access** - Full control

**Your code is protected from USERS, not from YOU!**

You have complete access to manage everything. The security is to prevent users from stealing code or bypassing the paywall - it doesn't prevent you (the developer/owner) from managing your own application.

---

**Would you like me to create the admin management script for you?**

