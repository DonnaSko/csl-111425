# Capture Show Leads - Comprehensive Testing Plan

## Overview
This document outlines a comprehensive testing plan to ensure the Capture Show Leads application is secure, functional, and ready for production use.

## Prerequisites
- PostgreSQL database running
- Stripe account with test API keys
- Node.js 18+ installed
- All dependencies installed (`npm install` in both backend and frontend)

## Phase 1: Payment & Security Testing

### 1.1 Subscription Creation
**Objective**: Verify users can subscribe to monthly and annual plans

**Test Cases**:
1. **Monthly Subscription**
   - Register a new user
   - Navigate to subscription page
   - Click "Subscribe Monthly"
   - Complete Stripe checkout with test card: `4242 4242 4242 4242`
   - Verify redirect to success page
   - Verify subscription status shows as "active" in dashboard
   - Verify user can access protected routes

2. **Annual Subscription**
   - Register a new user (or use different account)
   - Navigate to subscription page
   - Click "Subscribe Annually"
   - Complete Stripe checkout
   - Verify subscription status and access

**Expected Results**:
- Checkout session created successfully
- Payment processed
- Subscription record created in database
- User redirected to success page
- User can access all features

### 1.2 Paywall Security
**Objective**: Ensure users cannot access features without active subscription

**Test Cases**:
1. **Unauthenticated Access**
   - Logout or use incognito window
   - Try to access `/dashboard`, `/dealers`, etc.
   - Verify redirect to login page

2. **Authenticated but No Subscription**
   - Register new user
   - Do NOT subscribe
   - Try to access `/dashboard`
   - Verify redirect to subscription page
   - Try to access `/dealers` directly via URL
   - Verify API returns 403 error
   - Verify frontend redirects to subscription

3. **Expired Subscription**
   - Create test subscription with past `currentPeriodEnd` date
   - Try to access protected routes
   - Verify access is denied

4. **API Bypass Attempts**
   - Use Postman/curl with valid JWT but no subscription
   - Try to call `/api/dealers`, `/api/reports`, etc.
   - Verify all return 403 with `SUBSCRIPTION_REQUIRED` code

**Expected Results**:
- All protected routes require active subscription
- API endpoints enforce paywall middleware
- Frontend redirects appropriately
- No way to bypass payment

### 1.3 Subscription Cancellation
**Objective**: Verify cancellation rules (5+ days before renewal)

**Test Cases**:
1. **Valid Cancellation (5+ days before renewal)**
   - Create subscription with renewal date 10 days in future
   - Navigate to subscription management
   - Click "Cancel Subscription"
   - Verify cancellation succeeds
   - Verify `cancelAtPeriodEnd` is set to true
   - Verify user still has access until period ends

2. **Invalid Cancellation (< 5 days before renewal)**
   - Create subscription with renewal date 3 days in future
   - Try to cancel
   - Verify error message: "Cancellation must be at least 5 days before renewal date"
   - Verify cancellation is blocked

3. **Cancellation via Stripe Portal**
   - Create subscription
   - Use "Manage Subscription" to open Stripe portal
   - Cancel subscription in Stripe
   - Verify webhook updates database
   - Verify `cancelAtPeriodEnd` is set

**Expected Results**:
- Cancellation only allowed 5+ days before renewal
- Clear error messages for invalid cancellations
- Cancelled subscriptions still provide access until period end
- Stripe webhooks properly update database

### 1.4 Webhook Testing
**Objective**: Verify Stripe webhooks update subscription status correctly

**Test Cases**:
1. **Subscription Created**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
   - Complete checkout
   - Verify webhook received
   - Verify subscription record created/updated

2. **Subscription Updated**
   - Update subscription in Stripe dashboard
   - Verify webhook updates database

3. **Subscription Deleted**
   - Cancel subscription in Stripe
   - Verify webhook marks subscription as canceled

4. **Payment Failed**
   - Use test card that will fail: `4000 0000 0000 0002`
   - Verify webhook updates status to `past_due`
   - Verify access is revoked

**Expected Results**:
- All webhook events processed correctly
- Database stays in sync with Stripe
- Subscription status accurately reflects Stripe state

## Phase 2: Data Isolation Testing

### 2.1 User Data Isolation
**Objective**: Ensure users can only access their own company's data

