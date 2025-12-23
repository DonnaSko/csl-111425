# Deploy Email Attachment Fix - Step by Step

## 🎯 WHAT THIS FIX DOES

**ROOT CAUSE:** Email files were stored on local disk only. When deployed to DigitalOcean, files don't exist there (only database records do), so 0 attachments are sent.

**THE FIX:** Store file content in the database itself, so files are available wherever the database is (local and production).

## 📋 DEPLOYMENT STEPS

### Step 1: Apply Database Migration

The migration adds a `content` column to store file data in the database.

**Option A: Through DigitalOcean Console (RECOMMENDED)**

1. Go to your DigitalOcean Database
2. Open the console/query interface
3. Run this SQL:

```sql
-- Add content column to store file data
ALTER TABLE "csl"."EmailFile" 
ADD COLUMN "content" BYTEA;

-- Make path nullable since we'll use content instead
ALTER TABLE "csl"."EmailFile" 
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
git commit -m "Fix: Store email attachments in database instead of disk"
git push origin main
```

### Step 3: Wait for Deployment

DigitalOcean will automatically deploy the new code. Wait for the build to complete.

### Step 4: Delete Old Email Files

Old email files only have database records (no actual file content). Users need to delete and re-upload them.

**In the app:**
1. Go to any dealer page
2. Scroll to "Email Files" section
3. Delete all existing files (they won't work anyway)
4. Upload fresh files (these will be stored in database)

### Step 5: Test

1. Upload a new email file (PDF or image)
2. Select it for an email
3. Send email with attachment
4. Check recipient's inbox - attachment should be there!

## 🔍 HOW TO VERIFY IT'S WORKING

### Check Backend Logs (DigitalOcean Runtime Logs)

**Before Fix (BROKEN):**
```
[Email] ✗ File not found on disk: myfile.pdf
[Email] Tried paths: [list of paths]
attachmentsSent: 0
```

**After Fix (WORKING):**
```
[Email] ✓ Using file content from database: myfile.pdf (245 KB)
attachmentsSent: 1
```

### Check Browser Console

**Before Fix:**
```
attachmentsSent: 0
attachmentsRequested: 1
```

**After Fix:**
```
attachmentsSent: 1
attachmentsRequested: 1
```

## 📊 WHAT CHANGED

### Database Schema (`backend/prisma/schema.prisma`)
- Added `content Bytes?` column to store file data
- Made `path String?` optional (was required)

### Upload Endpoint (`backend/src/routes/emailFiles.ts`)
- Now reads file into buffer
- Stores buffer in database `content` column
- Deletes temporary file after storing in database

### Send Endpoint (`backend/src/routes/emailFiles.ts`)
- Reads file content from database (not disk)
- Falls back to disk for old files (backward compatibility)
- Logs clearly show source: "from database" or "from disk (legacy)"

## ⚠️ IMPORTANT NOTES

1. **Old files won't work** - They only have database records, no content. Users must delete and re-upload.

2. **Database size will increase** - Files are now stored in database. For typical use (a few PDFs/images per company), this is fine. PostgreSQL handles BLOBs efficiently.

3. **No more file sync issues** - Files are always available wherever database is. No need to worry about deployment wiping files.

4. **Backward compatible** - If an old file somehow has content on disk, it will still work (fallback logic).

## 🧪 TESTING CHECKLIST

- [ ] Database migration applied successfully
- [ ] Code deployed to DigitalOcean
- [ ] Old email files deleted
- [ ] New file uploaded successfully
- [ ] File shows in email files list
- [ ] Email sent with attachment
- [ ] Attachment received in recipient's inbox
- [ ] Backend logs show "Using file content from database"
- [ ] No errors in browser console or backend logs

## 🚀 EXPECTED RESULTS

**Success Indicators:**
- ✅ Attachments appear in received emails
- ✅ Backend logs: "Using file content from database"
- ✅ Response: `attachmentsSent` matches `attachmentsRequested`
- ✅ No "File not found" errors

**If It Still Doesn't Work:**
1. Check database migration was applied (query the EmailFile table, verify `content` column exists)
2. Check new files have content in database (not just path)
3. Check backend logs for specific error messages
4. Verify files were re-uploaded (not using old records)

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
- Files stored on local machine only
- Database has paths like `/Users/donnaskolnick/...`
- Production server doesn't have those files
- Result: 0 attachments

**After:**
- Files stored in database as binary data
- Database is shared between local and production
- Files available everywhere database is
- Result: Attachments work!

This is the definitive fix for the email attachment issue.

