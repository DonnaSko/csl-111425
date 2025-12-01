# User Testing Guide - Capture Show Leads

**For Non-Technical Users**  
**Date**: December 2024

This guide will help you test every part of the application to ensure everything works correctly before going live.

---

## 🎯 How to Use This Guide

1. **Follow the steps in order** - Each section builds on the previous one
2. **Check off items** as you complete them (✅)
3. **Note any issues** you find
4. **Take your time** - Don't rush through the tests

---

## 📋 Pre-Testing Checklist

Before you start testing, make sure:
- [ ] Backend server is running (if testing locally)
- [ ] Frontend is accessible (either locally or production URL)
- [ ] You have a test email address ready
- [ ] You have a test credit card (use Stripe test cards if needed)

---

## 🔐 Part 1: Registration & Login

### Test Registration
1. **Go to Registration Page**
   - Navigate to `/register` or click "Register" link
   - ✅ Page loads correctly

2. **Fill in Registration Form**
   - First Name: `John`
   - Last Name: `Doe`
   - Company Name: `Test Company`
   - Email: `test@example.com` (use a real email you can access)
   - Password: `password123` (at least 6 characters)
   - ✅ All fields accept input

3. **Submit Registration**
   - Click "Create account" button
   - ✅ Should redirect to subscription page
   - ✅ Should NOT show error message
   - ✅ Should be logged in automatically

4. **Test Registration Errors**
   - Try registering with same email again
   - ✅ Should show "User already exists" error
   - Try registering with invalid email (e.g., `notanemail`)
   - ✅ Should show "Invalid email format" error
   - Try registering with password less than 6 characters
   - ✅ Should show "Password must be at least 6 characters" error
   - Try submitting with empty fields
   - ✅ Should show "All fields are required" error

### Test Login
1. **Logout** (if logged in)
   - Click logout button or clear browser data

2. **Go to Login Page**
   - Navigate to `/login` or click "Sign in" link
   - ✅ Page loads correctly

3. **Login with Valid Credentials**
   - Email: `test@example.com` (the one you registered with)
   - Password: `password123`
   - Click "Sign in"
   - ✅ Should redirect to dashboard (if subscribed) or subscription page
   - ✅ Should NOT show error message

4. **Test Login Errors**
   - Try login with wrong email
   - ✅ Should show "Invalid credentials" error
   - Try login with wrong password
   - ✅ Should show "Invalid credentials" error
   - Try login with empty fields
   - ✅ Should show "Email and password are required" error

---

## 💳 Part 2: Subscription Management

### Test Subscription Page
1. **Navigate to Subscription Page**
   - If not subscribed, should redirect here automatically
   - Or go to `/subscription`
   - ✅ Should see Monthly ($99) and Annual ($920) plans

2. **Test Subscription Creation** (Optional - requires Stripe setup)
   - Click "Subscribe Monthly" or "Subscribe Annually"
   - ✅ Should redirect to Stripe checkout
   - Complete checkout with test card
   - ✅ Should redirect to success page
   - ✅ Should be able to access dashboard after payment

### Test Subscription Sync
1. **If You Already Paid**
   - Click "Sync Subscription from Stripe" button
   - ✅ Should show success message
   - ✅ Should update subscription status
   - ✅ Should redirect to dashboard if subscription is active

---

## 📊 Part 3: Dashboard

### Test Dashboard Access
1. **Navigate to Dashboard**
   - Go to `/dashboard` or click "Dashboard" in navigation
   - ✅ Should load without errors
   - ✅ Should show statistics (Total Dealers, Notes, Photos, etc.)

2. **Check Dashboard Stats**
   - ✅ Total Dealers count is correct
   - ✅ Total Notes count is correct
   - ✅ Total Photos count is correct
   - ✅ Total Recordings count is correct
   - ✅ Active Todos count is correct

3. **Test Quick Actions**
   - Click "Capture Lead" card
   - ✅ Should navigate to capture lead page
   - Click "View Dealers" card
   - ✅ Should navigate to dealers page
   - Click "Reports" card
   - ✅ Should navigate to reports page

---

## 👥 Part 4: Dealer Management

### Test Create Dealer
1. **Navigate to Dealers Page**
   - Go to `/dealers` or click "Dealers" in navigation
   - ✅ Should load list of dealers (may be empty)

