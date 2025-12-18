# Email Attachment Fix - FormData Approach

## Problem
Email attachments were not being sent. Files exist in database but not on disk, causing path resolution to fail.

## Solution
Changed from sending `fileIds` to sending actual files via `FormData`. This guarantees files exist at send-time.

## Changes Made

### Backend (`backend/src/routes/emailFiles.ts`)

1. **Added file download endpoint** (`GET /email-files/:id/download`)
   - Allows frontend to fetch file content by ID
   - Handles path resolution with fallbacks

2. **Modified `/send` endpoint** to accept `multipart/form-data`
   - Changed from JSON to `upload.array('files')` (multer)
   - Processes files directly from FormData
   - Converts files to Buffer content
   - Cleans up temporary files after sending

3. **Attachment format**:
   ```typescript
   {
     filename: string,
     content: Buffer,  // File content as Buffer
     contentType: string  // MIME type (application/pdf, image/jpeg, etc.)
   }
   ```

### Frontend (`frontend/src/pages/DealerDetail.tsx`)

1. **Changed from JSON to FormData**
   - Fetches actual file content for selected files
   - Creates FormData with files and email fields
   - Sends multipart/form-data request

2. **File fetching process**:
   - For each selected file ID, fetch from `/email-files/:id/download`
   - Convert response to File object
   - Append to FormData as 'files'

### Email Utility (`backend/src/utils/email.ts`)

1. **Updated to handle both formats**:
   - FormData attachments: `{ filename, content: Buffer, contentType }`
   - Legacy attachments: `{ filename, path }` (for backward compatibility)

2. **Processes attachments**:
   - If `content` exists → use directly (from FormData)
   - If `path` exists → read from disk (legacy)
   - Converts to Buffer format for nodemailer

## Test Plan

### Prerequisites
1. Have at least 2 email files uploaded (one PDF, one JPG)
2. Be logged into the app
3. Have a dealer selected with an email address

### Test Steps

1. **Navigate to Dealer Detail Page**
   - Go to a dealer that has an email address
   - Scroll to "Emails" section

2. **Select Files to Attach**
   - Check boxes for 2 files (PDF and JPG)
   - Verify checkboxes stay checked

3. **Fill Email Form**
   - Enter subject: "Test with Attachments"
   - Enter message body (optional)
   - Add CC if needed (optional)

4. **Send Email**
   - Click "Send Email" button
   - Wait for response

5. **Check Browser Console** (F12 → Console)
   - Look for logs starting with `[Email]`
   - Should see:
     - `[Email] Fetching X file(s) to attach...`
     - `[Email] ✓ Fetched and added file: filename.pdf`
     - `[Email] Sending FormData with X file(s)`
     - `[Email] Email send response:` with `attachmentsSent: X`

6. **Check Backend Logs** (DigitalOcean Runtime Logs)
   - Look for `[Email] ===== EMAIL SEND REQUEST START (FormData) =====`
   - Should see:
     - `[Email] Files received in FormData: X`
     - `[Email] Processing file: filename.pdf`
     - `[Email] ✓ File read successfully`
     - `[Email] ✓ Added attachment: filename.pdf`
     - `[Email] Total attachments prepared: X`

7. **Verify Email Received**
   - Check the recipient's email inbox
   - Email should have attachments
   - Attachments should be PDF and JPG files

### Expected Results

✅ **Success Indicators:**
- Console shows files were fetched and added to FormData
- Backend logs show files received and processed
- Response shows `attachmentsSent` matches files sent
- Email received with attachments
- No errors in console or backend logs

❌ **Failure Indicators:**
- Console shows "Failed to fetch file" errors
- Backend logs show "0 attachments prepared"
- Response shows `attachmentsSent: 0`
- Email received without attachments
- Errors in console or backend logs

### Debugging

If attachments don't work:

1. **Check Browser Console:**
   - Are files being fetched? (`[Email] Fetched and added file`)
   - Is FormData being created? (`[Email] Sending FormData with X file(s)`)
   - Any fetch errors?

2. **Check Backend Logs:**
   - Are files received? (`Files received in FormData: X`)
   - Are files being processed? (`Processing file: filename`)
   - Are attachments prepared? (`Total attachments prepared: X`)

3. **Check Network Tab:**
   - Is request Content-Type `multipart/form-data`?
   - Does request include files?
   - What's the response status?

## Why This Should Work

1. **Files exist at send-time**: Files are fetched from database and sent immediately
2. **No path resolution needed**: Files are in memory as Buffers
3. **Guaranteed file content**: FormData contains actual file data, not references
4. **Standard approach**: This is how file uploads typically work

## Instrumentation Added

- Frontend: Logs file fetching, FormData creation, and API responses
- Backend: Logs FormData receipt, file processing, and attachment preparation
- Email utility: Logs attachment processing with content/Buffer details

All logs are written to: `/Users/donnaskolnick/Desktop/CSL- 11-14-25/.cursor/debug.log`

