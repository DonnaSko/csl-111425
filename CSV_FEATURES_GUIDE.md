# CSV Import/Export Features Guide

## ✅ All Features Implemented!

### 1. CSV Upload for Dealers
**Location:** Dealers page → "📤 Bulk Upload CSV" button

**How it works:**
- Click "Bulk Upload CSV" on the Dealers page
- Select a CSV file from your computer
- The system automatically detects column names (case-insensitive)
- Required column: **Company Name**
- Optional columns: Contact Name, Email, Phone, City, State, Zip, Country, Address, Buying Group, Status

**Supported column name variations:**
- Company Name: `companyname`, `company`, `company name`, `business name`, `businessname`
- Contact Name: `contactname`, `contact`, `contact name`, `name`, `person`
- Email: `email`, `e-mail`, `email address`
- Phone: `phone`, `telephone`, `tel`, `phone number`, `phonenumber`
- And more...

### 2. Duplicate Detection & Removal
**How it works:**
- After uploading CSV, the system checks for duplicates
- Duplicates are identified by matching:
  - Company Name (case-insensitive)
  - Email (if provided)
  - Phone (if provided)
- You'll see a review screen showing:
  - **Total Rows** - All rows in your CSV
  - **New Dealers** - Dealers that don't exist yet
  - **Potential Duplicates** - Dealers that match existing records

**Options:**
- **Skip Duplicates** - Import only new dealers, skip all duplicates
- **Select Specific Duplicates** - Check boxes next to duplicates you want to import anyway
- **Import Selected** - Import new dealers + selected duplicates

### 3. Delete Dealers
**Location:** Dealers page → 🗑️ button next to each dealer

**How it works:**
- Click the 🗑️ icon next to any dealer
- Confirm deletion
- Dealer is immediately removed from the list

**Note:** This action cannot be undone. All associated notes, photos, and recordings will also be deleted.

### 4. Export Trade Show Leads to CSV
**Location:** Trade Shows page → "📥 Export Leads" button

**How it works:**
1. Go to Trade Shows page
2. Find the trade show you want to export
3. Click "📥 Export Leads" button
4. CSV file downloads automatically with filename: `trade-show-[name]-[date].csv`

**What's included in the export:**
- Company Name
- Contact Name
- Email
- Phone
- City, State, Zip, Country, Address
- Buying Group
- Status
- Rating
- Most Recent Note
- Photo Count
- Captured At (when dealer was added to trade show)

**Perfect for:**
- Importing back into your CRM
- Sharing with team members
- Creating reports
- Backup purposes

## Example CSV Format

```csv
Company Name,Contact Name,Email,Phone,City,State,Zip,Buying Group,Status
ABC Distributors,John Smith,john@abc.com,555-1234,New York,NY,10001,Group A,Active
XYZ Corp,Jane Doe,jane@xyz.com,555-5678,Los Angeles,CA,90001,Group B,Prospect
```

## Technical Details

### Backend Endpoints
- `POST /api/dealers/bulk-import` - Import dealers from CSV
- `POST /api/dealers/check-duplicates` - Check for duplicates before import
- `DELETE /api/dealers/:id` - Delete a dealer
- `GET /api/trade-shows/:id/export` - Export trade show leads to CSV

### Frontend Components
- `CSVUpload.tsx` - Complete CSV upload flow with duplicate detection
- `Dealers.tsx` - Updated with delete functionality
- `TradeShows.tsx` - Complete trade show management with export

## Next Steps

1. **Test CSV Upload:**
   - Create a test CSV file with a few dealers
   - Upload it and verify duplicates are detected
   - Test both "Skip Duplicates" and "Import Selected" options

2. **Test Delete:**
   - Delete a test dealer
   - Verify it's removed from the list

3. **Test Export:**
   - Create a trade show
   - Add some dealers to it
   - Export the leads
   - Open the CSV in Excel/Google Sheets to verify format

## Troubleshooting

**CSV upload fails:**
- Make sure your CSV has a "Company Name" column
- Check that the file is actually a CSV (not Excel)
- Ensure column names are readable (the system is flexible with naming)

**Duplicates not detected:**
- The system matches on Company Name + Email + Phone
- If email/phone are missing, it will only match on Company Name
- Very similar names (like "ABC Corp" vs "ABC Corporation") may not be detected as duplicates

**Export button disabled:**
- The export button is disabled if the trade show has 0 dealers
- Add dealers to the trade show first, then export

## Questions?

If you encounter any issues, check:
1. Browser console for errors (F12 → Console tab)
2. Network tab to see API responses
3. Backend logs in DigitalOcean

