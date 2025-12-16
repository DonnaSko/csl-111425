// Simple scheduler for daily notifications
// Runs at 8:00 AM every day

import { sendDailyTodoNotifications } from './notifications';

let schedulerInterval: NodeJS.Timeout | null = null;
let lastRunDate: string | null = null;

/**
 * Check if it's time to run the daily notification (8:00 AM)
 */
function shouldRunNotification(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Run at 8:00 AM (between 8:00 and 8:01)
  const isCorrectTime = hour === 8 && minute === 0;
  
  // Only run once per day
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
    
    console.log(`[Scheduler] Running daily notification job at ${new Date().toISOString()}`);
    
    try {
      const results = await sendDailyTodoNotifications();
      console.log(`[Scheduler] Daily notification complete:`, results);
    } catch (error) {
      console.error('[Scheduler] Error running daily notification:', error);
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

  console.log('[Scheduler] Starting notification scheduler (8:00 AM daily)');
  
  // Check every minute
  schedulerInterval = setInterval(runScheduledCheck, 60 * 1000);
  
  // Also run an immediate check in case server starts at 8:00 AM
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
    nextRunTime: '8:00 AM daily',
    serverTime: new Date().toISOString(),
  };
}

