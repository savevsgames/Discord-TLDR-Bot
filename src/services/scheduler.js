import cron from 'node-cron';
import { getConfig, updateLastSummaryTime } from '../utils/config.js';
import { createSummary } from './summarizer.js';
import { logger } from '../utils/logger.js';

let scheduledTask = null;

/**
 * Setup the scheduler for hourly summaries
 * @param {Client} client - Discord.js client
 */
export function setupScheduler(client) {
  // Schedule the task to run every hour at the 0th minute
  scheduledTask = cron.schedule('0 * * * *', async () => {
    logger.info('Running scheduled summary task');
    
    try {
      await runHourlySummary(client);
    } catch (error) {
      logger.error('Error in scheduled summary task:', error);
    }
  });
  
  logger.info('Hourly summary scheduler set up');
  
  return scheduledTask;
}

/**
 * Run the hourly summary task
 * @param {Client} client - Discord.js client
 */
export async function runHourlySummary(client) {
  const config = getConfig();
  
  // Check if summary channel is configured
  if (!config.summaryChannelId) {
    logger.warn('No summary channel configured. Skipping hourly summary.');
    return false;
  }
  
  // Check if there are any monitored channels
  if (config.monitoredChannelIds.length === 0) {
    logger.warn('No channels are being monitored. Skipping hourly summary.');
    return false;
  }
  
  // Create and post the summary
  const success = await createSummary(client);
  
  if (success) {
    // Update the last summary time
    await updateLastSummaryTime();
    logger.info('Hourly summary completed successfully');
  } else {
    logger.warn('Failed to create hourly summary');
  }
  
  return success;
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    logger.info('Hourly summary scheduler stopped');
  }
}