**Test Cases**:
1. **Create Two Companies**
   - Register User A with Company A
   - Register User B with Company B
   - Both users subscribe

2. **Cross-Company Access Attempts**
   - As User A, create dealers
   - As User B, try to access User A's dealer IDs via API
   - Verify 404 or empty results
   - Try to update User A's dealers
   - Verify access denied

3. **Database Query Verification**
   - Check database directly
   - Verify all queries include `companyId` filter
   - Verify no data leakage between companies

**Expected Results**:
- Users can only see their own company's data
- API endpoints enforce company-level filtering
- No cross-company data access possible
- Database queries always scoped to company

### 2.2 Multi-User Company Access
**Objective**: Verify multiple users in same company share data

**Test Cases**:
1. **Create Multiple Users in Same Company**
   - User A creates company
   - User B registers with same company name (or admin adds user)
   - Both users subscribe

2. **Shared Data Access**
   - User A creates dealer
   - User B should see the dealer
   - User B can edit User A's dealer
   - Both users see same data

**Expected Results**:
- Users in same company share data
- All company users see same dealers, notes, etc.
- Proper company-level data sharing

## Phase 3: Core Functionality Testing

### 3.1 Authentication
**Test Cases**:
1. **Registration**
   - Register with valid data
   - Verify account created
   - Verify JWT token received
   - Verify redirect to subscription page

2. **Login**
   - Login with correct credentials
   - Verify token stored
   - Verify redirect to dashboard (if subscribed)

3. **Invalid Credentials**
   - Try wrong password
   - Verify error message
   - Try non-existent email
   - Verify error message

4. **Token Expiration**
   - Wait for token to expire (or manually expire)
   - Try to access protected route
   - Verify redirect to login

**Expected Results**:
- Registration and login work correctly
- Invalid credentials rejected
- Expired tokens handled properly

### 3.2 Dealer Management
**Test Cases**:
1. **Create Dealer**
   - Navigate to Capture Lead or Dealers page
   - Fill in dealer information
   - Submit form
   - Verify dealer created
   - Verify redirect to dealer detail page

2. **View Dealers List**
   - Create multiple dealers
   - Navigate to Dealers page
   - Verify all dealers displayed
   - Verify pagination works (if > 50 dealers)

3. **Search Dealers**
   - Create dealers with different names
   - Use search bar
   - Verify results filtered correctly
   - Test search by company name, contact, email, phone

4. **Filter Dealers**
   - Filter by status
   - Filter by buying group
   - Verify filters work correctly
   - Test multiple filters together

5. **View Dealer Details**
   - Click on dealer from list
   - Verify all information displayed
   - Verify notes, photos, recordings shown

6. **Update Dealer**
   - Edit dealer information
   - Save changes
   - Verify updates persisted

7. **Delete Dealer**
   - Delete a dealer
   - Verify dealer removed from list
   - Verify related data (notes, photos) deleted (cascade)

**Expected Results**:
- All CRUD operations work correctly
- Search and filters function properly
- Data persists correctly

### 3.3 CSV Import/Export
**Test Cases**:
1. **Export Dealers**
   - Create several dealers
   - Navigate to Reports page
   - Click "Export Dealers to CSV"
   - Verify CSV file downloaded
   - Open CSV and verify data correct
   - Verify all columns included

2. **Import Dealers**
   - Prepare CSV file with dealer data
   - Navigate to Dealers page
   - Click "Bulk Upload CSV"
   - Upload CSV file
   - Verify dealers imported
   - Verify data matches CSV

3. **CSV Validation**
   - Try to upload invalid CSV
   - Try to upload CSV with missing required fields
   - Verify appropriate error messages

**Expected Results**:
- Export generates valid CSV
- Import processes CSV correctly
- Validation prevents bad data

### 3.4 Notes System
**Test Cases**:
1. **Add Note**
   - Navigate to dealer detail page
   - Add a note
   - Verify note appears in list
   - Verify timestamp correct

2. **View Notes**
   - Add multiple notes
   - Verify all notes displayed
   - Verify chronological order

**Expected Results**:
- Notes can be added and viewed
- Notes associated with correct dealer
- Timestamps accurate

