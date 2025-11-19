# Capture Show Leads - Rebuild Plan

## Project Overview
Rebuilding the Capture Show Leads application from scratch with a secure Stripe payment system and robust data isolation.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Tesseract.js** for OCR badge scanning
- **React Hook Form** for form management

### Backend
- **Node.js** with Express
- **TypeScript**
- **PostgreSQL** for database
- **Prisma** as ORM
- **JWT** for authentication
- **Stripe** for payments
- **Multer** for file uploads
- **bcrypt** for password hashing

### Infrastructure
- **File storage** for photos and voice recordings (local or S3)
- **Environment variables** for sensitive config

## Core Features

### 1. Authentication & Authorization
- User registration
- Login/logout
- JWT token-based authentication
- Password reset functionality
- Session management

### 2. Payment System (Stripe)
- **Monthly Plan**: $99/month, auto-renews unless cancelled 5+ days before renewal
- **Annual Plan**: $920/year, auto-renews unless cancelled 5+ days before renewal
- Secure paywall preventing access without active subscription
- Subscription management (cancel, view status)
- Webhook handling for subscription events

### 3. Data Isolation
- Each user belongs to a company/account
- All data scoped to user's company
- Row-level security in database
- API middleware to enforce data isolation

### 4. Dashboard
- Overview of all features
- Navigation sidebar
- Quick stats and metrics
- Recent activity feed

### 5. Dealer Management
- List all dealers with search and filters
- View individual dealer details
- Add new dealer (manual entry or badge scan)
- Edit dealer information
- Delete dealers
- Status management (Prospect, Active, etc.)
- Buying group filtering

### 6. CSV Import/Export
- Upload CSV file to bulk import dealers
- Export dealers to CSV
- CSV validation and error handling
- Template download

### 7. Badge Scanning
- Camera-based badge scanning
- OCR text extraction using Tesseract.js
- Auto-fill dealer information from badge
- Manual correction of scanned data

### 8. Business Card & Photo Capture
- Upload business card photos
- Store photos with dealer records
- View photo gallery per dealer

### 9. Voice Recordings
- Record voice notes per dealer
- Store audio files
- Playback recordings
- Transcription (optional future feature)

### 10. Notes System
- Add notes to dealers
- View note history
- Edit/delete notes
- Timestamp tracking

### 11. Lead Quality Rating
- 5-star rating system per dealer
- Store ratings with dealer records
- Filter by rating

### 12. Quick Actions
- Send email tasks
- Create snail mail tasks
- Select files to send
- Select interests
- Bulk actions

### 13. Trade Shows Management
- Create trade show events
- Associate dealers with trade shows
- Track leads by trade show

### 14. Reports & Analytics
- Daily reports
- Lead statistics
- Trade show performance
- Export reports

### 15. Duplicates Detection
- Identify duplicate dealers
- Merge duplicate records
- Manual review process

### 16. Data Verification
- Verify dealer information
- Flag incomplete records
- Data quality metrics

### 17. To-Dos
- Create tasks for dealers
- Set due dates
- Mark complete
- Filter by status

### 18. Downloads
- Export data in various formats
- Download reports
- Archive functionality

### 19. E-Business Card
- Generate digital business card
- Share card with dealers
- QR code generation

### 20. Getting Started Guide
- Tutorial for new users
- Payment instructions
- Feature walkthrough
- Best practices

## Security Requirements

1. **Paywall Security**
   - All API routes (except auth and payment) require active subscription
   - Middleware checks subscription status before allowing access
   - Frontend redirects to payment page if subscription inactive

2. **Data Isolation**
   - Database queries always filtered by company_id
   - API middleware validates user can only access their company data
   - No cross-company data leakage possible

3. **Authentication Security**
   - Passwords hashed with bcrypt
   - JWT tokens with expiration
   - Secure HTTP-only cookies for token storage
   - CSRF protection

4. **Payment Security**
   - Stripe webhooks for subscription events
   - Server-side subscription validation
   - No client-side payment bypass possible

## Database Schema

### Core Tables
- `users` - User accounts
- `companies` - Company/account information
- `subscriptions` - Stripe subscription data
- `dealers` - Dealer/lead records
- `notes` - Notes attached to dealers
- `voice_recordings` - Voice recording metadata
- `photos` - Photo metadata
- `trade_shows` - Trade show events
- `dealer_trade_shows` - Association table
- `todos` - Task management
- `quick_actions` - Quick action records
- `ratings` - Lead quality ratings

## Project Structure

```
csl-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   └── package.json
├── .env.example
└── README.md
```

## Testing Plan

### Phase 1: Payment & Security Testing
1. Test subscription creation (monthly and annual)
2. Verify paywall blocks access without subscription
3. Test subscription cancellation (5+ days before renewal)
4. Verify cancellation prevents renewal
5. Test data isolation - ensure users can't access other companies' data
6. Test authentication and authorization

### Phase 2: Core Functionality Testing
1. Dealer CRUD operations
2. CSV import/export
3. Badge scanning OCR accuracy
4. Photo upload and storage
5. Voice recording and playback
6. Notes creation and management
7. Search and filtering

### Phase 3: Feature Testing
1. Trade show management
2. Reports generation
3. Duplicates detection
4. To-dos functionality
5. Quick actions
6. Lead quality ratings

### Phase 4: Integration Testing
1. End-to-end user flows
2. Payment to feature access flow
3. Data persistence across sessions
4. File upload/download

### Phase 5: Security Audit
1. Penetration testing
2. SQL injection prevention
3. XSS prevention
4. CSRF protection
5. Authentication bypass attempts

## Deployment Considerations

- Environment variables for sensitive data
- Database migrations
- File storage (local dev, S3 for production)
- SSL certificates
- Domain configuration
- Stripe webhook endpoint configuration

