import express from 'express';
import Stripe from 'stripe';
import prisma from '../utils/prisma';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any
});

// Stripe webhook endpoint (must be before body parsing)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  console.log('[WEBHOOK] Received Stripe webhook request');

  // Validate webhook secret is configured
  if (!webhookSecret) {
    console.error('[WEBHOOK] ERROR: STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`[WEBHOOK] ✓ Signature verified for event: ${event.type} (ID: ${event.id})`);
  } catch (err: any) {
    console.error('[WEBHOOK] ✗ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process the webhook event
  try {
    console.log(`[WEBHOOK] Processing event type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[WEBHOOK] Checkout session completed: ${session.id}`);
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          const userId = session.metadata?.userId;
          if (!userId) {
            console.error('[WEBHOOK] No userId in session metadata - cannot create subscription');
            // Still return 200 to acknowledge receipt
            return res.status(200).json({ 
              received: true, 
              warning: 'No userId in metadata' 
            });
          }

          // Find or create subscription record
          const existing = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id }
          });

          if (existing) {
            console.log(`[WEBHOOK] Updating existing subscription: ${existing.id}`);
            await prisma.subscription.update({
              where: { id: existing.id },
              data: {
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false
              }
            });
          } else {
            console.log(`[WEBHOOK] Creating new subscription for user: ${userId}`);
            await prisma.subscription.create({
              data: {
                userId,
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false
              }
            });
          }
          console.log('[WEBHOOK] ✓ Subscription processed successfully');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] Subscription updated: ${subscription.id}`);
        
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id }
        });

        if (existing) {
          console.log(`[WEBHOOK] Updating subscription record: ${existing.id}`);
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              canceledAt: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000) 
                : null
            }
          });
          console.log('[WEBHOOK] ✓ Subscription updated successfully');
        } else {
          console.warn(`[WEBHOOK] Subscription not found in database: ${subscription.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] Subscription deleted: ${subscription.id}`);
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            canceledAt: new Date()
          }
        });
        console.log('[WEBHOOK] ✓ Subscription marked as canceled');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[WEBHOOK] Invoice payment succeeded: ${invoice.id}`);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          const existing = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id }
          });

          if (existing) {
            console.log(`[WEBHOOK] Updating subscription after successful payment: ${existing.id}`);
            await prisma.subscription.update({
              where: { id: existing.id },
              data: {
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              }
            });
            console.log('[WEBHOOK] ✓ Subscription updated after payment');
          } else {
            console.warn(`[WEBHOOK] Subscription not found for invoice: ${invoice.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[WEBHOOK] Invoice payment failed: ${invoice.id}`);
        
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              status: 'past_due'
            }
          });
          console.log('[WEBHOOK] ✓ Subscription marked as past_due');
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type} - acknowledging receipt`);
    }

    // Always return 200 OK to acknowledge receipt
    console.log(`[WEBHOOK] ✓ Event ${event.id} processed successfully`);
    return res.status(200).json({ received: true });

  } catch (error: any) {
    // Log the error but still return 200 to prevent Stripe from retrying
    // Only critical infrastructure errors should return 500
    console.error('[WEBHOOK] ✗ Error processing webhook:', {
      error: error.message,
      stack: error.stack,
      eventType: event.type,
      eventId: event.id
    });

    // For database errors, we should still acknowledge receipt
    // Stripe will show the error in the dashboard but won't retry
    if (error.code === 'P2002' || error.code?.startsWith('P')) {
      // Prisma error - acknowledge but log
      console.error('[WEBHOOK] Database error - acknowledging receipt anyway');
      return res.status(200).json({ 
        received: true, 
        error: 'Database error logged' 
      });
    }

    // For other errors, return 500 so Stripe retries
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;

