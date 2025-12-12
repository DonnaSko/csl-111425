import express from 'express';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { canCancelSubscription } from '../utils/subscription';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any
});

const PRICE_ID_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY!;
const PRICE_ID_ANNUAL = process.env.STRIPE_PRICE_ID_ANNUAL!;

// Create checkout session
router.post('/create-checkout-session', authenticate, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'annual'

    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const priceId = plan === 'monthly' ? PRICE_ID_MONTHLY : PRICE_ID_ANNUAL;

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has a Stripe customer and subscription
    let customerId: string;
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Prevent paid users from creating a new checkout session
    const hasActiveSubscription =
      existingSubscription &&
      ['active', 'trialing'].includes(existingSubscription.status) &&
      existingSubscription.currentPeriodEnd >= new Date();

    if (hasActiveSubscription) {
      const now = new Date();
      const millisLeft = existingSubscription.currentPeriodEnd.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(millisLeft / (1000 * 60 * 60 * 24)));

      return res.status(400).json({
        error: 'You already have an active subscription. No need to subscribe again.',
        code: 'SUBSCRIPTION_EXISTS',
        status: existingSubscription.status,
        currentPeriodEnd: existingSubscription.currentPeriodEnd,
        daysLeft
      });
    }

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          companyId: user.companyId
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: user.id,
        plan
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get subscription status
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' } // Get most recent subscription
    });

    console.log(`Subscription status check for user ${req.userId}:`, {
      found: !!subscription,
      status: subscription?.status,
      currentPeriodEnd: subscription?.currentPeriodEnd,
      stripeSubscriptionId: subscription?.stripeSubscriptionId
    });

    if (!subscription) {
      return res.json({ hasSubscription: false, isActive: false });
    }

    const now = new Date();
    const isActive = 
      subscription.status === 'active' && 
      subscription.currentPeriodEnd >= now;

    console.log(`Subscription active check:`, {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      now,
      isActive,
      expired: subscription.currentPeriodEnd < now
    });

    res.json({
      hasSubscription: true,
      isActive,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        canCancel: canCancelSubscription(subscription.currentPeriodEnd),
        stripeSubscriptionId: subscription.stripeSubscriptionId
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Sync subscription from Stripe (manual sync endpoint)
router.post('/sync-from-stripe', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find user's subscription
    const dbSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!dbSubscription || !dbSubscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No Stripe subscription found. Please check your subscription in Stripe.' });
    }

    console.log(`Syncing subscription ${dbSubscription.stripeSubscriptionId} from Stripe...`);

    // Fetch from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      dbSubscription.stripeSubscriptionId
    );

    // Update database with latest Stripe data
    const updated = await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: stripeSubscription.status,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
        canceledAt: stripeSubscription.canceled_at 
          ? new Date(stripeSubscription.canceled_at * 1000) 
          : null
      }
    });

    const isActive = 
      updated.status === 'active' && 
      updated.currentPeriodEnd >= new Date();

    console.log(`Subscription synced:`, {
      status: updated.status,
      currentPeriodEnd: updated.currentPeriodEnd,
      isActive
    });

    res.json({
      message: 'Subscription synced from Stripe successfully',
      subscription: {
        id: updated.id,
        status: updated.status,
        currentPeriodEnd: updated.currentPeriodEnd,
        isActive,
        stripeStatus: stripeSubscription.status,
        stripePeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      }
    });
  } catch (error: any) {
    console.error('Sync subscription error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(404).json({ 
        error: 'Subscription not found in Stripe. Please contact support.',
        details: error.message
      });
    }
    
    res.status(500).json({ error: 'Failed to sync subscription from Stripe' });
  }
});

// Cancel subscription (requires active subscription)
router.post('/cancel', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId!,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Check if cancellation is allowed (5+ days before renewal)
    if (!canCancelSubscription(subscription.currentPeriodEnd)) {
      return res.status(400).json({ 
        error: 'Cancellation must be at least 5 days before renewal date',
        currentPeriodEnd: subscription.currentPeriodEnd
      });
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      }
    });

    res.json({ 
      message: 'Subscription will be canceled at the end of the current period',
      currentPeriodEnd: subscription.currentPeriodEnd
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Create customer portal session
// TEMPORARY: Fix subscription for current user (one-time fix endpoint)
router.post('/fix-subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if subscription exists
    let subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Set period end to 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    if (subscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
          canceledAt: null
        }
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: `cus_manual_${Date.now()}`,
          stripeSubscriptionId: `sub_manual_${Date.now()}`,
          stripePriceId: 'price_manual',
          status: 'active',
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false
        }
      });
    }

    res.json({
      message: 'Subscription fixed successfully!',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isActive: subscription.status === 'active' && subscription.currentPeriodEnd >= new Date()
      }
    });
  } catch (error) {
    console.error('Fix subscription error:', error);
    res.status(500).json({ error: 'Failed to fix subscription' });
  }
});

router.post('/create-portal-session', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId! }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

export default router;

