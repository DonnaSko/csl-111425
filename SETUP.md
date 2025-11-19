# Capture Show Leads - Setup Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **Stripe Account** - [Sign up](https://stripe.com/)
4. **Git** (optional) - For version control

## Step 1: Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database:
   ```sql
   CREATE DATABASE csl_db;
   ```
3. Note your database connection string:
   ```
   postgresql://username:password@localhost:5432/csl_db
   ```

## Step 2: Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard:
   - Go to Developers → API keys
   - Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Create products and prices:
   - Go to Products → Add product
   - Create "Monthly Plan" - $99/month, recurring
   - Create "Annual Plan" - $920/year, recurring
   - Copy the **Price IDs** (start with `price_`)
4. Set up webhook endpoint:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 3: Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example` if available):
   ```env
   PORT=3001
   NODE_ENV=development
   
   DATABASE_URL="postgresql://username:password@localhost:5432/csl_db?schema=public"
   
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
   JWT_EXPIRES_IN=7d
   
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   STRIPE_PRICE_ID_MONTHLY=price_your_monthly_price_id
   STRIPE_PRICE_ID_ANNUAL=price_your_annual_price_id
   
   FRONTEND_URL=http://localhost:5173
   
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

6. (Optional) Open Prisma Studio to view database:
   ```bash
   npx prisma studio
   ```

7. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend should now be running on http://localhost:3001

## Step 4: Frontend Setup

1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional, defaults are set):
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend should now be running on http://localhost:5173

## Step 5: Testing the Setup

1. Open http://localhost:5173 in your browser
2. Register a new account
3. You should be redirected to the subscription page
4. Test the subscription flow with Stripe test card: `4242 4242 4242 4242`
5. After subscribing, you should have access to all features

## Step 6: Local Webhook Testing (Optional)

For testing webhooks locally during development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe:
   ```bash
   stripe login
   ```
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```
4. Copy the webhook signing secret from the CLI output
5. Update your `.env` file with the new webhook secret

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Stripe Issues
- Verify API keys are correct
- Check you're using test mode keys (not live)
- Verify price IDs are correct
- Check webhook endpoint is accessible

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `FRONTEND_URL` if changed
- Update frontend proxy in `vite.config.ts` if needed

### Prisma Issues
- Run `npx prisma generate` again
- Check database connection
- Verify schema is correct

## Production Deployment

### Environment Variables
Update all environment variables for production:
- Use production Stripe keys
- Use production database
- Set strong `JWT_SECRET`
- Update `FRONTEND_URL` to production domain
- Configure proper file storage (S3, etc.)

### Database
- Run migrations: `npx prisma migrate deploy`
- Set up database backups
- Configure connection pooling

### File Storage
- Set up cloud storage (AWS S3, etc.)
- Update `UPLOAD_DIR` or implement cloud storage adapter
- Configure CORS for file access

### Security
- Enable HTTPS
- Set secure cookie flags
- Configure CORS properly
- Set up rate limiting
- Enable security headers

## Next Steps

1. Review the [Testing Plan](./TESTING_PLAN.md)
2. Test all features thoroughly
3. Set up monitoring and logging
4. Configure backups
5. Plan for scaling

