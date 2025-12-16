import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { sendDailyTodoNotifications, getTodosDueToday, sendRenewalReminderEmails } from '../utils/notifications';

const router = express.Router();

// Protected routes require authentication
router.use(authenticate);
router.use(requireActiveSubscription);

/**
 * GET /api/notifications/todos-due-today
 * Preview todos due today (for testing/debugging)
 */
router.get('/todos-due-today', async (req: AuthRequest, res) => {
  try {
    // Get the current user's email
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true },
    });

    const todosByUser = await getTodosDueToday();
    
    // Filter to only show current user's todos
    const currentUserTodos = todosByUser.find(u => u.userEmail === currentUser?.email);
    
    res.json({
      date: new Date().toISOString(),
      totalUsersWithTodos: todosByUser.length,
      yourTodos: currentUserTodos || { todos: [], message: 'No todos due today' },
    });
  } catch (error) {
    console.error('Error getting todos due today:', error);
    res.status(500).json({ error: 'Failed to get todos due today' });
  }
});

/**
 * POST /api/notifications/send-daily-reminders
 * Manually trigger daily reminder notifications (admin/testing)
 */
router.post('/send-daily-reminders', async (req: AuthRequest, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true },
    });
    
    console.log(`[Notifications] Manual trigger by user ${currentUser?.email}`);
    
    const results = await sendDailyTodoNotifications();
    
    res.json({
      success: true,
      message: 'Daily notifications sent',
      results,
    });
  } catch (error) {
    console.error('Error sending daily reminders:', error);
    res.status(500).json({ error: 'Failed to send daily reminders' });
  }
});

/**
 * POST /api/notifications/test-email
 * Send a test notification email to the current user
 */
