# 👨‍💼 How to Manage Users - Simple Guide

## 🎯 THE EASY WAY (Prisma Studio)

### **Step-by-Step:**

1. **Open Terminal**
2. **Navigate to backend folder:**
   ```bash
   cd /Users/donnaskolnick/Desktop/CSL-\ 11-14-25/backend
   ```

3. **Start Prisma Studio:**
   ```bash
   npm run prisma:studio
   ```

4. **Your browser opens automatically** to `http://localhost:5555`

5. **You'll see a visual database interface!**

---

## 🖱️ USING PRISMA STUDIO

### **To View All Users:**

1. Click "**User**" in the left sidebar
2. You'll see a table with all users
3. See their email, name, company, etc.

### **To Block a User (Revoke Access):**

1. Click "**Subscription**" in the left sidebar
2. Find the user's subscription (search by their Stripe ID or browse)
3. Click on their subscription row
4. Edit these fields:
   - `status` → Change to `"canceled"`
   - `currentPeriodEnd` → Change to a past date (like `2000-01-01`)
   - `canceledAt` → Set to today's date
5. Click "**Save 1 change**" button
6. **Done!** User is now blocked

### **To Delete a User:**

1. Click "**User**" in the left sidebar
2. Find the user (search by email)
3. Click on their row
4. Click the "**Delete**" button at the top
5. Confirm deletion
6. **Done!** User and ALL their data deleted

⚠️ **WARNING:** This permanently deletes:
- User account
- All dealers
- All trade shows
- All todos
- Everything!

---

## 📸 VISUAL GUIDE

### **What Prisma Studio Looks Like:**

```
┌─────────────────────────────────────────────────────┐
│  Prisma Studio                              [x]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Left Sidebar:          Main Area:                  │
│  ┌─────────────┐       ┌──────────────────────┐   │
│  │ > User      │       │  User Table          │   │
│  │ > Company   │       │  ┌────┬──────┬────┐ │   │
│  │ > Subscription│     │  │ id │ email│name│ │   │
│  │ > Dealer    │       │  ├────┼──────┼────┤ │   │
│  │ > TradeShow │       │  │ 1  │user@ │John│ │   │
│  │ > Todo      │       │  │ 2  │test@ │Jane│ │   │
│  └─────────────┘       │  └────┴──────┴────┘ │   │
│                        └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Click any table → See all records → Click a row → Edit or Delete

---

## 🚫 WHY THE COMMAND-LINE SCRIPT DOESN'T WORK

### **The Problem:**

```
Your Computer (Mac)
     ↓ tries to connect
     ↓ 
     ✗ BLOCKED by firewall
     ↓
DigitalOcean Database Server
```

**Your database is protected** - it only accepts connections from your app server, not random computers. **This is GOOD security!**

### **The Solution:**

Prisma Studio is smart enough to work around this using your existing app connection.

---

## 📋 COMPLETE WALKTHROUGH

### **Example: Block a User Named "Bad User"**

**Step 1:** Open Terminal
```bash
cd /Users/donnaskolnick/Desktop/CSL-\ 11-14-25/backend
npm run prisma:studio
```

**Step 2:** Browser opens to Prisma Studio

**Step 3:** Click "**User**" in left sidebar

**Step 4:** Find "baduser@example.com" in the list

**Step 5:** Click on their row → See their details

**Step 6:** Look at the bottom → See their `companyId` (you'll need this)

**Step 7:** Click "**Subscription**" in left sidebar

**Step 8:** Find subscription where `userId` matches the bad user

**Step 9:** Click on that subscription row

**Step 10:** Edit:
- `status` → `"canceled"`
- `currentPeriodEnd` → `"2000-01-01T00:00:00.000Z"`
- `canceledAt` → `"2024-12-24T00:00:00.000Z"` (today)

**Step 11:** Click "**Save 1 change**"

**Step 12:** Done! User blocked!

---

## 🎯 QUICK REFERENCE

### **To Start Prisma Studio:**
```bash
cd /Users/donnaskolnick/Desktop/CSL-\ 11-14-25/backend
npm run prisma:studio
```

### **To Stop Prisma Studio:**
Press `Ctrl+C` in the terminal

### **What You Can Do:**
- ✅ View all users
- ✅ View subscriptions
- ✅ Edit subscription status (block users)
- ✅ Delete users
- ✅ View all dealers, trade shows, etc.
- ✅ Edit any data

---

## ⚠️ IMPORTANT TIPS

### **1. Be Careful with Delete**
- Deleting a user deletes EVERYTHING
- No "undo" button
- Make sure it's the right person!

### **2. Block vs Delete**
- **Block** = User can't access, but data stays
- **Delete** = User AND data gone forever

### **3. Dates Must Be in ISO Format**
When editing dates, use this format:
```
2024-12-24T00:00:00.000Z
```

### **4. Status Must Be Exact**
Subscription status must be one of:
- `"active"`
- `"canceled"`
- `"past_due"`
- `"trialing"`

Use quotes around the value!

---

## 🆘 TROUBLESHOOTING

### **"Can't reach database server"**

This means the database connection isn't working. **Solutions:**

1. **Make sure your app is deployed and running**
   - The database only accepts connections when the app is active
   
2. **Check your .env file**
   - Make sure `DATABASE_URL` is set correctly
   - Should start with `postgresql://`

3. **Try restarting:**
   ```bash
   # Stop Prisma Studio (Ctrl+C)
   # Start again
   npm run prisma:studio
   ```

### **"Prisma Studio won't open"**

1. Make sure you're in the backend folder:
   ```bash
   pwd
   # Should show: /Users/donnaskolnick/Desktop/CSL- 11-14-25/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Try again:
   ```bash
   npm run prisma:studio
   ```

### **"Can't find user"**

- Try searching by email (there's a search box)
- Click the "Filter" button and add conditions
- Check you're looking at the "User" table, not "Subscription"

---

## 🎯 WHEN TO USE THE COMMAND-LINE SCRIPT

The admin script you saw in GitHub (`npm run admin`) is useful **ONLY** when:

1. **You SSH into the DigitalOcean server**
   - You'd need to learn how to SSH
   - Connect to the production server
   - Run commands there

2. **You set up a local database**
   - Create a development database on your computer
   - Not recommended for production management

**For now, use Prisma Studio - it's easier!**

---

## ✅ SUMMARY

### **What You Should Do:**

1. **Use Prisma Studio for managing users**
   ```bash
   cd backend
   npm run prisma:studio
   ```

2. **It's visual and easy to use**
   - Click tables
   - Edit fields
   - Save changes

3. **The command-line script is for advanced use**
   - Requires SSH to server
   - Not needed for most tasks
   - Prisma Studio is easier

---

## 🎉 YOU'RE READY!

**To manage users right now:**
```bash
cd /Users/donnaskolnick/Desktop/CSL-\ 11-14-25/backend
npm run prisma:studio
```

**Then:**
- Click "User" to see all users
- Click "Subscription" to manage subscriptions
- Edit, block, or delete as needed

**It's that simple!** 🎊

