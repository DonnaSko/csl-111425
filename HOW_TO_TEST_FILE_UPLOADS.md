# How to Test File Upload Functionality

## Quick Start Testing Guide

### Prerequisites
1. ✅ Make sure you're logged into the application
2. ✅ Ensure you have an active subscription
3. ✅ Have test files ready in different formats

---

## Step-by-Step Testing Instructions

### Test 1: CSV File Upload (Most Important)

**What to Test**: Upload a CSV file with dealer data

**Steps**:
1. Navigate to the **Dealers** tab in your application
2. Click the **"📤 Upload Files"** button (top right)
3. Click the file input area
4. Select a CSV file (`.csv` extension)
5. Wait for the file to be processed

**Expected Results**:
- ✅ File should be parsed successfully
- ✅ You should see a "Review Import" screen showing:
  - Total number of rows found
  - Number of new dealers
  - Number of potential duplicates
- ✅ You can then import the dealers or skip duplicates

**What Success Looks Like**:
```
Review Import
┌─────────────┬─────────────┬─────────────┐
│ Total Rows  │ New Dealers │ Duplicates  │
│     25      │     20      │      5      │
└─────────────┴─────────────┴─────────────┘
```

**If It Fails**:
- Check browser console (F12 → Console tab) for errors
- Look for error message in red box on screen
- Check backend logs if you have access

---

### Test 2: PDF File Upload

**What to Test**: Upload a PDF document

**Steps**:
1. Click **"📤 Upload Files"** button
2. Select a PDF file (`.pdf` extension)
3. Wait for upload to complete

**Expected Results**:
- ✅ File uploads successfully
- ✅ You see a green success message: `File "yourfile.pdf" uploaded successfully`
- ✅ Modal shows "Import Complete!" screen
- ✅ Click "Done" to close

**What Success Looks Like**:
```
Import Complete!
File "document.pdf" uploaded successfully
[Done Button]
```

**If It Fails**:
- Error message will appear in red
- Check if file is larger than 50MB
- Verify file extension is `.pdf`

---

### Test 3: Word Document Upload

**What to Test**: Upload a Microsoft Word document

**Steps**:
1. Click **"📤 Upload Files"** button
2. Select a Word file (`.doc` or `.docx` extension)
3. Wait for upload

**Expected Results**:
- ✅ File uploads successfully
- ✅ Success message appears
- ✅ No errors in console

**Test Both Formats**:
- Try `.doc` (older Word format)
- Try `.docx` (newer Word format)

---

### Test 4: Excel File Upload

**What to Test**: Upload an Excel spreadsheet

**Steps**:
1. Click **"📤 Upload Files"** button
2. Select an Excel file (`.xls` or `.xlsx` extension)
3. Wait for upload

**Expected Results**:
- ✅ File uploads successfully
- ✅ Success message appears

**Test Both Formats**:
- Try `.xls` (older Excel format)
- Try `.xlsx` (newer Excel format)

---

### Test 5: Text File Upload

**What to Test**: Upload a plain text file

**Steps**:
1. Click **"📤 Upload Files"** button
2. Select a text file (`.txt` extension)
3. Wait for upload

**Expected Results**:
- ✅ File uploads successfully
- ✅ Success message appears

---

### Test 6: Invalid File Type (Error Handling)

**What to Test**: Verify error handling for unsupported files

**Steps**:
1. Click **"📤 Upload Files"** button
2. Try to select an invalid file type:
   - `.exe` (executable)
   - `.zip` (archive)
   - `.jpg` (image)
   - `.mp4` (video)

**Expected Results**:
- ✅ Error message appears: `File type not supported. Allowed types: CSV, PDF, XLS, XLSX, DOC, DOCX, PAGES, TXT, RTF`
- ✅ File is NOT uploaded
- ✅ You can try again with a valid file

**What Success Looks Like**:
```
Error: File type not supported. Allowed types: CSV, PDF, XLS, XLSX, DOC, DOCX, PAGES, TXT, RTF. Received: .exe
```

---

### Test 7: Large File Upload

**What to Test**: Upload a file larger than 10MB (previously would fail)

**Steps**:
1. Click **"📤 Upload Files"** button
2. Select a file between 10MB and 50MB
3. Wait for upload (may take longer)

**Expected Results**:
- ✅ File uploads successfully (this is NEW - previously would fail)
- ✅ Success message appears
- ✅ Upload may take 30-60 seconds for large files

