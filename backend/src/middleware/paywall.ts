import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
        currentPeriodEnd: {
          gte: new Date()
        }
      }
    });

    if (!subscription) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // Check if subscription is set to cancel at period end
    if (subscription.cancelAtPeriodEnd) {
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