router.post('/test-email', async (req: AuthRequest, res) => {
  try {
    const { sendEmail } = await import('../utils/email');
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true, firstName: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await sendEmail({
      to: user.email,
      subject: '🧪 Test Email from Capture Show Leads',
      text: `Hi ${user.firstName},\n\nThis is a test email to confirm your notification settings are working.\n\nBest,\nCapture Show Leads`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>🧪 Test Email</h2>
          <p>Hi ${user.firstName},</p>
          <p>This is a test email to confirm your notification settings are working.</p>
          <p>Best,<br>Capture Show Leads</p>
        </div>
      `,
    });

    if ('disabled' in result && result.disabled) {
      res.json({
        success: false,
        message: 'Email sending is disabled. SMTP environment variables not configured.',
      });
    } else {
      res.json({
        success: true,
        message: `Test email sent to ${user.email}`,
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

/**
 * POST /api/notifications/send-renewal-reminders
 * Manually trigger renewal reminder emails (admin/testing)
 */
router.post('/send-renewal-reminders', async (req: AuthRequest, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true },
    });
    
    console.log(`[Notifications] Renewal reminder manual trigger by user ${currentUser?.email}`);
    
    const results = await sendRenewalReminderEmails();
    
    res.json({
      success: true,
      message: 'Renewal reminder check completed',
      results,
    });
  } catch (error) {
    console.error('Error sending renewal reminders:', error);
    res.status(500).json({ error: 'Failed to send renewal reminders' });
  }
});

/**
 * POST /api/notifications/test-renewal-email
 * Send a TEST renewal reminder email to the current user (for testing the email format)
 */
router.post('/test-renewal-email', async (req: AuthRequest, res) => {
  try {
    const { sendEmail } = await import('../utils/email');
    
    // Get user and subscription details
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true, firstName: true },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine plan type
    const isAnnual = subscription?.stripePriceId?.includes('annual') || subscription?.stripePriceId?.includes('year');
    const planType = isAnnual ? 'Annual Subscription' : 'Monthly Subscription';
    const amount = isAnnual ? '$920.00/year' : '$99.00/month';
    
    // Use actual renewal date or simulate one 5 days from now
    const renewalDate = subscription?.currentPeriodEnd || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const renewalDateFormatted = new Date(renewalDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://csl-bjg7z.ondigitalocean.app';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #fffbeb; padding: 20px; border: 1px solid #fcd34d; }
    .highlight-box { background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight-box h3 { margin-top: 0; color: #b45309; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-right: 10px; margin-top: 10px; }
    .btn-primary { background: #3B82F6; color: white; }
    .btn-danger { background: #EF4444; color: white; }
    .footer { padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: white; }
    .important { color: #b45309; font-weight: bold; }
    .test-banner { background: #fee2e2; color: #991b1b; padding: 10px; text-align: center; font-weight: bold; border-radius: 8px 8px 0 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="test-banner">🧪 TEST EMAIL - This is a preview of the renewal reminder</div>
    <div class="header">
      <h1>⏰ Subscription Renewal Reminder</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      
      <p>This is a friendly reminder that your <strong>${planType}</strong> subscription to Capture Show Leads will automatically renew in <span class="important">5 days</span>.</p>
      
      <div class="highlight-box">
        <h3>📅 Renewal Details</h3>
        <p><strong>Plan:</strong> ${planType}</p>
        <p><strong>Renewal Date:</strong> ${renewalDateFormatted}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p>Your credit card on file will be charged automatically.</p>
      </div>
      
      <p><strong>Want to continue?</strong> No action needed! Your subscription will renew automatically and you'll continue to have full access to all features.</p>
      
      <p><strong>Need to cancel?</strong> You can cancel your subscription anytime before the renewal date. After cancellation, you will have 5 days of continued access before your account is restricted.</p>
      
      <div style="margin-top: 20px;">
        <a href="${FRONTEND_URL}/account-settings" class="btn btn-primary">
          Manage Subscription →
        </a>
        <a href="${FRONTEND_URL}/account-settings" class="btn btn-danger">
          Cancel Subscription
        </a>
      </div>
      
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        Questions? Contact us at <a href="mailto:support@CaptureShowLeads.com">support@CaptureShowLeads.com</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated reminder from Capture Show Leads.</p>
      <p>© ${new Date().getFullYear()} Capture Show Leads</p>
    </div>
  </div>
</body>
</html>
`;

    const text = `
🧪 TEST EMAIL - This is a preview of the renewal reminder

SUBSCRIPTION RENEWAL REMINDER

Hi ${user.firstName},

This is a friendly reminder that your ${planType} subscription to Capture Show Leads will automatically renew in 5 DAYS.

RENEWAL DETAILS:
- Plan: ${planType}
- Renewal Date: ${renewalDateFormatted}
- Amount: ${amount}

Your credit card on file will be charged automatically.

WANT TO CONTINUE?
No action needed! Your subscription will renew automatically.

NEED TO CANCEL?
You can cancel your subscription anytime before the renewal date:
${FRONTEND_URL}/account-settings

After cancellation, you will have 5 days of continued access before your account is restricted.

Questions? Contact us at support@CaptureShowLeads.com

---
This is an automated reminder from Capture Show Leads.
`;

    const result = await sendEmail({
      to: user.email,
      subject: `🧪 [TEST] Your subscription renews on ${renewalDateFormatted}`,
      text,
      html,
    });

    if ('disabled' in result && result.disabled) {
      res.json({
        success: false,
        message: 'Email sending is disabled. SMTP environment variables not configured.',
      });
    } else {
      res.json({
        success: true,
        message: `Test renewal reminder email sent to ${user.email}`,
        details: {
          planType,
          amount,
          renewalDate: renewalDateFormatted,
          actualSubscriptionEnd: subscription?.currentPeriodEnd,
        },
      });
    }
  } catch (error) {
    console.error('Error sending test renewal email:', error);
    res.status(500).json({ error: 'Failed to send test renewal email' });
  }
});

/**
 * GET /api/notifications/subscription-status
 * Check current user's subscription status and when renewal reminder would be sent
 */
router.get('/subscription-status', async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        message: 'No subscription found',
      });
    }

    const now = new Date();
    const renewalDate = new Date(subscription.currentPeriodEnd);
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate when reminder would be sent (5 days before)
    const reminderDate = new Date(renewalDate);
    reminderDate.setDate(reminderDate.getDate() - 5);

    res.json({
      hasSubscription: true,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewalDateFormatted: renewalDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      daysUntilRenewal,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      reminderWouldBeSentOn: reminderDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      expiryEmailSentAt: subscription.expiryEmailSentAt,
      wouldReceiveReminder: daysUntilRenewal <= 5 && daysUntilRenewal > 0 && !subscription.cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

export default router;
