# Testing Guide - Verify App Works After Security Changes

## ✅ Security Changes Made (Should NOT Affect App Functionality)

1. **Removed GitHub token from git config** - Only affects git operations, not app runtime
2. **Updated .gitignore** - Only affects what gets committed, not app runtime  
3. **Created security checklist** - Just documentation, doesn't affect app

**These changes should NOT break anything in the app.**

## 🧪 Testing Options

### Option 1: Test Production App (Easiest)

Your app is already deployed at: `https://csl-bjg7z.ondigitalocean.app`

**Quick Test Steps:**
1. Open https://csl-bjg7z.ondigitalocean.app in your browser
2. Log in with your credentials
3. Test key features (see checklist below)

### Option 2: Test Locally

**Prerequisites:**
- Node.js installed
- PostgreSQL database running
- Environment variables configured

**Start Backend:**
```bash
cd backend
npm install  # Only needed if dependencies changed
npm run dev
```
Backend should start on: http://localhost:3001

**Start Frontend (new terminal):**
```bash
cd frontend
npm install  # Only needed if dependencies changed
npm run dev
```
Frontend should start on: http://localhost:5173

## 📋 Testing Checklist

### 1. Authentication Tests ✓

- [ ] **Login**
  - Go to login page
  - Enter email and password
  - Should successfully log in
  - Should redirect to dashboard

- [ ] **Registration** (if testing new account)
  - Go to registration page
  - Fill in all fields
  - Should create account successfully
  - Should redirect to subscription page

- [ ] **Logout**
  - Click logout
  - Should clear session
  - Should redirect to login

### 2. Subscription Tests ✓

- [ ] **View Subscription Page**
  - Should show pricing options
  - Should show current subscription status (if subscribed)

- [ ] **Subscribe** (if not subscribed)
  - Select Monthly or Annual plan
  - Use test card: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVC: Any 3 digits
  - Should successfully subscribe
  - Should redirect to dashboard

### 3. Dashboard Tests ✓

- [ ] **View Dashboard**
  - Should load without errors
  - Should show statistics
  - Should show navigation menu

- [ ] **Navigation**
  - Click "Dealers" - should navigate
  - Click "Trade Shows" - should navigate
  - Click "Reports" - should navigate
  - Click "To-Dos" - should navigate

### 4. Dealer Management Tests ✓

- [ ] **View Dealers List**
  - Go to Dealers page
  - Should show list of dealers
  - Should show search/filter options

- [ ] **Search Dealers**
  - Enter search term
  - Should filter results

- [ ] **View Dealer Details**
  - Click on a dealer
  - Should show dealer detail page
  - Should show all dealer information

- [ ] **Add Note to Dealer**
  - Go to dealer detail page
  - Add a note
  - Should save successfully
  - Should appear in notes section

### 5. Email Tests ✓

- [ ] **View Email Section**
  - Go to dealer detail page
  - Scroll to "Emails" section
  - Should show email form

- [ ] **Send Email** (if files uploaded)
  - Select files to attach (if available)
  - Enter subject and message
  - Click "Send Email"
  - Should show success message
  - Check console for any errors

### 6. File Upload Tests ✓

- [ ] **Upload Email Files** (from Dashboard)
  - Go to Dashboard
  - Upload a file (PDF or JPG)
  - Should upload successfully
  - Should appear in file list

### 7. Basic Functionality Tests ✓

- [ ] **No Console Errors**
  - Open browser DevTools (F12)
  - Go to Console tab
  - Navigate through app
  - Should see NO red errors

- [ ] **API Calls Work**
  - Open browser DevTools (F12)
  - Go to Network tab
  - Navigate through app
  - API calls should return 200 (not 401/403/500)

- [ ] **Data Persists**
  - Add a note
  - Refresh page
  - Note should still be there

## 🔍 What to Look For

### ✅ Success Indicators:
- Pages load without errors
- No console errors (red messages)
- API calls return 200 status
- Data saves and persists
- Navigation works smoothly
- Forms submit successfully

### ❌ Failure Indicators:
- Blank white screen
- Console errors (especially 401, 403, 500)
- "Network Error" messages
- Data not saving
- Pages not loading
- Infinite loading spinners

## 🐛 If Something Doesn't Work

### Check Browser Console:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Share error messages

### Check Backend Logs:
If testing locally, check backend terminal for errors.

If testing production, check DigitalOcean Runtime Logs.

### Common Issues:

**"401 Unauthorized"**
- Token expired - try logging out and back in
- Check if subscription is active

**"403 Forbidden"**
- Subscription expired - need to resubscribe
- Check subscription status

**"500 Internal Server Error"**
- Backend issue - check backend logs
- May need to check database connection

**Blank Screen**
- Check console for JavaScript errors
- Check if API URL is correct
- Check if backend is running (if local)

## 📊 Quick Health Check

Run these quick tests to verify everything works:

1. **Login** → Should work ✓
2. **View Dashboard** → Should load ✓
3. **View Dealers** → Should show list ✓
4. **View Dealer Detail** → Should show details ✓
5. **Add Note** → Should save ✓
6. **Send Email** → Should send (may not have attachments) ✓

If all 6 work → App is functioning correctly! ✅

## 🎯 Expected Results

After security changes, the app should work **exactly the same** as before because:
- No code was changed
- No dependencies were changed
- Only git configuration and documentation were updated
- All functionality should be identical

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Authentication: [ ] Pass [ ] Fail
Subscription: [ ] Pass [ ] Fail  
Dashboard: [ ] Pass [ ] Fail
Dealers: [ ] Pass [ ] Fail
Email: [ ] Pass [ ] Fail
File Upload: [ ] Pass [ ] Fail
Console Errors: [ ] None [ ] Some (list below)
API Errors: [ ] None [ ] Some (list below)

Overall Status: [ ] Working [ ] Issues Found

Notes:
_________________________________
_________________________________
```


