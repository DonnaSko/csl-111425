// Simple scheduler for daily notifications
// Runs at 4:53 PM every day

import { sendDailyTodoNotifications, sendRenewalReminderEmails } from './notifications';

let schedulerInterval: NodeJS.Timeout | null = null;
let lastRunDate: string | null = null;

/**
 * Check if it's time to run the daily notification (4:53 PM)
 */
function shouldRunNotification(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Run at 4:53 PM (between 16:53 and 16:54)
  const isCorrectTime = hour === 16 && minute === 53;
  
  // Only run once per day - this prevents duplicate emails
  const hasNotRunToday = lastRunDate !== today;

  return isCorrectTime && hasNotRunToday;
}

/**
 * Run the scheduled check
 */
async function runScheduledCheck() {
  if (shouldRunNotification()) {
    const today = new Date().toISOString().split('T')[0];
    lastRunDate = today;
    
    console.log(`[Scheduler] Running daily notification jobs at ${new Date().toISOString()}`);
    
    // Send daily todo notifications
    try {
      const todoResults = await sendDailyTodoNotifications();
      console.log(`[Scheduler] Daily todo notification complete:`, todoResults);
    } catch (error) {
      console.error('[Scheduler] Error running daily todo notification:', error);
    }
    
    // Send renewal reminder emails (5 days before renewal)
    try {
      const renewalResults = await sendRenewalReminderEmails();
      console.log(`[Scheduler] Renewal reminder job complete:`, renewalResults);
    } catch (error) {
      console.error('[Scheduler] Error running renewal reminder job:', error);
    }
  }
}

/**
 * Start the scheduler
 * Checks every minute if it's time to send notifications
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log('[Scheduler] Scheduler already running');
    return;
  }

  console.log('[Scheduler] Starting notification scheduler (4:53 PM daily)');
  
  // Check every minute
  schedulerInterval = setInterval(runScheduledCheck, 60 * 1000);
  
  // Also run an immediate check in case server starts at 4:53 PM
  runScheduledCheck();
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Scheduler stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    lastRunDate,
    nextRunTime: '4:53 PM daily',
    serverTime: new Date().toISOString(),
  };
}