### 3.5 Lead Quality Rating
**Test Cases**:
1. **Set Rating**
   - Navigate to dealer detail page
   - Click stars to set rating
   - Verify rating saved
   - Refresh page, verify rating persists

2. **Update Rating**
   - Change rating
   - Verify update saved

**Expected Results**:
- Ratings can be set and updated
- Ratings persist correctly

## Phase 4: Feature Testing

### 4.1 Dashboard
**Test Cases**:
1. **View Dashboard**
   - Navigate to dashboard
   - Verify stats displayed correctly
   - Verify quick action links work

2. **Stats Accuracy**
   - Create dealers, notes, photos
   - Verify dashboard stats update
   - Verify counts accurate

**Expected Results**:
- Dashboard displays correctly
- Stats are accurate
- Navigation works

### 4.2 Reports
**Test Cases**:
1. **View Reports Page**
   - Navigate to Reports
   - Verify page loads
   - Test export functionality

**Expected Results**:
- Reports page accessible
- Export works correctly

## Phase 5: Security Audit

### 5.1 SQL Injection Prevention
**Test Cases**:
1. **Input Validation**
   - Try SQL injection in search fields
   - Try SQL injection in form fields
   - Verify no SQL executed
   - Verify proper error handling

**Expected Results**:
- Prisma ORM prevents SQL injection
- Input sanitized
- No database vulnerabilities

### 5.2 XSS Prevention
**Test Cases**:
1. **Script Injection**
   - Try to inject `<script>` tags in text fields
   - Verify scripts not executed
   - Verify content sanitized

**Expected Results**:
- React escapes content by default
- No XSS vulnerabilities

### 5.3 Authentication Bypass
**Test Cases**:
1. **Token Manipulation**
   - Try to modify JWT token
   - Try to use expired token
   - Try to use token from different user
   - Verify all rejected

**Expected Results**:
- Token validation works
- No authentication bypass possible

### 5.4 CSRF Protection
**Test Cases**:
1. **Cross-Site Requests**
   - Verify CORS configured correctly
   - Verify API requires authentication
   - Test from different origin

**Expected Results**:
- CORS properly configured
- Authentication required for all mutations

## Phase 6: Performance Testing

### 6.1 Load Testing
**Test Cases**:
1. **Multiple Users**
   - Simulate multiple concurrent users
   - Test API response times
   - Test database query performance

2. **Large Datasets**
   - Import 1000+ dealers
   - Test search performance
   - Test pagination
   - Verify acceptable response times

**Expected Results**:
- Application handles concurrent users
- Acceptable performance with large datasets
- Database indexes working correctly

## Phase 7: Integration Testing

### 7.1 End-to-End User Flows
**Test Cases**:
1. **Complete Lead Capture Flow**
   - Register → Subscribe → Capture Lead → Add Note → Rate → Export
   - Verify entire flow works

2. **Dealer Management Flow**
   - Import CSV → Search → Filter → View → Edit → Delete
   - Verify flow works

**Expected Results**:
- Complete user journeys work
- No broken links or errors

## Testing Checklist

### Pre-Deployment Checklist
- [ ] All payment tests pass
- [ ] Paywall security verified
- [ ] Data isolation confirmed
- [ ] All core features working
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Error handling tested
- [ ] Edge cases handled
- [ ] Documentation complete

### Stripe Configuration Checklist
- [ ] Test API keys configured
- [ ] Webhook endpoint configured
- [ ] Webhook secret set
- [ ] Price IDs configured (monthly and annual)
- [ ] Test cards verified
- [ ] Webhook events tested

### Database Checklist
- [ ] Database migrations run
- [ ] Indexes created
- [ ] Foreign keys configured
- [ ] Cascade deletes working
- [ ] Data isolation verified

## Test Data

### Test Stripe Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Authentication: `4000 0025 0000 3155`

### Test Users
Create test users for different scenarios:
- User with active subscription
- User with expired subscription
- User with no subscription
- Multiple users in same company
- Users in different companies

## Reporting Issues

When reporting issues, include:
1. Test case that failed
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots/logs if applicable
6. Environment details (browser, OS, etc.)

## Continuous Testing

After deployment:
- Monitor Stripe webhooks
- Monitor error logs
- Test payment flows regularly
- Verify data isolation in production
- Monitor performance metrics