2. **Add a New Dealer**
   - Click "Add Dealer" or similar button
   - Fill in dealer information:
     - Company Name: `ABC Company` (required)
     - Contact Name: `Jane Smith` (optional)
     - Email: `jane@abc.com` (optional)
     - Phone: `555-1234` (optional)
     - City, State, Zip, Country, Address (all optional)
     - Buying Group: `Group A` (optional)
     - Status: `Prospect` (default)
   - Click "Save" or "Create"
   - ✅ Should create dealer successfully
   - ✅ Should appear in dealer list

3. **Test Create Dealer Errors**
   - Try creating dealer without company name
   - ✅ Should show "Company name is required" error
   - Try creating dealer with invalid email
   - ✅ Should show "Invalid email format" error

### Test View Dealers
1. **View Dealer List**
   - ✅ Should see all dealers in a list
   - ✅ Should see dealer information (company name, contact, email, etc.)

2. **Search Dealers**
   - Type in search box: `ABC`
   - ✅ Should filter dealers by company name, contact, email, phone
   - Clear search
   - ✅ Should show all dealers again

3. **Filter Dealers**
   - Select status filter: `Prospect`
   - ✅ Should show only dealers with that status
   - Select buying group filter
   - ✅ Should show only dealers in that buying group

### Test View Dealer Details
1. **Click on a Dealer**
   - Click on any dealer in the list
   - ✅ Should navigate to dealer detail page
   - ✅ Should show all dealer information
   - ✅ Should show notes, photos, recordings, todos

### Test Edit Dealer
1. **Edit Dealer Information**
   - On dealer detail page, click "Edit" button
   - Change some information (e.g., status to "Active")
   - Click "Save"
   - ✅ Should update dealer successfully
   - ✅ Should see updated information

### Test Delete Dealer
1. **Delete a Dealer**
   - On dealer detail page, click "Delete" button
   - Confirm deletion
   - ✅ Should delete dealer successfully
   - ✅ Should remove from dealer list

---

## 📁 Part 5: File Upload & CSV Import

### Test CSV Upload
1. **Prepare a CSV File**
   - Create a CSV file with headers:
     - `companyName,contactName,email,phone,city,state,zip,country,address,buyingGroup,status`
   - Add a few rows of dealer data
   - Save as `test-dealers.csv`

2. **Upload CSV File**
   - Go to Dealers page
   - Click "Upload CSV" or "Bulk Import" button
   - ✅ Should show file upload dialog
   - Select your CSV file
   - ✅ Should parse and show preview
   - ✅ Should show duplicate detection (if any)

3. **Import Dealers**
   - Review the preview
   - Choose to skip or include duplicates
   - Click "Import" button
   - ✅ Should show progress indicator
   - ✅ Should show completion message with count
   - ✅ Should NOT cause blank screen
   - ✅ Should add dealers to list

### Test File Type Validation
1. **Try Uploading Different File Types**
   - Try CSV file: ✅ Should work
   - Try PDF file: ✅ Should work (if supported)
   - Try DOC file: ✅ Should work (if supported)
   - Try unsupported file (e.g., .exe): ✅ Should show error message

### Test File Size Limits
1. **Try Uploading Large File**
   - Try file under 100MB: ✅ Should work
   - Try file over 100MB: ✅ Should show error message

---

## 📷 Part 6: Photos & Documents

### Test Photo Upload
1. **Upload Photo for Dealer**
   - Go to dealer detail page
   - Click "Upload Photo" or similar button
   - Select an image file
   - ✅ Should upload successfully
   - ✅ Should appear in dealer photos section

### Test Document Upload
1. **Upload Document**
   - Go to dealer detail page or upload section
   - Click "Upload Document" button
   - Select a PDF, DOC, or other supported file
   - ✅ Should upload successfully
   - ✅ Should show file information

---

## 📅 Part 7: Trade Shows

### Test Create Trade Show
1. **Navigate to Trade Shows**
   - Go to `/trade-shows` or click "Trade Shows" in navigation
   - ✅ Should load trade shows list

2. **Create New Trade Show**
   - Click "Add Trade Show" or similar button
   - Fill in:
     - Name: `Test Trade Show 2024` (required)
     - Location: `Las Vegas, NV` (optional)
     - Start Date: Select a date (optional)
     - End Date: Select a date (optional)
     - Description: `Test description` (optional)
   - Click "Save"
   - ✅ Should create trade show successfully
   - ✅ Should appear in list

