# Capture Show Leads - Non-Technical Setup & Deployment Guide

## Overview
This guide is designed for non-coders. It will walk you through what you need to do, what you need help with, and how to get your app from development to production.

---

## Part 1: What You Need Before Starting

### 1.1 Accounts You Need to Create

1. **Stripe Account** (for payments)
   - Go to: https://stripe.com
   - Sign up for a free account
   - You'll need this for processing payments

2. **DigitalOcean Account** (for database and hosting)
   - Go to: https://www.digitalocean.com
   - Sign up for an account
   - You'll use DigitalOcean for:
     - **Managed PostgreSQL Database** (for storing your data)
     - **App Platform** (for hosting your application)
   - DigitalOcean offers a simple, all-in-one solution

### 1.2 Technical Help You'll Need

You'll need a developer or technical person to help with:
- Installing Node.js and setting up the development environment
- Running initial setup commands
- Configuring the database connection
- Setting up Stripe webhooks
- Deploying to production
- Ongoing maintenance and updates

**Estimated Time with Help**: 2-4 hours for initial setup, 1-2 hours for production deployment

---

## Part 2: Initial Setup (Development/Testing)

### Step 1: Get Your Computer Ready

**What you need:**
- A computer (Mac, Windows, or Linux)
- Internet connection
- A developer/technical person to help

**What the developer needs to install:**
1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org
   - This runs the application code

2. **PostgreSQL** (or use DigitalOcean Managed Database)
   - Can be installed locally for testing OR use DigitalOcean Managed Database

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com

### Step 2: Set Up Stripe

**You can do this part yourself:**

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Sign up (it's free)
   - Complete account setup

2. **Get Your API Keys**
   - In Stripe Dashboard, go to: **Developers → API keys**
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
   - **Save these somewhere safe** - you'll need them

3. **Create Your Products**
   - Go to: **Products → Add product**
   
   **For Monthly Plan:**
   - Name: "Monthly Plan"
   - Price: $99.00
   - Billing: Recurring, Monthly
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_`) - Save this!
   
   **For Annual Plan:**
   - Name: "Annual Plan"
   - Price: $920.00
   - Billing: Recurring, Yearly
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_`) - Save this!

