import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth';

// Grace period after cancellation (in days)
const CANCELLATION_GRACE_PERIOD_DAYS = 5;

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check for active subscription - get the MOST RECENT one
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId
      },
      orderBy: { 
        createdAt: 'desc' // Get the most recent subscription
      }
    });

    const now = new Date();

    console.log(`Subscription check for user ${req.userId}:`, {
      found: !!subscription,
      status: subscription?.status,
      currentPeriodEnd: subscription?.currentPeriodEnd,
      canceledAt: subscription?.canceledAt,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
      now: now,
    });

    // No subscription found
    if (!subscription) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        hasSubscription: false,
      });
    }

    // Check if user has canceled their subscription
    if (subscription.canceledAt) {
      const canceledAt = new Date(subscription.canceledAt);
      const gracePeriodEnd = new Date(canceledAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + CANCELLATION_GRACE_PERIOD_DAYS);
      
      console.log(`User ${req.userId} has canceled subscription:`, {
        canceledAt: canceledAt,
        gracePeriodEnd: gracePeriodEnd,
        now: now,
        withinGracePeriod: now <= gracePeriodEnd,
      });

      // If within grace period after cancellation, allow access
      if (now <= gracePeriodEnd) {
        console.log(`User ${req.userId} is within ${CANCELLATION_GRACE_PERIOD_DAYS}-day grace period after cancellation`);
        next();
        return;
      }

      // Grace period has ended
      return res.status(403).json({ 
        error: 'Your subscription has been canceled and the grace period has ended. Please resubscribe to continue.',
        code: 'SUBSCRIPTION_CANCELED_EXPIRED',
        hasSubscription: true,
        subscriptionStatus: 'canceled',
        canceledAt: subscription.canceledAt,
        gracePeriodEnded: gracePeriodEnd,
      });
    }

    // Check if subscription is active and within the current period
    const isActive = subscription.status === 'active' && 
      subscription.currentPeriodEnd >= now;

    if (!isActive) {
      console.warn(`Subscription found but not active:`, {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        now: now,
        expired: subscription.currentPeriodEnd < now
      });
      
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        hasSubscription: true,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      });
    }

    // Subscription is active - check if set to cancel at period end
    if (subscription.cancelAtPeriodEnd) {
      // Still allow access until period ends (they haven't officially canceled yet)
      console.log(`User ${req.userId} subscription set to cancel at period end, still allowing access`);
    }

    next();
  } catch (error) {
    console.error('Paywall check error:', error);
    return res.status(500).json({ error: 'Error checking subscription' });
  }
};

