# Comprehensive Testing Plan - Capture Show Leads

**Date**: December 2024  
**Status**: Complete Testing & Validation Plan  
**Purpose**: Ensure all features work correctly before production deployment

---

## 🎯 Testing Philosophy

As a Senior Developer, we follow these principles:
1. **Test Everything** - No feature is too small to test
2. **Test Edge Cases** - What happens when things go wrong?
3. **Test Integration** - Do all parts work together?
4. **Verify Fixes** - Always retest after fixing issues
5. **Don't Break Working Code** - Fix issues without breaking existing functionality

---

## 📋 Part 1: Automated Code Testing (Developer)

### 1.1 TypeScript Compilation Testing
- [ ] Backend compiles without errors
- [ ] Frontend compiles without errors
- [ ] No implicit 'any' types
- [ ] All type definitions correct

### 1.2 Linter Testing
- [ ] Zero linter errors in backend
- [ ] Zero linter errors in frontend
- [ ] Code style consistency

### 1.3 Build Testing
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Production builds work
- [ ] No build warnings

### 1.4 Code Analysis
- [ ] Check for null/undefined access
- [ ] Check for missing error handling
- [ ] Check for security vulnerabilities
- [ ] Check for memory leaks
- [ ] Check for async/await issues

---

## 📋 Part 2: Authentication Testing

### 2.1 Registration Flow
- [ ] Register with valid data → Success
- [ ] Register with missing fields → Error message
- [ ] Register with existing email → Error message
- [ ] Register with invalid email → Validation error
- [ ] Register with weak password → (if validation exists)
- [ ] Registration creates company → Verify in database
- [ ] Registration creates user → Verify in database
- [ ] Registration returns JWT token → Verify token format
- [ ] Registration redirects to subscription page → Verify navigation

### 2.2 Login Flow
- [ ] Login with valid credentials → Success
- [ ] Login with invalid email → Error message
- [ ] Login with invalid password → Error message
- [ ] Login with missing fields → Error message
- [ ] Login returns JWT token → Verify token
- [ ] Login returns user data → Verify user object
- [ ] Login returns subscription status → Verify subscription object
- [ ] Login redirects to dashboard → Verify navigation
- [ ] Login stores token in localStorage → Verify storage

### 2.3 Token Verification
- [ ] Valid token allows access → Verify /auth/me works
- [ ] Invalid token is rejected → Verify 401 error
- [ ] Expired token is rejected → Verify 401 error
- [ ] Missing token is rejected → Verify 401 error
- [ ] Token verification on page load → Verify AuthContext
- [ ] Invalid token is cleared → Verify localStorage cleared

### 2.4 Authentication Context
- [ ] User state loads correctly → Verify AuthContext
- [ ] Loading state works → Verify loading indicator
- [ ] Error state handled → Verify error messages
- [ ] Logout clears state → Verify state cleared
- [ ] Logout clears localStorage → Verify storage cleared

---

## 📋 Part 3: Subscription Testing

### 3.1 Subscription Status Check
- [ ] No subscription → Returns hasSubscription: false
- [ ] Active subscription → Returns isActive: true
- [ ] Expired subscription → Returns isActive: false
- [ ] Cancelled subscription → Returns correct status
- [ ] Subscription check orders by createdAt DESC → Verify most recent

### 3.2 Subscription Creation
- [ ] Create checkout session (monthly) → Verify session created
- [ ] Create checkout session (annual) → Verify session created
- [ ] Invalid plan type → Error message
- [ ] Checkout session has correct URLs → Verify redirect URLs
- [ ] Checkout session has metadata → Verify userId, plan

### 3.3 Subscription Sync
- [ ] Sync from Stripe with valid subscription → Success
- [ ] Sync from Stripe with invalid subscription → Error message
- [ ] Sync updates database → Verify status updated
- [ ] Sync button works → Verify UI interaction
- [ ] Sync shows success message → Verify feedback

### 3.4 Subscription Cancellation
- [ ] Cancel active subscription → Success
- [ ] Cancel within 5 days of renewal → Error message
- [ ] Cancel updates database → Verify cancelAtPeriodEnd set
- [ ] Cancel updates Stripe → Verify Stripe updated

### 3.5 Paywall Middleware
- [ ] Active subscription allows access → Verify route access
- [ ] No subscription blocks access → Verify 403 error
- [ ] Expired subscription blocks access → Verify 403 error
- [ ] Paywall redirects to subscription page → Verify redirect

