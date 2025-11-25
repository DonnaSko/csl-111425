# Step-by-Step: Deploy and Test CSV Features

## Step 1: Commit and Push Your Changes

### 1.1 Check what files changed
```bash
git status
```

You should see:
- `backend/src/utils/prisma.ts` (connection leak fix)
- `backend/src/utils/prisma.ts` (new file)
- `backend/src/routes/dealers.ts` (CSV import endpoints)
- `backend/src/routes/tradeShows.ts` (export endpoint)
- `frontend/src/components/CSVUpload.tsx` (new file)
- `frontend/src/pages/Dealers.tsx` (CSV upload UI + delete)
- `frontend/src/pages/TradeShows.tsx` (export functionality)
- `frontend/package.json` (papaparse added)

### 1.2 Add all changes
```bash
git add .
```

### 1.3 Commit changes
```bash
git commit -m "Add CSV import/export features and fix database connection leaks"
```

### 1.4 Push to GitHub
```bash
git push origin main
```

**What happens:** DigitalOcean will automatically detect the push and start deploying (since auto-deploy is enabled).

---

## Step 2: Monitor Deployment

### 2.1 Go to DigitalOcean Dashboard
1. Open: https://cloud.digitalocean.com
2. Navigate to: **Apps** → **csl-111425** (or your app name)
3. Click on the **Activity** tab

### 2.2 Watch for deployment
- You should see a new deployment starting
- Status will show: "Building" → "Deploying" → "Live"
- This usually takes 3-5 minutes

### 2.3 Check for errors
- If deployment fails, check the **Build Logs** tab
- Look for any error messages
- Common issues:
  - Missing dependencies (should auto-install)
  - Build errors (check logs)

**Wait until deployment shows "Live" or "Success"**

---

## Step 3: Test CSV Upload Feature

### 3.1 Create a test CSV file
1. Open Excel, Google Sheets, or any text editor
2. Create a file with this content (save as `test-dealers.csv`):

```csv
Company Name,Contact Name,Email,Phone,City,State,Zip,Buying Group,Status
ABC Distributors,John Smith,john@abc.com,555-1234,New York,NY,10001,Group A,Active
XYZ Corp,Jane Doe,jane@xyz.com,555-5678,Los Angeles,CA,90001,Group B,Prospect
Test Company,Bob Johnson,bob@test.com,555-9999,Chicago,IL,60601,Group C,Active
```

3. Save the file on your computer

### 3.2 Test the upload
1. Go to your app: `https://csl-bjg7z.ondigitalocean.app` (or your URL)
2. Login with your account
3. Go to **Dealers** page
4. Click **"📤 Bulk Upload CSV"** button
5. Select your `test-dealers.csv` file
6. Review the duplicate detection screen
7. Click **"Import"** (or "Skip Duplicates & Import")

### 3.3 Verify dealers were imported
- Check the Dealers list
- You should see the 3 dealers from your CSV
- If any were duplicates, they should be marked

---

## Step 4: Test Duplicate Detection

### 4.1 Upload the same CSV again
1. Click **"📤 Bulk Upload CSV"** again
2. Upload the same `test-dealers.csv` file
3. You should see:
   - **Total Rows:** 3
   - **New Dealers:** 0 (or fewer)
   - **Potential Duplicates:** 3 (or more)

### 4.2 Test duplicate options
- Try **"Skip Duplicates & Import"** - should import 0
- Try selecting some duplicates and **"Import"** - should import selected ones

---

## Step 5: Test Delete Feature

### 5.1 Delete a dealer
1. On the Dealers page, find a dealer you want to delete
2. Click the **🗑️** icon next to the dealer
3. Confirm deletion
4. Verify the dealer is removed from the list

---

## Step 6: Test Trade Show Export

### 6.1 Create a trade show (if needed)
1. Go to **Trade Shows** page
2. Click **"➕ Create Trade Show"**
3. Fill in:
   - Name: "Test Trade Show 2024"
   - Location: "Las Vegas"
   - Start Date: Today
   - End Date: Tomorrow
4. Click **"Create Trade Show"**

### 6.2 Add dealers to trade show
1. Click **"View Details"** on the trade show
2. Add some dealers to the trade show
3. Go back to Trade Shows list

### 6.3 Export leads
1. Find your trade show in the list
2. Click **"📥 Export Leads"** button
3. CSV file should download automatically
4. Open the CSV file
5. Verify it contains:
   - All dealer information
   - Most recent notes
   - Photo counts
   - Captured dates

---

## Step 7: Verify Everything Works

### Checklist:
- [ ] CSV upload works
- [ ] Duplicate detection works
- [ ] Can skip duplicates
- [ ] Can import selected duplicates
- [ ] Delete dealer works
- [ ] Trade show export works
- [ ] CSV file downloads correctly
- [ ] CSV file has correct data

---

## Troubleshooting

### If CSV upload fails:
- Check browser console (F12 → Console tab)
- Check Network tab for API errors
- Verify CSV file format (must have "Company Name" column)

### If export doesn't work:
- Make sure trade show has dealers added
- Check browser console for errors
- Verify backend logs in DigitalOcean

### If deployment fails:
- Check Build Logs in DigitalOcean
- Verify all dependencies are in package.json
- Check for TypeScript errors

---

## Next Steps After Testing

Once everything works:
1. Test with your real dealer CSV file
2. Create real trade shows
3. Export leads after trade shows
4. Import exported CSV back into your CRM

---

## Need Help?

If something doesn't work:
1. Check DigitalOcean logs (Runtime Logs tab)
2. Check browser console (F12)
3. Share the error message you see

