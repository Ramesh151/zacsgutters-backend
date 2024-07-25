// cronJobs.js

import cron from 'node-cron';
import { cleanExpiredLocks } from './services/bookingService.js';
import logger from './config/logger.js';

const setupCronJobs = () => {
  // Clean expired locks every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running cron job: cleanExpiredLocks');
    try {
      await cleanExpiredLocks();
      logger.info('Cron job completed: cleanExpiredLocks');
    } catch (error) {
      logger.error(`Error in cleanExpiredLocks cron job: ${error.message}`);
    }
  });

  // You can add more scheduled tasks here
  // For example, a daily backup task
  cron.schedule('0 1 * * *', () => {
    logger.info('Running cron job: dailyBackup');
    // Implement your backup logic here
  });

  logger.info('Cron jobs set up successfully');
};

export default setupCronJobs;