**If It Fails**:
- If file is larger than 50MB, you'll get an error about file size limit
- This is expected behavior

---

### Test 8: Very Large File (Size Limit)

**What to Test**: Verify 50MB file size limit

**Steps**:
1. Click **"📤 Upload Files"** button
2. Try to upload a file larger than 50MB

**Expected Results**:
- ✅ Error message: `File too large. Maximum size is 50MB`
- ✅ File is NOT uploaded

---

## How to Verify Everything is Working

### ✅ Success Indicators

1. **No Console Errors**:
   - Open browser Developer Tools (F12)
   - Go to Console tab
   - Should see no red error messages during upload

2. **Files Appear on Server**:
   - Files should be saved in the `uploads` directory on your server
   - Check server logs for: `File uploaded successfully`

3. **User-Friendly Messages**:
   - Success messages are clear and helpful
   - Error messages explain what went wrong

### 🔍 Debugging Checklist

If something doesn't work:

1. **Check Browser Console**:
   ```
   - Press F12
   - Go to Console tab
   - Look for red error messages
   - Take a screenshot of any errors
   ```

2. **Check Network Tab**:
   ```
   - Press F12
   - Go to Network tab
   - Try uploading a file
   - Look for the POST request to /uploads/document
   - Check the response status (should be 201 for success)
   - Check the response body for error messages
   ```

3. **Check Authentication**:
   ```
   - Make sure you're logged in
   - Check that your subscription is active
   - Try logging out and back in
   ```

4. **Check File Properties**:
   ```
   - Verify file extension is correct
   - Check file size (should be under 50MB)
   - Make sure file isn't corrupted
   ```

---

## Quick Test Checklist

Use this checklist to verify all functionality:

- [ ] CSV file uploads and parses correctly
- [ ] PDF file uploads successfully
- [ ] DOC file uploads successfully
- [ ] DOCX file uploads successfully
- [ ] XLS file uploads successfully
- [ ] XLSX file uploads successfully
- [ ] TXT file uploads successfully
- [ ] Invalid file types show proper error message
- [ ] Files larger than 10MB upload successfully (NEW!)
- [ ] Files larger than 50MB show size limit error
- [ ] Error messages are clear and helpful
- [ ] No console errors during uploads

---

## Testing on Local Development

If you want to test locally before deployment:

### Start Backend:
```bash
cd backend
npm install
npm run dev
```

### Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Test:
1. Open browser to `http://localhost:5173` (or your frontend port)
2. Log in
3. Follow the testing steps above

---

## Testing on Production/Deployed Version

1. Wait for deployment to complete (if auto-deploy is enabled)
2. Navigate to your production URL
3. Log in
4. Follow the testing steps above

**Note**: If you just pushed the code, wait 2-5 minutes for DigitalOcean to deploy the changes.

---

## What Changed (For Reference)

### Before:
- ❌ File uploads failed for many file types
- ❌ MIME type validation was too strict
- ❌ 10MB file size limit was too small
- ❌ Generic error messages

### After:
- ✅ All supported file types work correctly
- ✅ Extension-based validation (more reliable)
- ✅ 50MB file size limit
- ✅ Clear, helpful error messages
- ✅ Better error handling and logging

---

## Need Help?

If you encounter issues:

1. **Check the error message** - it should tell you what's wrong
2. **Check browser console** - look for detailed error information
3. **Check server logs** - look for file upload errors
4. **Verify file type** - make sure it's one of the supported types
5. **Check file size** - must be under 50MB

---

## Expected Test Results Summary

| File Type | Extension | Expected Result |
|-----------|-----------|-----------------|
| CSV | `.csv` | ✅ Parses and shows review screen |
| PDF | `.pdf` | ✅ Uploads successfully |
| Word (old) | `.doc` | ✅ Uploads successfully |
| Word (new) | `.docx` | ✅ Uploads successfully |
| Excel (old) | `.xls` | ✅ Uploads successfully |
| Excel (new) | `.xlsx` | ✅ Uploads successfully |
| Text | `.txt` | ✅ Uploads successfully |
| Pages | `.pages` | ✅ Uploads successfully |
| RTF | `.rtf` | ✅ Uploads successfully |
| Invalid | `.exe`, `.zip`, etc. | ❌ Shows error message |

---

**Good luck with testing!** 🚀

If everything works as expected, the file upload functionality is now fully operational.

