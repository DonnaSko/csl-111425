import prisma from './prisma';

export const canCancelSubscription = (currentPeriodEnd: Date): boolean => {
  const now = new Date();
  const daysUntilRenewal = Math.ceil(
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilRenewal >= 5;
};

export const getSubscriptionStatus = async (userId: string) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (!subscription) {
    return { hasActiveSubscription: false, subscription: null };
  }

  const isActive = 
    subscription.status === 'active' && 
    subscription.currentPeriodEnd >= new Date();

  return {
    hasActiveSubscription: isActive,
    subscription,
    canCancel: canCancelSubscription(subscription.currentPeriodEnd)
  };
};

