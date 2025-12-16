// Daily todo notification service
import prisma from './prisma';
import { sendEmail } from './email';
import { sendSMS, formatPhoneForSMS } from './sms';

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
  todos: TodoWithDealer[];
};

/**
 * Get all todos due today for users with active subscriptions
 * Uses a time window to account for US timezone differences (EST=UTC-5 to PST=UTC-8)
 */
export async function getTodosDueToday(): Promise<UserWithTodos[]> {
  // Create a window that covers "today" in all US timezones
  // - "Today" in EST starts at UTC 05:00 (midnight EST = UTC+5 hours)
  // - "Today" in PST ends at UTC+8 hours the next day (midnight PST = UTC+8 hours)
  // So for Dec 16: we search from Dec 16 00:00 UTC to Dec 17 08:00 UTC
  const now = new Date();
  
  // Start: beginning of today in UTC (catches early AM in eastern timezones)
  const startWindow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  
  // End: 8 AM UTC the next day (catches 11:59 PM PST which is 07:59 UTC next day)
  const endWindow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 8, 0, 0, 0));

  console.log(`[Notifications] Checking todos due between ${startWindow.toISOString()} and ${endWindow.toISOString()}`);

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

    // Find todos due today (by dueDate OR followUpDate)
    const todos = await prisma.todo.findMany({
      where: {
        companyId,
        completed: false,
        OR: [
          {
            dueDate: {
              gte: startWindow,
              lte: endWindow,
            },
          },
          {
            followUp: true,
            followUpDate: {
              gte: startWindow,
              lte: endWindow,
            },
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

