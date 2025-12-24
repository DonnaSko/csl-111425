# 👨‍💼 Admin Script - Quick Reference Guide

## ✅ ADMIN SCRIPT CREATED AND READY!

**Location:** `backend/src/scripts/admin.ts`

---

## 🚀 HOW TO USE

### **Basic Command:**
```bash
cd backend
npm run admin <command> [email]
```

---

## 📋 AVAILABLE COMMANDS

### **1. List All Users**

Shows all users and their subscription status:

```bash
npm run admin list
```

**Output:**
- Email address
- Name
- Company
- Subscription status (✅ active or ❌ inactive)
- Expiration date
- User ID
- Join date

---

### **2. Get User Details**

Get detailed information about a specific user:

```bash
npm run admin info user@example.com
```

**Output:**
- Full user information
- Company details
- Data counts (dealers, trade shows, todos)
- All subscription history
- Stripe subscription IDs

---

### **3. Block User (Revoke Access)**

Block a user immediately - they cannot access the app:

```bash
npm run admin block baduser@example.com
```

**What it does:**
- Sets subscription status to `canceled`
- Sets expiration date to past date (2000-01-01)
- User is **immediately blocked** from app
- **Does NOT delete** any data

**Use when:**
- User violates terms of service
- User uses app illegally
- Temporary suspension needed

---

### **4. Unblock User (Restore Access)**

Restore access for a blocked user (extends 30 days):

```bash
npm run admin unblock user@example.com
```

**What it does:**
- Sets subscription status to `active`
- Extends access for 30 days
- User can **immediately access** app
- **Does NOT affect** their data

**Use when:**
- Resolving disputes
- Lifting temporary suspensions
- Providing courtesy access

---

### **5. Delete User (Permanent)**

**⚠️ WARNING: PERMANENT AND IRREVERSIBLE!**

```bash
npm run admin delete user@example.com
```

**What it does:**
- Shows summary of what will be deleted
- Waits 5 seconds (time to press Ctrl+C to cancel)
- **Permanently deletes:**
  - User account
  - All dealers
  - All trade shows
  - All todos
  - All photos
  - All voice recordings
  - All email files
  - All subscriptions
  - Company (if no other users)

**Use when:**
- User requests account deletion (GDPR)
- Permanent ban required
- Cleaning up test accounts

---

### **6. Help**

Show help message with all commands:

```bash
npm run admin help
```

---

## 💡 EXAMPLES

### **Example 1: Check all users**
```bash
cd backend
npm run admin list
```

### **Example 2: Check specific user**
```bash
npm run admin info donnasko@me.com
```

### **Example 3: Block bad user**
```bash
npm run admin block baduser@example.com
```

### **Example 4: Delete user account**
```bash
npm run admin delete user@example.com
# (Wait 5 seconds or press Ctrl+C to cancel)
```

---

## 🎨 OUTPUT COLORS

The script uses colors to make output easy to read:

- 🔵 **Blue** - Email addresses
- 🟢 **Green** - Active subscriptions, success messages
- 🔴 **Red** - Inactive subscriptions, warnings, errors
- 🟡 **Yellow** - Warnings, waiting messages
- 🔷 **Cyan** - Headers and section titles

---

## 🛡️ SAFETY FEATURES

### **Built-in Safety:**

1. **Email validation** - Checks if user exists before action
2. **Data summary** - Shows what will be deleted before deletion
3. **5-second delay** - Time to cancel delete operations (Ctrl+C)
4. **Clear warnings** - Red warnings for dangerous operations
5. **Confirmation** - Shows results after each action

### **What's Protected:**

- ✅ Cannot delete non-existent users
- ✅ Cannot block users without subscriptions
- ✅ Clear warnings before permanent deletions
- ✅ Database connections properly closed
- ✅ Error handling for all operations

---

## 📊 USE CASES

### **Scenario 1: User Violates Terms**

```bash
# Step 1: Check their account
npm run admin info baduser@example.com

# Step 2: Block their access
npm run admin block baduser@example.com

# Result: User immediately loses access, data preserved
```

---

### **Scenario 2: User Requests Account Deletion (GDPR)**