4. **Set Up Webhooks** (You'll need developer help for this)
   - Go to: **Developers → Webhooks**
   - Click "Add endpoint"
   - Endpoint URL: (Your developer will provide this after deployment)
   - Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"
   - **Copy the Webhook Signing Secret** (starts with `whsec_`) - Save this!

### Step 3: Set Up Database on DigitalOcean

**Setting Up DigitalOcean Managed PostgreSQL Database:**

1. **Log into DigitalOcean**
   - Go to https://cloud.digitalocean.com
   - Sign in to your account

2. **Create a Database Cluster**
   - Click **Create** in the top right
   - Select **Databases**
   - Choose **PostgreSQL** as the database engine
   - Select a plan (start with the Basic plan - $15/month for 1GB RAM, 10GB storage)
   - Choose a datacenter region (closest to your users)
   - Give your database a name (e.g., "csl-database")
   - Click **Create Database Cluster**

3. **Get Your Connection String**
   - Once created, click on your database cluster
   - Go to the **Connection Details** tab
   - You'll see a **Connection string** that looks like: `postgresql://username:password@host:port/database?sslmode=require`
   - **Copy this connection string** - you'll need it for your developer
   - **Save it somewhere safe** - this is sensitive information

4. **Configure Database Access** (Important for Security)
   - Go to the **Settings** tab
   - Under **Trusted Sources**, you can restrict which IPs can access the database
   - For development, you may need to allow your developer's IP address
   - For production, you'll configure this to only allow your app's IP

**Note:** Your developer will help you configure the database connection and run the initial setup.

### Step 4: Developer Sets Up the Code

**Give your developer these files and information:**

1. **The entire project folder** (`CSL- 11-14-25`)

2. **Stripe Information:**
   - Secret Key: `sk_test_...`
   - Monthly Price ID: `price_...`
   - Annual Price ID: `price_...`
   - Webhook Secret: `whsec_...` (for later)

3. **Database Connection String:**
   - From DigitalOcean (see Step 3 above)

**What the developer will do:**
1. Open terminal/command prompt
2. Navigate to the project folder
3. Install dependencies (run `npm install` in both backend and frontend folders)
4. Create a `.env` file in the backend folder with your information
5. Run database migrations
6. Start the development servers

**You should see:**
- Backend running on: http://localhost:3001
- Frontend running on: http://localhost:5173

### Step 5: Test Locally

**You can test the app yourself:**

1. Open browser to: http://localhost:5173
2. Register a new account
3. You'll be redirected to subscription page
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete checkout
6. You should have access to the app!

**Test these features:**
- ✅ Create a dealer
- ✅ Search for dealers
- ✅ Add notes to dealers
- ✅ Rate dealers
- ✅ Export to CSV
- ✅ Try accessing without subscription (should be blocked)

---

## Part 3: Testing Phase

### What to Test

**Critical Tests (Must Pass):**

1. **Payment Security**
   - [ ] Try to access app without subscribing (should be blocked)
   - [ ] Subscribe with test card
   - [ ] Verify you can access features after subscribing
   - [ ] Try to cancel subscription (should work if 5+ days before renewal)

2. **Data Security**
   - [ ] Create two different accounts
   - [ ] Add dealers to Account 1
   - [ ] Login to Account 2
   - [ ] Verify Account 2 cannot see Account 1's dealers

3. **Core Features**
   - [ ] Register new user
   - [ ] Subscribe to monthly plan
   - [ ] Subscribe to annual plan (with different account)
   - [ ] Create dealers
   - [ ] Search and filter dealers
   - [ ] Add notes
   - [ ] Rate dealers
   - [ ] Export to CSV

**Use the Testing Plan document** (`TESTING_PLAN.md`) for detailed testing procedures.

### Fixing Issues

If something doesn't work:
1. Note what you were trying to do
2. Note what error message you saw (if any)
3. Share with your developer
4. They can fix and test again

---

## Part 4: Moving to Production

### Step 1: Get Production Stripe Keys

1. In Stripe Dashboard, switch to **Live mode** (toggle in top right)
2. Go to **Developers → API keys**
3. Copy your **Live Secret key** (starts with `sk_live_`)
4. Create products in Live mode (same as test mode)
5. Copy the **Live Price IDs**
6. Set up webhook endpoint for production URL

### Step 2: Set Up Production Database on DigitalOcean

**If you haven't already set up your database:**

1. **Create Production Database Cluster**
   - Log into DigitalOcean
   - Create a new PostgreSQL database cluster (or use the one from testing)
   - Choose an appropriate plan based on expected usage
   - **Recommended for production**: At least the Basic plan ($15/month) or higher

2. **Get Production Connection String**
   - Copy the connection string from DigitalOcean
   - This will be used in your production environment variables

3. **Configure Backups**
   - In DigitalOcean database settings, enable automated backups
   - Set backup retention period (7 days is standard)
   - DigitalOcean handles backups automatically

4. **Configure Security**
   - Set up trusted sources (IP addresses that can access the database)
   - For App Platform deployment, you may need to allow all IPs or configure VPC
   - Your developer will help with this configuration

### Step 3: Deploy Your App to DigitalOcean App Platform

**You'll need developer help for this, but here's what will happen:**

**Deploying to DigitalOcean App Platform:**

1. **Prepare Your Code Repository**
   - Your developer will need to push the code to GitHub (or GitLab)
   - Make sure the code is in a repository

2. **Create App on DigitalOcean App Platform**
   - Log into DigitalOcean
   - Click **Create** → **Apps**
   - Connect your GitHub/GitLab repository
   - DigitalOcean will detect your project structure

3. **Configure Backend Service**
   - DigitalOcean will detect the backend folder
   - Configure it as a web service
   - Set the build command: `npm install && npm run build`
   - Set the run command: `npm start`
   - Set the HTTP port: `3001`

4. **Configure Frontend Service**
   - DigitalOcean will detect the frontend folder
   - Configure it as a static site or web service
   - Set the build command: `npm install && npm run build`
   - Set the output directory: `dist` (or `build`)

5. **Connect to Database**
   - In App Platform settings, add your DigitalOcean database as a resource
   - DigitalOcean will automatically provide the connection string as an environment variable

6. **Set Environment Variables**
   - Your developer will configure all environment variables in App Platform
   - These include: Stripe keys, database connection, JWT secret, etc.

7. **Deploy**
   - Click **Deploy** or **Save**
   - DigitalOcean will build and deploy your app
   - You'll get URLs for both frontend and backend (e.g., `https://your-app.ondigitalocean.app`)

**Benefits of DigitalOcean App Platform:**
- Automatic deployments from Git
- Built-in SSL certificates
- Automatic scaling
- Integrated with DigitalOcean databases
- Simple management interface

### Step 4: Configure Production Settings

**Developer needs to set these in production:**

1. **Backend Environment Variables:**
   - Production database URL
   - Production Stripe secret key
   - Production Stripe price IDs
   - Production webhook secret
   - Production frontend URL
   - Strong JWT secret

2. **Frontend Environment Variables:**
   - Production API URL

3. **Stripe Webhook:**
   - Update webhook endpoint to production URL
   - Copy new webhook secret
   - Update in backend environment variables

### Step 5: Final Production Tests

**Test with real (small) payments:**

1. Use a real credit card (your own, small amount)
2. Test monthly subscription
3. Test annual subscription
4. Verify webhooks are working
5. Test cancellation
6. Verify all features work

---

## Part 5: Ongoing Maintenance

### What You Need to Monitor

1. **Stripe Dashboard**
   - Check for failed payments
   - Monitor subscription status
   - Review webhook events

2. **Application**
   - Monitor for errors
   - Check user feedback
   - Review usage statistics

3. **Database**
   - Ensure backups are running
   - Monitor storage usage

### When You Need Developer Help

- Adding new features
- Fixing bugs
- Updating dependencies
- Scaling the application
- Security updates

---

## Part 6: Cost Estimates

### Development/Testing (Low Cost)
- Stripe: Free (test mode)
- Database: DigitalOcean Basic PostgreSQL - $15/month (1GB RAM, 10GB storage)
- Hosting: DigitalOcean App Platform - Free tier available for testing (limited resources)

### Production (Monthly Costs)
- **Stripe**: 2.9% + $0.30 per transaction (standard rate)
- **Database (DigitalOcean Managed PostgreSQL)**: 
  - Basic Plan: $15/month (1GB RAM, 10GB storage, 1 vCPU)
  - Professional Plan: $60/month (2GB RAM, 25GB storage, 1 vCPU) - Recommended for production
  - Higher plans available as you scale
- **Hosting (DigitalOcean App Platform)**:
  - Basic Plan: $5/month per service (backend + frontend = $10/month minimum)
  - Professional Plan: $12/month per service (better performance)
  - Additional costs for bandwidth and storage

**Estimated Total**: 
- **Minimum**: ~$30-40/month (Basic database + Basic hosting)
- **Recommended for Production**: ~$80-100/month (Professional database + Professional hosting)
- **As you scale**: Costs increase based on usage, traffic, and storage needs

**Note:** DigitalOcean offers predictable pricing and you can start small and scale up as needed.

---

## Part 7: Quick Checklist

### Before You Start
- [ ] Stripe account created
- [ ] DigitalOcean account created
- [ ] Developer/technical person available
- [ ] Project folder ready

### Development Setup
- [ ] Node.js installed (by developer)
- [ ] Database set up
- [ ] Stripe test products created
- [ ] Code set up and running locally
- [ ] Can access app at localhost:5173

### Testing
- [ ] Payment security tested
- [ ] Data isolation tested
- [ ] Core features tested
- [ ] All critical tests passed

### Production
- [ ] Production Stripe account ready
- [ ] Production database set up
- [ ] App deployed to hosting
- [ ] Production environment variables configured
- [ ] Webhooks configured
- [ ] Production tests passed
- [ ] Monitoring set up

---

## Part 8: Getting Help

### If You're Stuck

1. **For Stripe Issues:**
   - Stripe Support: https://support.stripe.com
   - Stripe Documentation: https://stripe.com/docs

2. **For Database Issues:**
   - DigitalOcean Database Docs: https://docs.digitalocean.com/products/databases/
   - DigitalOcean Support: https://www.digitalocean.com/support

3. **For Deployment Issues:**
   - DigitalOcean App Platform Docs: https://docs.digitalocean.com/products/app-platform/
   - DigitalOcean Community: https://www.digitalocean.com/community
   - DigitalOcean Support: https://www.digitalocean.com/support

4. **For Code Issues:**
   - Contact your developer
   - Review the documentation files in the project

---

## Summary

**What You Can Do Yourself:**
- Create Stripe account and products
- Create DigitalOcean account
- Set up DigitalOcean database cluster
- Test the application
- Monitor production in DigitalOcean dashboard

**What You Need Developer Help With:**
- Installing development tools
- Setting up the code
- Configuring environment variables
- Deploying to production
- Fixing technical issues

**Timeline:**
- Initial setup: 2-4 hours (with developer help)
- Testing: 1-2 days
- Production deployment: 1-2 hours (with developer help)

**Next Step:**
Find a developer or technical person to help you with the setup, then follow this guide step by step!

