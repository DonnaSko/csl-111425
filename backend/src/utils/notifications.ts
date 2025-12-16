// Daily todo notification service
import prisma from './prisma';
import { sendEmail } from './email';
import { sendSMS, formatPhoneForSMS } from './sms';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://csl-bjg7z.ondigitalocean.app';

type TodoWithDealer = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  followUpDate: Date | null;
  type: string;
  dealer: {
    id: string;
    companyName: string;
    contactName: string | null;
  } | null;
};

type UserWithTodos = {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userPhone?: string | null;
  companyName: string;
  dailyEmailReminders: boolean;
  todos: TodoWithDealer[];
};

/**
 * Get all INCOMPLETE todos for users with active subscriptions
 * Includes: past due todos, todos due today, and upcoming todos with dates
 * This ensures users are reminded of ALL tasks they haven't completed yet
 */
export async function getTodosDueToday(): Promise<UserWithTodos[]> {
  const now = new Date();
  
  console.log(`[Notifications] Checking all incomplete todos as of ${now.toISOString()}`);

  // Find all users with active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'trialing'] },
    },
    include: {
      user: {
        include: {
          company: true,
        },
      },
    },
  });

  console.log(`[Notifications] Found ${activeSubscriptions.length} active subscriptions`);

  const results: UserWithTodos[] = [];

  for (const sub of activeSubscriptions) {
    const user = sub.user;
    const companyId = user.companyId;

    // Find ALL incomplete todos (past due, today, or with any date set)
    const todos = await prisma.todo.findMany({
      where: {
        companyId,
        completed: false,
        OR: [
          // Todos with a due date (past, present, or future)
          {
            dueDate: { not: null },
          },
          // Todos with a follow-up date
          {
            followUp: true,
            followUpDate: { not: null },
          },
          // Todos with no date but still incomplete (general tasks)
          {
            dueDate: null,
            followUpDate: null,
          },
        ],
      },
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { followUpDate: 'asc' },
      ],
    });

    if (todos.length > 0) {
      results.push({
        userId: user.id,
        userEmail: user.email,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        companyName: user.company.name,
        dailyEmailReminders: (user as any).dailyEmailReminders ?? true,
        todos,
      });
    }
  }

  console.log(`[Notifications] Found ${results.length} users with todos due today`);
  return results;
}

/**
 * Format todos into an HTML email
 */
