import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth';

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

    console.log(`Subscription check for user ${req.userId}:`, {
      found: !!subscription,
      status: subscription?.status,
      currentPeriodEnd: subscription?.currentPeriodEnd,
      now: new Date(),
      isActive: subscription?.status === 'active' && subscription?.currentPeriodEnd >= new Date()
    });

    // Check if subscription is active
    const isActive = subscription && 
      subscription.status === 'active' && 
      subscription.currentPeriodEnd >= new Date();

    if (!isActive) {
      // If subscription exists but isn't active, log details for debugging
      if (subscription) {
        console.warn(`Subscription found but not active:`, {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          now: new Date(),
          expired: subscription.currentPeriodEnd < new Date()
        });
      }
      
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status,
        currentPeriodEnd: subscription?.currentPeriodEnd
      });
    }

    // Check if subscription is set to cancel at period end
    if (subscription && subscription.cancelAtPeriodEnd) {
      // Still allow access until period ends
      next();
      return;
    }

    next();
  } catch (error) {
    console.error('Paywall check error:', error);
    return res.status(500).json({ error: 'Error checking subscription' });
  }
};

