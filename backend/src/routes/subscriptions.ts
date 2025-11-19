import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canCancelSubscription } from '../utils/subscription';

const router = express.Router();
const prisma = new PrismaClient();

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

    // Check if user already has a Stripe customer
    let customerId: string;
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id }
    });

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
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return res.json({ hasSubscription: false });
    }

    const isActive = 
      subscription.status === 'active' && 
      subscription.currentPeriodEnd >= new Date();

    res.json({
      hasSubscription: true,
      isActive,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        canCancel: canCancelSubscription(subscription.currentPeriodEnd)
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res) => {
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
router.post('/create-portal-session', authenticate, async (req: AuthRequest, res) => {
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