---

## 📋 Part 4: Dealer Management Testing

### 4.1 Create Dealer
- [ ] Create dealer with required fields → Success
- [ ] Create dealer with all fields → Success
- [ ] Create dealer with missing companyName → Error message
- [ ] Create dealer validates data → Verify validation
- [ ] Create dealer sets companyId → Verify data isolation
- [ ] Create dealer returns dealer object → Verify response

### 4.2 Read Dealers
- [ ] Get all dealers → Returns list
- [ ] Get dealers with pagination → Verify pagination works
- [ ] Get dealers with search → Verify search works
- [ ] Get dealers with status filter → Verify filter works
- [ ] Get dealers with buying group filter → Verify filter works
- [ ] Get single dealer → Returns dealer details
- [ ] Get non-existent dealer → 404 error
- [ ] Get dealer from different company → 404 error (data isolation)

### 4.3 Update Dealer
- [ ] Update dealer with valid data → Success
- [ ] Update dealer with invalid data → Error message
- [ ] Update non-existent dealer → 404 error
- [ ] Update dealer from different company → 404 error
- [ ] Update dealer updates timestamp → Verify updatedAt

### 4.4 Delete Dealer
- [ ] Delete dealer → Success
- [ ] Delete non-existent dealer → 404 error
- [ ] Delete dealer from different company → 404 error
- [ ] Delete dealer removes related data → Verify cascade delete

### 4.5 Dealer Search & Filter
- [ ] Search by company name → Returns matches
- [ ] Search by contact name → Returns matches
- [ ] Search by email → Returns matches
- [ ] Search by phone → Returns matches
- [ ] Search by buying group → Returns matches
- [ ] Filter by status → Returns filtered results
- [ ] Filter by buying group → Returns filtered results
- [ ] Combined search and filter → Returns correct results

---

## 📋 Part 5: File Upload Testing

### 5.1 CSV Upload
- [ ] Upload valid CSV file → Success
- [ ] Upload CSV with headers → Parses correctly
- [ ] Upload CSV without headers → Handles gracefully
- [ ] Upload empty CSV → Error message
- [ ] Upload malformed CSV → Error message
- [ ] Upload CSV with special characters → Handles correctly

### 5.2 Bulk Import
- [ ] Import small CSV (< 100 dealers) → Success
- [ ] Import large CSV (> 500 dealers) → Success with batching
- [ ] Import CSV with duplicates → Detects duplicates
- [ ] Import CSV with skipDuplicates=true → Skips duplicates
- [ ] Import CSV with skipDuplicates=false → Includes duplicates
- [ ] Import shows progress → Verify progress indicator
- [ ] Import completes without blank screen → Verify UI stability
- [ ] Import returns summary → Verify response data

### 5.3 File Type Validation
- [ ] Upload CSV file → Accepted
- [ ] Upload PDF file → Accepted
- [ ] Upload DOC file → Accepted
- [ ] Upload DOCX file → Accepted
- [ ] Upload XLS file → Accepted
- [ ] Upload XLSX file → Accepted
- [ ] Upload TXT file → Accepted
- [ ] Upload RTF file → Accepted
- [ ] Upload PAGES file → Accepted
- [ ] Upload unsupported file type → Error message
- [ ] Upload file with wrong extension → Error message

### 5.4 File Size Limits
- [ ] Upload file < 100MB → Success
- [ ] Upload file = 100MB → Success
- [ ] Upload file > 100MB → Error message
- [ ] Error message is clear → Verify user feedback

### 5.5 Photo Upload
- [ ] Upload photo for dealer → Success
- [ ] Upload photo for non-existent dealer → 404 error
- [ ] Upload photo for different company's dealer → 404 error
- [ ] Get photo → Returns file
- [ ] Delete photo → Success

### 5.6 Voice Recording Upload
- [ ] Upload recording for dealer → Success
- [ ] Upload recording for non-existent dealer → 404 error
- [ ] Get recording → Returns file
- [ ] Delete recording → Success

---

## 📋 Part 6: Protected Routes Testing

### 6.1 Route Protection
- [ ] Access /dashboard without auth → Redirects to /login
- [ ] Access /dealers without auth → Redirects to /login
- [ ] Access /dashboard with auth but no subscription → Redirects to /subscription
- [ ] Access /dealers with auth and subscription → Allows access
- [ ] Access root / without auth → Redirects to /login
- [ ] Access root / with auth → Redirects to /dashboard