function formatEmailHTML(user: UserWithTodos): string {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0; opacity: 0.9; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .todo-list { list-style: none; padding: 0; margin: 0; }
    .todo-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 12px; }
    .todo-title { font-weight: 600; font-size: 16px; color: #1e293b; margin-bottom: 5px; }
    .todo-description { color: #64748b; font-size: 14px; margin-bottom: 8px; }
    .todo-meta { font-size: 12px; color: #94a3b8; }
    .todo-meta span { margin-right: 15px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-general { background: #e2e8f0; color: #475569; }
    .badge-email { background: #dbeafe; color: #1d4ed8; }
    .badge-snail_mail { background: #fef3c7; color: #b45309; }
    .footer { padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: white; }
    .count-badge { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Today's To-Dos</h1>
      <p>${todayFormatted}</p>
    </div>
    <div class="content">
      <p>Hi ${user.userFirstName},</p>
      <p>You have <span class="count-badge">${user.todos.length}</span> task${user.todos.length !== 1 ? 's' : ''} due today:</p>
      <ul class="todo-list">
`;

  for (const todo of user.todos) {
    const badgeClass = `badge-${todo.type}`;
    const dealerInfo = todo.dealer 
      ? `<span>👤 ${todo.dealer.companyName}${todo.dealer.contactName ? ` (${todo.dealer.contactName})` : ''}</span>` 
      : '';
    
    const dateInfo = todo.dueDate 
      ? `Due: ${new Date(todo.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      : todo.followUpDate 
        ? `Follow-up: ${new Date(todo.followUpDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : '';

    html += `
        <li class="todo-item">
          <div class="todo-title">
            ${todo.title}
            <span class="badge ${badgeClass}">${todo.type}</span>
          </div>
          ${todo.description ? `<div class="todo-description">${todo.description}</div>` : ''}
          <div class="todo-meta">
            ${dealerInfo}
            <span>🕐 ${dateInfo}</span>
          </div>
        </li>
`;
  }

  html += `
      </ul>
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'https://csl-bjg7z.ondigitalocean.app'}" 
           style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Open Capture Show Leads →
        </a>
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

  return html;
}

/**
 * Format todos into a plain text email
 */
function formatEmailText(user: UserWithTodos): string {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let text = `TODAY'S TO-DOS - ${todayFormatted}\n\n`;
  text += `Hi ${user.userFirstName},\n\n`;
  text += `You have ${user.todos.length} task${user.todos.length !== 1 ? 's' : ''} due today:\n\n`;

  for (let i = 0; i < user.todos.length; i++) {
    const todo = user.todos[i];
    text += `${i + 1}. ${todo.title} [${todo.type}]\n`;
    if (todo.description) {
      text += `   ${todo.description}\n`;
    }
    if (todo.dealer) {
      text += `   Dealer: ${todo.dealer.companyName}${todo.dealer.contactName ? ` (${todo.dealer.contactName})` : ''}\n`;
    }
    text += '\n';
  }

  text += `\nOpen Capture Show Leads: ${process.env.FRONTEND_URL || 'https://csl-bjg7z.ondigitalocean.app'}\n`;
  text += `\n---\nThis is an automated reminder from Capture Show Leads.`;

  return text;
}

/**
 * Format todos into an SMS message
 */
function formatSMSMessage(user: UserWithTodos): string {
  let msg = `📋 CSL: You have ${user.todos.length} task${user.todos.length !== 1 ? 's' : ''} due today:\n\n`;
  
  // Keep SMS concise - just list titles
  for (let i = 0; i < Math.min(user.todos.length, 5); i++) {
    const todo = user.todos[i];
    msg += `• ${todo.title}`;
    if (todo.dealer) {
      msg += ` (${todo.dealer.companyName})`;
    }
    msg += '\n';
  }

  if (user.todos.length > 5) {
    msg += `...and ${user.todos.length - 5} more\n`;
  }

  msg += `\nOpen app to view all.`;

  return msg;
}

/**
 * Send daily todo notifications to all users with todos due today
 */
export async function sendDailyTodoNotifications(): Promise<{
  emailsSent: number;
  smsSent: number;
  usersNotified: string[];
  errors: string[];
}> {
  console.log('[Notifications] Starting daily todo notification job...');
  
  const results = {
    emailsSent: 0,
    smsSent: 0,
    usersNotified: [] as string[],
    errors: [] as string[],
  };

  try {
    const usersTodos = await getTodosDueToday();

    if (usersTodos.length === 0) {
      console.log('[Notifications] No users have todos due today.');
      return results;
    }

    for (const user of usersTodos) {
      // Skip users who have opted out of daily email reminders
      if (!user.dailyEmailReminders) {
        console.log(`[Notifications] Skipping ${user.userEmail} - daily email reminders disabled`);
        continue;
      }
      
      console.log(`[Notifications] Processing ${user.userEmail} with ${user.todos.length} todos...`);

      // Send email
      try {
        const emailResult = await sendEmail({
          to: user.userEmail,
          subject: `📋 You have ${user.todos.length} task${user.todos.length !== 1 ? 's' : ''} due today`,
          text: formatEmailText(user),
          html: formatEmailHTML(user),
        });

        if (emailResult && !('disabled' in emailResult && emailResult.disabled)) {
          results.emailsSent++;
          console.log(`[Notifications] Email sent to ${user.userEmail}`);
        }
      } catch (error) {
        const errorMsg = `Failed to send email to ${user.userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Notifications] ${errorMsg}`);
        results.errors.push(errorMsg);
      }

      // Send SMS if user has a phone number
      // Note: We need to get phone from somewhere - for now we'll use a placeholder
      // In production, you'd want to add a phone field to the User model
      if (user.userPhone) {
        const formattedPhone = formatPhoneForSMS(user.userPhone);
        if (formattedPhone) {
          try {
            const smsResult = await sendSMS({
              to: formattedPhone,
              body: formatSMSMessage(user),
            });

            if (smsResult.success) {
              results.smsSent++;
              console.log(`[Notifications] SMS sent to ${formattedPhone}`);
            } else if (!smsResult.disabled) {
              results.errors.push(`SMS failed for ${user.userEmail}: ${smsResult.error}`);
            }
          } catch (error) {
            const errorMsg = `Failed to send SMS to ${user.userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Notifications] ${errorMsg}`);
            results.errors.push(errorMsg);
          }
        }
      }

      results.usersNotified.push(user.userEmail);
    }

    console.log(`[Notifications] Completed. Emails: ${results.emailsSent}, SMS: ${results.smsSent}, Users: ${results.usersNotified.length}`);
    return results;
  } catch (error) {
    console.error('[Notifications] Fatal error:', error);
    results.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
}

/**
 * Format renewal reminder email HTML
 */
function formatRenewalReminderHTML(
  firstName: string,
  planType: string,
  renewalDate: Date,
  amount: string
): string {
  const renewalDateFormatted = renewalDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Subscription Renewal Reminder</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>
      
      <p>This is a friendly reminder that your <strong>${planType}</strong> to Capture Show Leads will automatically renew in <span class="important">5 days</span>.</p>
      
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
}

/**
 * Format renewal reminder email plain text
 */
function formatRenewalReminderText(
  firstName: string,
  planType: string,
  renewalDate: Date,
  amount: string
): string {
  const renewalDateFormatted = renewalDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
SUBSCRIPTION RENEWAL REMINDER

Hi ${firstName},

This is a friendly reminder that your ${planType} to Capture Show Leads will automatically renew in 5 DAYS.

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
}

/**
 * Send renewal reminder emails to users whose subscriptions renew in 5 days
 */
export async function sendRenewalReminderEmails(): Promise<{
  emailsSent: number;
  usersNotified: string[];
  errors: string[];
}> {
  console.log('[Notifications] Starting renewal reminder job...');
  
  const results = {
    emailsSent: 0,
    usersNotified: [] as string[],
    errors: [] as string[],
  };

  try {
    const now = new Date();
    
    // Calculate the date range for subscriptions renewing in 5 days
    const fiveDaysFromNow = new Date(now);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    
    // Start of day 5 days from now
    const startOfDay5 = new Date(fiveDaysFromNow);
    startOfDay5.setHours(0, 0, 0, 0);
    
    // End of day 5 days from now
    const endOfDay5 = new Date(fiveDaysFromNow);
    endOfDay5.setHours(23, 59, 59, 999);

    console.log(`[Notifications] Looking for subscriptions renewing between ${startOfDay5.toISOString()} and ${endOfDay5.toISOString()}`);

    // Find active subscriptions that:
    // 1. Renew in 5 days
    // 2. Have NOT been canceled (cancelAtPeriodEnd = false)
    // 3. Have NOT already received a renewal reminder this period
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          gte: startOfDay5,
          lte: endOfDay5,
        },
        // Only send if we haven't sent a reminder for this period
        OR: [
          { expiryEmailSentAt: null },
          {
            expiryEmailSentAt: {
              lt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // More than 25 days ago (for monthly)
            },
          },
        ],
      },
      include: {
        user: true,
      },
    });

    console.log(`[Notifications] Found ${subscriptions.length} subscriptions renewing in 5 days`);

    for (const sub of subscriptions) {
      const user = sub.user;
      
      // Determine plan type based on price ID or other logic
      const isAnnual = sub.stripePriceId?.includes('annual') || sub.stripePriceId?.includes('year');
      const planType = isAnnual ? 'Annual Subscription' : 'Monthly Subscription';
      const amount = isAnnual ? '$99.00/year' : '$19.00/month'; // Adjust these amounts as needed
      
      try {
        await sendEmail({
          to: user.email,
          subject: `⏰ Your Capture Show Leads subscription renews in 5 days`,
          text: formatRenewalReminderText(user.firstName, planType, sub.currentPeriodEnd, amount),
          html: formatRenewalReminderHTML(user.firstName, planType, sub.currentPeriodEnd, amount),
        });

        // Mark that we sent the renewal reminder
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { expiryEmailSentAt: now },
        });

        results.emailsSent++;
        results.usersNotified.push(user.email);
        console.log(`[Notifications] Renewal reminder sent to ${user.email}`);
      } catch (error) {
        const errorMsg = `Failed to send renewal reminder to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Notifications] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[Notifications] Renewal reminder job completed. Emails sent: ${results.emailsSent}`);
    return results;
  } catch (error) {
    console.error('[Notifications] Fatal error in renewal reminder job:', error);
    results.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
}

