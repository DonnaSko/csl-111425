# Run Email Attachment Migration on DigitalOcean

## ✅ Code Has Been Pushed

All code changes have been committed and pushed to GitHub. DigitalOcean will automatically deploy them.

## 🚀 How to Apply the Migration

Once the deployment completes (wait 2-3 minutes), you have **2 options**:

---

### **Option 1: Let It Run Automatically (EASIEST)**

The migration will run automatically on the next deployment because it's in the migrations folder.

**Just wait for:**
1. DigitalOcean to finish deploying (check your DigitalOcean dashboard)
2. Build to succeed
3. App to restart

**That's it!** The migration will be applied automatically.

---

### **Option 2: Run Migration Script via DigitalOcean Console**

If you want to run it manually:

1. Go to DigitalOcean → Your App
2. Click on the **backend** component
3. Click **"Console"** tab
4. Run this command:

```bash
npm run migrate:email-fix
```

Or use the built-in Prisma command:

```bash
npm run prisma:migrate
```

---

## 🧪 How to Verify Migration Worked

### Check 1: Database Column Exists

Go to DigitalOcean Database → Query Console and run:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'csl' 
  AND table_name = 'EmailFile'
  AND column_name = 'content';
```

**Expected result:** Should show one row with `content` column of type `bytea`

### Check 2: Test File Upload

1. Go to your app
2. Navigate to any dealer page
3. Upload a new email file (PDF or image)
4. Check backend logs - should see: "Storing file content in database (not on disk)"

### Check 3: Test Email with Attachment

1. Select the newly uploaded file
2. Send an email
3. Check backend logs - should see: "Using file content from database"
4. Check recipient's inbox - attachment should be there!

---

## 📊 What to Expect

**Before Migration:**
- Uploads work, but files only saved to disk
- Emails send, but 0 attachments
- Logs: "File not found on disk"

**After Migration:**
- Uploads save to database
- Emails send WITH attachments
- Logs: "Using file content from database"

---

## ⚠️ Important Notes

1. **Old email files won't work** - They only have paths, no content. Delete them and re-upload.

2. **Wait for deployment** - Don't test until DigitalOcean shows "Active" status.

3. **Check logs** - DigitalOcean Runtime Logs will show if migration succeeded.

---

## 🆘 If Something Goes Wrong

**If migration fails:**
- Check DigitalOcean build logs for errors
- Check runtime logs for migration errors
- The migration script has `IF NOT EXISTS` so it's safe to run multiple times

**If attachments still don't work:**
- Verify migration ran (check database column exists)
- Verify new files were uploaded (not using old ones)
- Check backend logs for specific error messages

---

## ✅ Success Checklist

- [ ] Code deployed to DigitalOcean (check dashboard)
- [ ] Migration applied (check database or logs)
- [ ] Old email files deleted in app
- [ ] New file uploaded successfully
- [ ] Email sent with attachment
- [ ] Attachment received in inbox
- [ ] Backend logs show "Using file content from database"

Once all checked, the email attachment issue is **permanently fixed**! 🎉

