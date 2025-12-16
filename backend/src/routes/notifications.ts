import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { sendDailyTodoNotifications, getTodosDueToday } from '../utils/notifications';

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

export default router;
