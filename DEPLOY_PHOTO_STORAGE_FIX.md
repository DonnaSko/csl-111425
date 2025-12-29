# Deploy Photo Storage Fix - Badge Scanning Feature

## 🎯 WHAT THIS FIX DOES

**ROOT CAUSE:** Badge photos were stored on local disk only. When deployed to DigitalOcean, photos don't exist there (only database records do), so badge photos are lost.

**THE FIX:** Store photo content in the database itself, so photos are available wherever the database is (local and production).

## 📋 WHY THIS IS CRITICAL

The badge scanning feature is core to your app:
1. ✅ **Scan badge** - Working (Tesseract.js OCR)
2. ✅ **Read Name and Company** - Working (OCR extraction)
3. ✅ **Find exact match** - Working (fuzzy search with scoring)
4. ✅ **Show best matches** - Working (displays matching dealers)
5. ❌ **Save photo to dealer file** - **BROKEN** in production (photos stored on disk)

Without this fix, badge photos disappear when deployed to DigitalOcean!

## 📋 DEPLOYMENT STEPS

### Step 1: Apply Database Migration

The migration adds a `content` column to store photo data in the database.

**Option A: Through DigitalOcean Console (RECOMMENDED)**

1. Go to your DigitalOcean Database
2. Open the console/query interface
3. Run this SQL:

```sql
-- Add content column to store photo data
ALTER TABLE "csl"."Photo" 
ADD COLUMN "content" BYTEA;

-- Make path nullable since we'll use content instead
ALTER TABLE "csl"."Photo" 
ALTER COLUMN "path" DROP NOT NULL;
```

**Option B: Through Prisma Migrate (if you have database access)**

```bash
cd backend
npx prisma migrate deploy
```

### Step 2: Commit and Push Code

```bash
git add .
git commit -m "Fix: Store badge photos in database instead of disk"
git push origin main
```

### Step 3: Wait for Deployment

DigitalOcean will automatically deploy the new code. Wait for the build to complete.

### Step 4: Test Badge Scanning

**Test the complete flow:**

1. Open the app on your phone or desktop
2. Go to "Capture Lead" page
3. Click "Scan Badge / Take Photo"
4. Take a photo of a badge
5. Wait for OCR to complete (shows "Scanning badge...")
6. **Expected results:**
   - If exact match found: Navigate directly to dealer page with badge photo attached
   - If multiple matches: Show list of matching dealers to choose from
   - If no matches: Auto-fill form with extracted name/company
7. Verify badge photo appears in the dealer's Photos section
8. Refresh the page - photo should still be there!

## 🔍 HOW TO VERIFY IT'S WORKING

### Check Backend Logs (DigitalOcean Runtime Logs)

**Before Fix (BROKEN):**
```
Photo uploaded to disk: /app/uploads/badge-12345.jpg
(Photo is lost when deployment restarts)
```

**After Fix (WORKING):**
```
Photo stored in database: badge-scan.jpg (1.2 MB)
Content length: 1234567 bytes
```

### Check Browser Console

After scanning a badge and selecting a dealer, check the Network tab:
- Look for POST request to `/uploads/photo/:dealerId`
- Response should include: `"content": "[Buffer]"` (not `"path": "..."`)

## 📊 WHAT CHANGED

### Database Schema (`backend/prisma/schema.prisma`)
- Added `content Bytes?` column to store photo data
- Made `path String?` optional (was required)

### Upload Endpoint (`backend/src/routes/uploads.ts`)
- Now reads photo into buffer
- Stores buffer in database `content` column
- Deletes temporary file after storing in database
- Applies to ALL photo uploads (badges, business cards, etc.)

### Get Endpoint (`backend/src/routes/uploads.ts`)
- Reads photo content from database (not disk)
- Falls back to disk for old photos (backward compatibility)
- Logs clearly show source: "from database" or "from disk (legacy)"

### Delete Endpoint (`backend/src/routes/uploads.ts`)
- Checks for old photos on disk before deleting
- Removes database record

## ⚠️ IMPORTANT NOTES

1. **Old photos won't work** - They only have database records, no content. Users must re-scan badges.

2. **Database size will increase** - Photos are now stored in database. For typical use (a few badge scans per tradeshow), this is fine. PostgreSQL handles BLOBs efficiently.

3. **No more file sync issues** - Photos are always available wherever database is. No need to worry about deployment wiping photos.

4. **Backward compatible** - If an old photo somehow has content on disk, it will still work (fallback logic).

## 🧪 TESTING CHECKLIST

### Database Migration
- [ ] Database migration applied successfully
- [ ] `Photo` table has `content` column (type: BYTEA)
- [ ] `Photo` table has `path` column (nullable)

### Code Deployment
- [ ] Code deployed to DigitalOcean
- [ ] No deployment errors
- [ ] App loads successfully

### Badge Scanning Flow
- [ ] Take photo of badge
- [ ] OCR extracts text (shows "Scanning badge...")
- [ ] Search finds matching dealers
- [ ] Select dealer (or create new)
- [ ] Badge photo appears in dealer's Photos section
- [ ] Photo persists after page refresh
- [ ] Photo persists after app redeployment

### Backend Logs
- [ ] Logs show "Photo stored in database"
- [ ] Content length logged
- [ ] No "File not found" errors

## 🚀 EXPECTED RESULTS

**Success Indicators:**
- ✅ Badge photos appear in dealer profiles
- ✅ Photos survive app redeployments
- ✅ Backend logs: "Photo stored in database"
- ✅ No "Photo file content not available" errors

**If It Still Doesn't Work:**
1. Check database migration was applied (query the Photo table, verify `content` column exists)
2. Check new photos have content in database (not just path)
3. Check backend logs for specific error messages
4. Try uploading a new badge photo (not using old records)

## 📝 ROLLBACK PLAN (if needed)

If something goes wrong:

1. Revert code:
```bash
git revert HEAD
git push origin main
```

2. Database migration is safe to keep (adds optional column, doesn't break anything)

3. Old behavior will resume (trying to read from disk, which won't work for production)

## 🎓 WHY THIS FIX WORKS

**Before:**
- Photos stored on local machine only
- Database has paths like `/Users/donnaskolnick/uploads/...`
- Production server doesn't have those files
- Result: Badge photos lost after deployment

**After:**
- Photos stored in database as binary data (Bytes)
- Database is shared between local and production
- Photos available everywhere database is
- Result: Badge photos persist across deployments!

## 🔗 RELATED FIXES

This is the same pattern as:
- Email attachment fix (already deployed)
- Voice recording fix (already deployed)

Now ALL file uploads (photos, voice recordings, email attachments) are stored in the database!

This is the definitive fix for the badge photo storage issue.

