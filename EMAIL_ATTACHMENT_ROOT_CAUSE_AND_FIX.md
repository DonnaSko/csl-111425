# Email Attachment Root Cause Analysis & Fix

## 🔴 ROOT CAUSE DISCOVERED

After 70+ attempts, the real problem has been identified:

### **The Problem:**
- Email files are uploaded and stored in `./uploads/email-files/` on **local filesystem**
- Database records are created with paths like `/Users/donnaskolnick/Desktop/CSL-11-14-25/uploads/email-files/1234567890-abc.pdf`
- Database is shared between local development and production (DigitalOcean)
- **When app runs on DigitalOcean, files don't exist there** - only database records do
- Backend tries to read files from disk → Files not found → 0 attachments sent

### **Why Previous Fixes Failed:**
1. **FormData approach** - Tried to download files first, but files don't exist on production server
2. **FileIds approach** - Backend tries to read from disk, but files don't exist on production server
3. **Path resolution** - No amount of path resolution helps if files physically don't exist

### **Evidence from Logs:**
```
fileIdsRequested: 2  ← Frontend selected 2 files
filesFetched: 0      ← Download failed (files don't exist on server)
attachmentsSent: 0   ← No attachments because no files
```

## ✅ THE REAL SOLUTION

### **Option 1: Store Files as BLOBs in Database (RECOMMENDED)**

**Pros:**
- Files always available wherever database is
- No file sync issues between local/production
- Simpler deployment
- Works immediately

**Cons:**
- Database size increases
- Slightly slower for very large files

**Implementation:**
1. Add `content` column to `EmailFile` table (type: `BYTEA` in PostgreSQL)
2. When uploading, store file content in database
3. When sending email, read content from database (not disk)
4. Remove file path logic entirely

### **Option 2: Use Cloud Storage (S3, DigitalOcean Spaces)**

**Pros:**
- Scalable for many/large files
- Industry standard approach
- Files accessible from anywhere

**Cons:**
- Requires additional service setup
- Monthly costs
- More complex implementation

**Implementation:**
1. Set up DigitalOcean Spaces or AWS S3
2. Upload files to cloud storage
3. Store cloud URL in database
4. Download from cloud when sending email

### **Option 3: Upload Files to Production Server**

**Pros:**
- Keeps current architecture
- No database changes needed

**Cons:**
- Files must be manually uploaded to production
- File sync issues
- Not scalable
- Fragile (files can be lost on redeployment)

## 🎯 RECOMMENDED IMPLEMENTATION: Database BLOB Storage

This is the fastest, most reliable solution for your use case.

### **Step 1: Update Database Schema**

```sql
-- Add content column to store file data
ALTER TABLE "csl"."EmailFile" 
ADD COLUMN "content" BYTEA;

-- Make path nullable since we'll use content instead
ALTER TABLE "csl"."EmailFile" 
ALTER COLUMN "path" DROP NOT NULL;
```

### **Step 2: Update Upload Endpoint**

```typescript
// backend/src/routes/emailFiles.ts
router.post('/', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { description } = req.body;

    // Read file content into buffer
    const fileContent = fs.readFileSync(req.file.path);
    
    // Store in database with content
    const file = await prisma.emailFile.create({
      data: {
        companyId: req.companyId!,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content: fileContent,  // Store file content in database
        path: req.file.path,   // Keep path for backward compatibility
        description: description || null
      }
    });

    // Delete temporary file after storing in database
    fs.unlinkSync(req.file.path);

    res.status(201).json(file);
  } catch (error: any) {
    console.error('Upload email file error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});
```

### **Step 3: Update Send Endpoint**

```typescript
// When processing fileIds, read from database content instead of disk
const file = await prisma.emailFile.findFirst({
  where: { id: fileId, companyId: req.companyId! }
});

if (!file) {
  console.error(`[Email] File not found in database: ${fileId}`);
  continue;
}

// Use content from database (not disk)
let fileContent: Buffer;
if (file.content) {
  // NEW: Read from database
  fileContent = Buffer.from(file.content);
  console.log(`[Email] ✓ Using file content from database: ${file.originalName}`);
} else {
  // FALLBACK: Try to read from disk (for old files)
  if (fs.existsSync(file.path)) {
    fileContent = fs.readFileSync(file.path);
    console.log(`[Email] ✓ Using file content from disk (legacy): ${file.originalName}`);
  } else {
    console.error(`[Email] ✗ File not found in database or disk: ${file.originalName}`);
    continue;
  }
}

// Create attachment
const attachmentObj = {
  filename: file.originalName,
  content: fileContent,
  contentType: file.mimeType
};

attachments.push(attachmentObj);
```

### **Step 4: Update Prisma Schema**

```prisma
model EmailFile {
  id          String   @id @default(cuid())
  companyId   String
  filename    String
  originalName String
  mimeType    String
  size        Int
  path        String?  // Made optional
  content     Bytes?   // NEW: Store file content
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([createdAt])
  @@schema("csl")
}
```

### **Step 5: Migration**

```bash
# Generate migration
npx prisma migrate dev --name add_email_file_content

# Apply to production
npx prisma migrate deploy
```

### **Step 6: Re-upload Existing Files**

Since existing files only have database records (no actual files), users will need to:
1. Delete old email file records
2. Re-upload files (which will now be stored in database)

## 🧪 TESTING PLAN

1. **Upload Test:**
   - Upload a PDF file
   - Verify `content` column has data in database
   - Verify file size matches

2. **Send Test:**
   - Select uploaded file
   - Send email
   - Verify attachment received
   - Check logs show "Using file content from database"

3. **Production Test:**
   - Deploy to DigitalOcean
   - Upload file in production
   - Send email with attachment
   - Verify it works

## 📊 EXPECTED RESULTS

**Before Fix:**
- Files stored on local disk only
- Production can't access files
- 0 attachments sent
- Logs show "File not found on disk"

**After Fix:**
- Files stored in database
- Available everywhere database is
- Attachments sent successfully
- Logs show "Using file content from database"

## 🚀 NEXT STEPS

1. Apply database migration
2. Update upload endpoint to store content
3. Update send endpoint to read from database
4. Test locally
5. Deploy to production
6. Have users re-upload email files
7. Test in production

This fix addresses the fundamental architecture issue and will work reliably.

