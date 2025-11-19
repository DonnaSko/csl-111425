# Developer Handoff Document

This document is for the developer/technical person who will help set up and deploy the Capture Show Leads application.

## Project Overview

A full-stack trade show lead management application with:
- React + TypeScript frontend
- Node.js + Express + TypeScript backend
- PostgreSQL database (Prisma ORM)
- Stripe payment integration
- Secure paywall and data isolation

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Payments**: Stripe
- **Authentication**: JWT

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (DigitalOcean Managed PostgreSQL recommended)
- Stripe account
- DigitalOcean account (for database and hosting)

### Setup Steps

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Database Setup**
   - Create DigitalOcean Managed PostgreSQL database
   - Get connection string from DigitalOcean dashboard
   - Update `DATABASE_URL` in backend `.env`
   - For local development, can use local PostgreSQL or DigitalOcean database

3. **Environment Variables**
   
   Create `backend/.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_URL="postgresql://user:pass@localhost:5432/csl_db"
   JWT_SECRET=your-secret-key-min-32-chars
   JWT_EXPIRES_IN=7d
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_MONTHLY=price_...
   STRIPE_PRICE_ID_ANNUAL=price_...
   FRONTEND_URL=http://localhost:5173
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   ```

   Create `frontend/.env` (optional):
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Database Migrations**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

## Key Files

- **Backend Entry**: `backend/src/index.ts`
- **Frontend Entry**: `frontend/src/App.tsx`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Paywall Middleware**: `backend/src/middleware/paywall.ts`
- **Auth Middleware**: `backend/src/middleware/auth.ts`

## Security Features

1. **Paywall**: `requireActiveSubscription` middleware on all protected routes
2. **Data Isolation**: All queries filtered by `companyId`
3. **Authentication**: JWT tokens with expiration
4. **Password Hashing**: bcrypt with salt rounds

## Stripe Integration

### Required Stripe Setup
1. Create products:
   - Monthly: $99/month recurring
   - Annual: $920/year recurring
2. Get Price IDs
3. Set up webhook endpoint
4. Configure webhook events (see `backend/src/routes/webhooks.ts`)

### Webhook Testing
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## Deployment Considerations

### Environment Variables (Production)

**Backend:**
- Use production Stripe keys
- Use production database (DigitalOcean Managed PostgreSQL)
- Set strong `JWT_SECRET`
- Update `FRONTEND_URL` to production domain
- Configure file storage (DigitalOcean Spaces recommended, or S3)

**Frontend:**
- Set `VITE_API_URL` to production backend URL

### Deployment to DigitalOcean

**Database:**
- Use DigitalOcean Managed PostgreSQL
- Connection string will be provided as environment variable in App Platform
- Configure trusted sources for security
- Enable automated backups

**App Platform Deployment:**

1. **Push code to GitHub/GitLab**
   - Ensure code is in a repository

2. **Create App on DigitalOcean App Platform**
   - Connect repository
   - DigitalOcean will auto-detect project structure

3. **Configure Backend Service**
   - Type: Web Service
   - Build Command: `cd backend && npm install && npm run build`
   - Run Command: `cd backend && npm start`
   - HTTP Port: `3001`
   - Environment Variables: Set all required vars (see below)

4. **Configure Frontend Service**
   - Type: Static Site (or Web Service)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Environment Variables: `VITE_API_URL` pointing to backend URL

5. **Add Database Resource**
   - In App Platform, add DigitalOcean database as resource
   - Connection string automatically available as `DATABASE_URL`

6. **Environment Variables to Set:**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<auto-provided by DigitalOcean>
   JWT_SECRET=<strong-random-string>
   JWT_EXPIRES_IN=7d
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_MONTHLY=price_...
   STRIPE_PRICE_ID_ANNUAL=price_...
   FRONTEND_URL=https://your-frontend-url.ondigitalocean.app
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   ```

7. **Configure Webhooks**
   - Update Stripe webhook endpoint to: `https://your-backend-url.ondigitalocean.app/api/webhooks/stripe`
   - Update `STRIPE_WEBHOOK_SECRET` in environment variables

### File Storage

For production, implement cloud storage:
- **DigitalOcean Spaces** (recommended, integrates well)
- AWS S3
- Cloudinary
- Or keep local storage if acceptable (not recommended for production)

Update `backend/src/routes/uploads.ts` accordingly if using cloud storage.

## Testing

See `TESTING_PLAN.md` for comprehensive testing procedures.

**Critical Tests:**
1. Paywall security (no access without subscription)
2. Data isolation (users can't access other companies' data)
3. Subscription cancellation (5+ days rule)
4. Stripe webhooks

## Known Issues / TODO

See `IMPLEMENTATION_STATUS.md` for feature completion status.

**Pending Features:**
- Badge scanning OCR (Tesseract.js integration needed)
- Photo upload UI
- Voice recording UI
- Trade Shows UI
- To-Dos UI

## Database Schema

Key tables:
- `User` - User accounts
- `Company` - Company/account information
- `Subscription` - Stripe subscription data
- `Dealer` - Dealer/lead records
- `DealerNote` - Notes
- `Photo` - Photo metadata
- `VoiceRecording` - Recording metadata
- `Todo` - Task management
- `TradeShow` - Trade show events

All queries must include `companyId` filter for data isolation.

## API Routes

### Public
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires auth)

### Protected (Requires Subscription)
- `GET /api/dealers` - List dealers
- `POST /api/dealers` - Create dealer
- `GET /api/dealers/:id` - Get dealer
- `PUT /api/dealers/:id` - Update dealer
- `DELETE /api/dealers/:id` - Delete dealer
- `POST /api/dealers/bulk-import` - Import CSV
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/export/dealers` - Export CSV
- All other routes require subscription

### Payment
- `POST /api/subscriptions/create-checkout-session`
- `GET /api/subscriptions/status`
- `POST /api/subscriptions/cancel`
- `POST /api/webhooks/stripe` - Stripe webhooks

## Important Notes

1. **Cancellation Rule**: Users can only cancel 5+ days before renewal (enforced in `backend/src/utils/subscription.ts`)

2. **No Refunds**: Policy enforced - cancellations only prevent renewal

3. **Data Isolation**: Critical - all queries must filter by `companyId`

4. **Webhook Security**: Verify webhook signatures using `STRIPE_WEBHOOK_SECRET`

## Support

- Review `SETUP.md` for detailed setup
- Review `TESTING_PLAN.md` for testing procedures
- Check code comments for implementation details

## Questions?

If you need clarification on any part of the codebase, check:
1. Code comments
2. Type definitions
3. Prisma schema
4. API route handlers