### 6.2 PrivateRoute Component
- [ ] Shows loading state → Verify loading indicator
- [ ] Redirects unauthenticated users → Verify redirect
- [ ] Redirects users without subscription → Verify redirect
- [ ] Allows authenticated users with subscription → Verify access

### 6.3 Navigation Flow
- [ ] Login → Dashboard (with subscription)
- [ ] Login → Subscription (without subscription)
- [ ] Register → Subscription page
- [ ] Logout → Login page
- [ ] Invalid route → 404 or redirect

---

## 📋 Part 7: Error Handling Testing

### 7.1 Network Errors
- [ ] Backend offline → Error message shown
- [ ] Slow network → Loading state shown
- [ ] Request timeout → Error message shown
- [ ] No internet connection → Error message shown

### 7.2 API Errors
- [ ] 400 Bad Request → Error message shown
- [ ] 401 Unauthorized → Redirects to login
- [ ] 403 Forbidden → Redirects to subscription
- [ ] 404 Not Found → Error message shown
- [ ] 500 Server Error → Error message shown

### 7.3 Frontend Errors
- [ ] Unhandled promise rejection → Error boundary catches
- [ ] Component error → Error boundary catches
- [ ] Blank screen prevention → Verify error handling
- [ ] Error messages are user-friendly → Verify clarity

### 7.4 Validation Errors
- [ ] Invalid email format → Error message
- [ ] Missing required fields → Error message
- [ ] Invalid data types → Error message
- [ ] Data too long → Error message

---

## 📋 Part 8: Edge Cases Testing

### 8.1 Data Edge Cases
- [ ] Empty strings → Handled correctly
- [ ] Null values → Handled correctly
- [ ] Undefined values → Handled correctly
- [ ] Very long strings → Handled correctly
- [ ] Special characters → Handled correctly
- [ ] Unicode characters → Handled correctly

### 8.2 Concurrent Operations
- [ ] Multiple simultaneous uploads → Handled correctly
- [ ] Multiple simultaneous API calls → Handled correctly
- [ ] Rapid navigation → Handled correctly

### 8.3 Browser Edge Cases
- [ ] LocalStorage disabled → Handled gracefully
- [ ] Cookies disabled → Handled gracefully
- [ ] JavaScript disabled → (if applicable)

---

## 📋 Part 9: Performance Testing

### 9.1 Large Data Handling
- [ ] Load 1000+ dealers → Performance acceptable
- [ ] Import 1000+ dealers → Performance acceptable
- [ ] Search large dataset → Performance acceptable
- [ ] Filter large dataset → Performance acceptable

### 9.2 Response Times
- [ ] API response times < 1s → Verify performance
- [ ] Page load times < 3s → Verify performance
- [ ] File upload progress → Verify feedback

---

## 📋 Part 10: Security Testing

### 10.1 Authentication Security
- [ ] Cannot access protected routes without token → Verify
- [ ] Invalid token rejected → Verify
- [ ] Expired token rejected → Verify
- [ ] Token stored securely → Verify localStorage

### 10.2 Authorization Security
- [ ] User cannot access other company's data → Verify
- [ ] User cannot modify other company's data → Verify
- [ ] User cannot delete other company's data → Verify

### 10.3 Input Security
- [ ] SQL injection attempts blocked → Verify
- [ ] XSS attempts blocked → Verify
- [ ] CSRF protection → Verify (if implemented)

---

## 📋 Part 11: User Testing Guide (Non-Technical)

### 11.1 Getting Started
1. **Register a New Account**
   - Go to the registration page
   - Fill in all fields (First Name, Last Name, Company Name, Email, Password)
   - Click "Create account"
   - ✅ Should redirect to subscription page

2. **Login**
   - Go to login page
   - Enter email and password
   - Click "Sign in"
   - ✅ Should redirect to dashboard (if subscribed) or subscription page

### 11.2 Subscription Management
1. **Create Subscription**
   - Choose Monthly ($99) or Annual ($920)
   - Complete Stripe checkout
   - ✅ Should redirect to success page
   - ✅ Should be able to access dashboard

2. **Check Subscription Status**
   - Go to subscription page
   - ✅ Should show current subscription status
   - ✅ Should show renewal date