### Test Link Dealers to Trade Show
1. **Associate Dealer with Trade Show**
   - Go to trade show detail page
   - Click "Add Dealer" or similar
   - Select a dealer
   - ✅ Should link dealer to trade show
   - ✅ Should appear in trade show dealers list

---

## ✅ Part 8: To-Dos

### Test Create Todo
1. **Navigate to Todos**
   - Go to `/todos` or click "Todos" in navigation
   - ✅ Should load todos list

2. **Create New Todo**
   - Click "Add Todo" or similar button
   - Fill in:
     - Title: `Follow up with ABC Company` (required)
     - Description: `Call about pricing` (optional)
     - Due Date: Select a date (optional)
     - Link to Dealer: Select dealer (optional)
   - Click "Save"
   - ✅ Should create todo successfully
   - ✅ Should appear in list

### Test Complete Todo
1. **Mark Todo as Complete**
   - Click checkbox next to a todo
   - Or click "Complete" button
   - ✅ Should mark as completed
   - ✅ Should move to completed section (if filtered)

---

## 📊 Part 9: Reports

### Test View Reports
1. **Navigate to Reports**
   - Go to `/reports` or click "Reports" in navigation
   - ✅ Should load reports page

2. **Check Report Data**
   - ✅ Should show dealer statistics
   - ✅ Should show trade show statistics
   - ✅ Should show charts/graphs (if implemented)

### Test Export Reports
1. **Export Dealers to CSV**
   - Click "Export" or "Download CSV" button
   - ✅ Should download CSV file
   - ✅ Should contain all dealer data

---

## 🔒 Part 10: Security & Access Control

### Test Protected Routes
1. **Test Without Authentication**
   - Logout or clear browser data
   - Try to access `/dashboard`
   - ✅ Should redirect to `/login`
   - Try to access `/dealers`
   - ✅ Should redirect to `/login`

2. **Test Without Subscription**
   - Login with account that has no subscription
   - Try to access `/dashboard`
   - ✅ Should redirect to `/subscription`
   - Try to access `/dealers`
   - ✅ Should redirect to `/subscription`

3. **Test With Subscription**
   - Login with account that has active subscription
   - ✅ Should be able to access all protected routes
   - ✅ Should NOT be redirected to subscription page

---

## 🐛 Part 11: Error Handling

### Test Network Errors
1. **Simulate Network Error**
   - Disconnect internet temporarily
   - Try to perform an action (e.g., create dealer)
   - ✅ Should show error message (not blank screen)
   - ✅ Error message should be user-friendly

### Test Invalid Data
1. **Submit Invalid Data**
   - Try to submit forms with invalid data
   - ✅ Should show specific error messages
   - ✅ Should NOT cause application to crash

---

## ✅ Testing Summary Checklist

### Critical Features (Must Work)
- [ ] Registration works
- [ ] Login works
- [ ] Subscription creation works (if using Stripe)
- [ ] Dashboard loads
- [ ] Create dealer works
- [ ] View dealers works
- [ ] Search dealers works
- [ ] Upload CSV works
- [ ] Import dealers works

### Important Features (Should Work)
- [ ] Edit dealer works
- [ ] Delete dealer works
- [ ] Upload photos works
- [ ] Upload documents works
- [ ] Create trade show works
- [ ] Create todo works
- [ ] View reports works

### Nice to Have (Optional)
- [ ] Export reports works
- [ ] All error messages are clear
- [ ] All loading states work
- [ ] All navigation works smoothly

---

## 📝 Notes Section

Use this space to note any issues you find:

**Issue 1:**
- Description:
- Steps to reproduce:
- Expected behavior:
- Actual behavior:

**Issue 2:**
- Description:
- Steps to reproduce:
- Expected behavior:
- Actual behavior:

---

## 🎯 Next Steps

After completing all tests:

1. **Review Your Notes** - Check all issues you found
2. **Report Issues** - Share any problems with the development team
3. **Retest Fixed Issues** - If issues were fixed, test them again
4. **Sign Off** - Once everything works, you're ready to go live!

---

**Happy Testing!** 🚀

If you encounter any issues, document them clearly and share with the development team.

