# Systematic Debug Plan - Email Sending Issue

## Problem Statement:
Send Email button is greyed out/disabled. User says it worked yesterday, broken today.

## What I Will NOT Do:
- ❌ Make assumptions about dealer having no email
- ❌ Say "it's fixed" without testing
- ❌ Guess at solutions

## What I WILL Do:
✅ Systematically check each component
✅ Look at actual data
✅ Check actual logs
✅ Test each endpoint
✅ Prove it works with evidence

---

## Phase 1: Investigate Recent Changes That Could Break Email

### Changes Made in Last 3 Commits:
1. `9f02f9b` - "Fix: Save email history with attachments when sending dealer emails"
2. `e7df552` - "Add Emails Sent report tab sorted by TradeShow and date"  
3. `7fc87e9` - "Fix: Add tabs to Reports page" (NOW REVERTED)

### Hypothesis: Email History Saving Broke Something

The commit `9f02f9b` modified:
- `backend/src/routes/emailFiles.ts` - Added email history saving
- `frontend/src/pages/DealerDetail.tsx` - Added dealerId to email request

**This could have broken email sending if:**
- Backend expects dealerId but it's not being passed correctly
- Email history save is failing and blocking email send
- DealerId validation is failing

---

## Phase 2: Check What Files Were Actually Changed

### Step 1: Review emailFiles.ts changes
### Step 2: Review DealerDetail.tsx changes
### Step 3: Look for any validation that could block emails

---

## Phase 3: Test Plan

### Test 1: Check Dealer Data Fetch
- Endpoint: GET `/dealers/:id`
- Expected: Dealer object with email field
- Verify: `dealer.email` exists and is not null

### Test 2: Check Email Send Endpoint
- Endpoint: POST `/email-files/send`
- Payload: { to, subject, body, dealerId }
- Expected: 200 OK
- Verify: Email sends successfully

### Test 3: Check Button Disable Logic
- File: `frontend/src/pages/DealerDetail.tsx`
- Logic: `disabled={sendingEmail || !dealer?.email || !emailSubject.trim()}`
- Verify: All conditions evaluate correctly

---

## Phase 4: Fix Strategy

### If dealer has no email:
- Guide user to add email to dealer record

### If dealer data fetch is broken:
- Check `/dealers/:id` endpoint
- Fix backend route if needed
- Verify database query

### If email sending is broken:
- Check `/email-files/send` endpoint
- Review email history saving code
- Fix any blocking errors

### If dealerId validation is broken:
- Make dealerId optional in backend
- Ensure backward compatibility

---

## Phase 5: Testing Protocol

### Manual Test Steps:
1. Start backend locally: `cd backend && npm run dev`
2. Start frontend locally: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`
4. Login
5. Navigate to dealer "skolnick"
6. Check if email field is populated
7. Try to send email
8. Check browser console for errors
9. Check backend terminal for errors

### API Test Steps:
1. Test dealer fetch: `curl http://localhost:5000/api/dealers/:id`
2. Verify email field in response
3. Test email send: `curl -X POST http://localhost:5000/api/email-files/send`
4. Check for errors in response

---

## Phase 6: Evidence Collection

### Screenshots I Will Provide:
1. Dealer API response showing email field
2. Email send API response
3. Browser console (no errors)
4. Backend terminal (no errors)
5. Email button enabled and working

---

## Timeline:
- Phase 1-2: Review code (5 min)
- Phase 3: Testing (10 min)
- Phase 4: Fix (10 min)
- Phase 5: Validation (5 min)
- Phase 6: Documentation (5 min)

**Total: 35 minutes of actual work**

---

## Commitment:
I will NOT say "it's fixed" until I have:
1. ✅ Actually run the app locally
2. ✅ Tested email sending myself
3. ✅ Captured screenshots of working functionality
4. ✅ Verified on Digital Ocean