3. **Sync Subscription** (if needed)
   - Click "Sync Subscription from Stripe" button
   - ✅ Should show success message
   - ✅ Should update subscription status

### 11.3 Dealer Management
1. **Add a Dealer**
   - Go to Dealers page
   - Click "Add Dealer" or similar button
   - Fill in dealer information
   - Click "Save"
   - ✅ Should see dealer in list

2. **Search Dealers**
   - Use search box on Dealers page
   - Type company name, email, or phone
   - ✅ Should filter results

3. **View Dealer Details**
   - Click on a dealer in the list
   - ✅ Should show dealer details page
   - ✅ Should show notes, photos, todos

4. **Edit Dealer**
   - Go to dealer details page
   - Click "Edit" button
   - Make changes
   - Click "Save"
   - ✅ Should see updated information

5. **Delete Dealer**
   - Go to dealer details page
   - Click "Delete" button
   - Confirm deletion
   - ✅ Should remove dealer from list

### 11.4 File Upload
1. **Upload CSV File**
   - Go to Dealers page
   - Click "Upload CSV" or similar button
   - Select a CSV file
   - ✅ Should show file preview
   - ✅ Should show duplicate detection (if any)
   - Click "Import"
   - ✅ Should show progress
   - ✅ Should show completion message

2. **Upload Other Files**
   - Go to dealer details page
   - Click "Upload Photo" or "Upload Document"
   - Select file (PDF, DOC, etc.)
   - ✅ Should upload successfully
   - ✅ Should appear in dealer details

### 11.5 Trade Shows
1. **Create Trade Show**
   - Go to Trade Shows page
   - Click "Add Trade Show"
   - Fill in information
   - Click "Save"
   - ✅ Should see trade show in list

2. **Link Dealers to Trade Show**
   - Go to trade show details
   - Add dealers
   - ✅ Should link successfully

### 11.6 Reports
1. **View Reports**
   - Go to Reports page
   - ✅ Should show dealer statistics
   - ✅ Should show trade show statistics

### 11.7 To-Dos
1. **Create To-Do**
   - Go to Todos page or dealer details
   - Click "Add Todo"
   - Fill in information
   - Set due date
   - Click "Save"
   - ✅ Should appear in list

2. **Complete To-Do**
   - Click checkbox or "Complete" button
   - ✅ Should mark as completed

---

## 📋 Part 12: Testing Checklist Summary

### Critical Paths (Must Work)
- [ ] Registration → Subscription → Dashboard
- [ ] Login → Dashboard (with subscription)
- [ ] Create Dealer → View Dealer → Edit Dealer
- [ ] Upload CSV → Import Dealers → View Dealers
- [ ] Create Subscription → Access Protected Routes

### Important Features (Should Work)
- [ ] Search and filter dealers
- [ ] Upload photos and documents
- [ ] Create and manage trade shows
- [ ] Create and complete todos
- [ ] View reports

### Edge Cases (Nice to Have)
- [ ] Large file uploads
- [ ] Bulk imports
- [ ] Error handling
- [ ] Network failures

---

## 🔧 Testing Tools & Commands

### Backend Testing
```bash
# Compile TypeScript
cd backend && npm run build

# Check for linter errors
# (Check IDE or run linter)

# Start development server
cd backend && npm run dev
```

### Frontend Testing
```bash
# Compile TypeScript
cd frontend && npm run build

# Start development server
cd frontend && npm run dev
```

### Manual Testing
1. Open browser to `http://localhost:5173` (frontend)
2. Backend should be running on `http://localhost:5000`
3. Open browser DevTools (F12) to see console errors
4. Test each feature systematically

---

## 📝 Testing Results Template

For each test, document:
- **Test Name**: What you're testing
- **Expected Result**: What should happen
- **Actual Result**: What actually happened
- **Status**: ✅ Pass / ❌ Fail
- **Notes**: Any issues or observations

---

## 🎯 Next Steps After Testing

1. **Fix Any Issues Found**
   - Document the issue
   - Fix the code
   - Retest to verify fix
   - Don't break working code

2. **Update Documentation**
   - Update checkpoint if needed
   - Document any new issues found
   - Document any fixes made

3. **Deploy to Production**
   - Only after all critical tests pass
   - Monitor for issues
   - Have rollback plan ready

---

**Last Updated**: December 2024  
**Status**: Ready for comprehensive testing

