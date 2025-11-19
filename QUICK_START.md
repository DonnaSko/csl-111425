# Quick Start Guide

## What Has Been Built

I've rebuilt your Capture Show Leads application from scratch with a secure payment system and robust data isolation. Here's what's ready:

### ✅ Core Features Ready
- **User Authentication** - Registration and login
- **Secure Payment System** - Monthly ($99) and Annual ($920) plans via Stripe
- **Paywall Protection** - No access without active subscription
- **Dealer Management** - Create, view, search, filter, and manage dealers
- **Notes System** - Add notes to dealers
- **Lead Quality Rating** - 5-star rating system
- **CSV Export** - Export dealers to CSV
- **Dashboard** - Overview with statistics
- **Data Isolation** - Each company's data is completely separate

### 🚧 Partially Complete
- CSV Import (backend ready, UI needs completion)
- Photo Uploads (backend ready, UI needs completion)
- Voice Recordings (backend ready, UI needs completion)

### 📋 To Be Implemented
- Badge scanning with OCR
- Trade Shows UI
- To-Dos UI
- Additional features (duplicates, data verification, etc.)

## Getting Started

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Set Up Database

1. Create PostgreSQL database: `CREATE DATABASE csl_db;`
2. Update `backend/.env` with your database connection string

### 3. Configure Stripe

1. Get Stripe API keys from https://stripe.com
2. Create products:
   - Monthly Plan: $99/month recurring
   - Annual Plan: $920/year recurring
3. Copy Price IDs
4. Set up webhook endpoint
5. Update `backend/.env` with Stripe credentials

### 4. Run Database Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 5. Start Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Test the Application

1. Open http://localhost:5173
2. Register a new account
3. Subscribe using test card: `4242 4242 4242 4242`
4. Start using the app!

## Key Files

- **Backend Entry**: `backend/src/index.ts`
- **Frontend Entry**: `frontend/src/App.tsx`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Paywall Middleware**: `backend/src/middleware/paywall.ts`
- **Auth Middleware**: `backend/src/middleware/auth.ts`

## Security Features

1. **Paywall**: All protected routes require active subscription
2. **Data Isolation**: Users can only access their company's data
3. **Authentication**: JWT-based with secure token handling
4. **Password Security**: bcrypt hashing

## Testing

See [TESTING_PLAN.md](./TESTING_PLAN.md) for comprehensive testing procedures.

**Critical Tests to Run First:**
1. Verify paywall blocks access without subscription
2. Verify users can't access other companies' data
3. Test subscription creation and cancellation
4. Test cancellation 5+ days before renewal rule

## Next Steps

1. **Complete Testing** - Follow the testing plan to verify everything works
2. **Add Missing Features** - Implement badge scanning, photo uploads, etc.
3. **Production Setup** - Configure for production deployment
4. **Monitor** - Set up logging and monitoring

## Important Notes

- **No Refunds**: Cancellation only allowed 5+ days before renewal
- **Data Isolation**: Each company's data is completely separate
- **Payment Required**: All features require active subscription
- **Stripe Webhooks**: Must be configured for subscription updates

## Support

- Review [SETUP.md](./SETUP.md) for detailed setup instructions
- Review [TESTING_PLAN.md](./TESTING_PLAN.md) for testing procedures
- Review [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for feature status

