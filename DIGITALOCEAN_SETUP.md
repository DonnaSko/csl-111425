# DigitalOcean Setup Quick Reference

This is a quick reference guide for setting up your Capture Show Leads app on DigitalOcean.

## What You Need

1. **DigitalOcean Account** - https://www.digitalocean.com
2. **Stripe Account** - https://stripe.com
3. **GitHub Account** (for code repository) - https://github.com

## Step-by-Step Setup

### 1. Create DigitalOcean Database

1. Log into DigitalOcean: https://cloud.digitalocean.com
2. Click **Create** → **Databases**
3. Select **PostgreSQL**
4. Choose plan:
   - **Testing**: Basic ($15/month)
   - **Production**: Professional ($60/month) recommended
5. Choose datacenter region (closest to your users)
6. Name your database (e.g., "csl-database")
7. Click **Create Database Cluster**
8. Once created, go to **Connection Details** tab
9. **Copy the connection string** - you'll need this!

### 2. Set Up Stripe

1. Create products in Stripe:
   - Monthly Plan: $99/month
   - Annual Plan: $920/year
2. Copy Price IDs
3. Copy API keys (test mode for development, live mode for production)

### 3. Deploy to DigitalOcean App Platform

**Your developer will do this, but here's what happens:**

1. **Code goes to GitHub**
   - Developer pushes code to GitHub repository

2. **Create App on DigitalOcean**
   - Log into DigitalOcean
   - Click **Create** → **Apps**
   - Connect GitHub repository
   - DigitalOcean detects your project

3. **Configure Services**
   - **Backend**: Web service, port 3001
   - **Frontend**: Static site or web service
   - **Database**: Add your database as a resource

4. **Set Environment Variables**
   - All Stripe keys
   - Database connection (auto-provided if database added as resource)
   - JWT secret
   - Frontend URL

5. **Deploy**
   - Click Deploy
   - DigitalOcean builds and deploys
   - You get URLs for your app!

### 4. Configure Stripe Webhooks

1. In Stripe Dashboard, go to **Webhooks**
2. Add endpoint: `https://your-backend-url.ondigitalocean.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret
5. Add to DigitalOcean environment variables

## Cost Breakdown

### Minimum Setup (Testing/Small Production)
- Database: $15/month (Basic PostgreSQL)
- App Platform: $10/month (Basic plan, 2 services)
- **Total: ~$25/month**

### Recommended Production Setup
- Database: $60/month (Professional PostgreSQL)
- App Platform: $24/month (Professional plan, 2 services)
- **Total: ~$84/month**

### Plus Stripe Fees
- 2.9% + $0.30 per transaction

## Important Notes

1. **Database Backups**: DigitalOcean automatically backs up your database
2. **SSL Certificates**: DigitalOcean provides free SSL certificates
3. **Scaling**: Easy to scale up as your app grows
4. **Monitoring**: DigitalOcean provides monitoring and alerts

## Getting Help

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **App Platform Docs**: https://docs.digitalocean.com/products/app-platform/
- **Database Docs**: https://docs.digitalocean.com/products/databases/
- **Support**: https://www.digitalocean.com/support

## Quick Checklist

- [ ] DigitalOcean account created
- [ ] Database cluster created
- [ ] Database connection string copied
- [ ] Stripe account set up
- [ ] Stripe products created
- [ ] Code pushed to GitHub
- [ ] App created on DigitalOcean App Platform
- [ ] Environment variables configured
- [ ] Database connected to app
- [ ] App deployed successfully
- [ ] Stripe webhooks configured
- [ ] Testing completed

## Next Steps

1. Follow the detailed guide in `NON_TECHNICAL_GUIDE.md`
2. Share `DEVELOPER_HANDOFF.md` with your developer
3. Test thoroughly before going live
4. Monitor your app in DigitalOcean dashboard