```bash
# Step 1: Verify the user
npm run admin info user@example.com

# Step 2: Delete account (5 second delay to cancel if needed)
npm run admin delete user@example.com

# Result: User and all data permanently deleted
```

---

### **Scenario 3: Resolve Dispute - Restore Access**

```bash
# Step 1: Check their status
npm run admin info user@example.com

# Step 2: Unblock them
npm run admin unblock user@example.com

# Result: User gets 30 days access, can use app immediately
```

---

### **Scenario 4: Audit All Users**

```bash
# List everyone
npm run admin list

# Review each user's status
# Look for expired subscriptions, suspicious activity, etc.
```

---

## 🔐 SECURITY NOTES

### **Who Can Run This:**

- ✅ **YOU** (developer with server access)
- ❌ Regular users (no access to server)
- ❌ Paid users (no access to backend)
- ❌ Anyone else (requires server SSH or local access)

### **Where to Run:**

**Option 1: Locally** (recommended for development)
```bash
cd /Users/donnaskolnick/Desktop/CSL-\ 11-14-25/backend
npm run admin list
```

**Option 2: On DigitalOcean Server** (production)
```bash
# SSH into server
# Navigate to backend folder
npm run admin list
```

---

## 📝 LOGGING RECOMMENDATIONS

### **Keep a Log of Admin Actions:**

Create a simple log file:

```bash
# Log all admin actions
npm run admin list > admin-logs/users-$(date +%Y%m%d).txt
npm run admin block baduser@example.com | tee -a admin-logs/actions.log
```

**Why:**
- Legal compliance (GDPR, CCPA)
- Audit trail
- Dispute resolution
- Internal records

---

## ⚠️ IMPORTANT REMINDERS

### **Before Blocking Users:**

1. ✅ Document reason for block
2. ✅ Check if refund needed (Stripe dashboard)
3. ✅ Save their data if legal issues involved
4. ✅ Consider if it's temporary or permanent

### **Before Deleting Users:**

1. ⚠️  **CANNOT BE UNDONE!**
2. ✅ Verify it's the correct user
3. ✅ Check for ongoing legal issues
4. ✅ Export their data if needed (GDPR requirement)
5. ✅ Process any refunds first (Stripe)
6. ✅ Wait the full 5 seconds to review

---

## 🎯 QUICK REFERENCE

| Command | Purpose | Reversible? | Data Deleted? |
|---------|---------|-------------|---------------|
| `list` | View all users | N/A | No |
| `info` | View user details | N/A | No |
| `block` | Revoke access | ✅ Yes (use unblock) | No |
| `unblock` | Restore access | ✅ Yes (use block) | No |
| `delete` | Remove user | ❌ **NO** | ✅ Yes (all) |

---

## 💼 LEGAL CONSIDERATIONS

### **GDPR Compliance:**

Users have the right to:
- Request account deletion ("Right to be Forgotten")
- Export their data ("Right to Data Portability")
- Know what data you have ("Right to Access")

**Your admin script helps with deletion, but consider:**
- Exporting user data before deletion
- Keeping deletion logs (date, reason, who authorized)
- Response within 30 days of request

### **Terms of Service:**

Make sure your ToS includes:
- Reasons you can terminate accounts
- What happens to user data on termination
- Refund policy
- Appeal process

---

## ✅ TESTING

The script has been tested and works! You can safely:

1. ✅ List users without affecting them
2. ✅ Get user info without affecting them
3. ✅ Block/unblock users (reversible)
4. ✅ Delete users (5-second safety delay)

**Test with a dummy account first before using on real users!**

---

## 🆘 TROUBLESHOOTING

### **Error: User not found**
- Check email spelling
- User might already be deleted
- Try `npm run admin list` to see all users

### **Error: Database connection failed**
- Check DATABASE_URL environment variable
- Ensure you're running from backend folder
- Check database is accessible

### **Script won't run**
- Make sure you're in the backend folder: `cd backend`
- Run `npm install` to ensure dependencies
- Check Node.js is installed: `node --version`

---

## 🎉 YOU'RE READY!

You now have full administrative control over your users!

**Quick Start:**
```bash
cd backend
npm run admin list        # See all users
npm run admin help        # See all commands
```

**Your app is secure AND you have admin control!** 🔒👨‍💼

