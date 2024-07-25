import cron from 'node-cron';
import cleanExpiredLocksJob from './cleanExpiredLocks.js';
// Import other jobs as needed

const setupCronJobs = () => {
  // Clean expired locks every 15 minutes
  cron.schedule('*/15 * * * *', cleanExpiredLocksJob);

  // Add other cron jobs here
  // cron.schedule('0 1 * * *', dailyBackupJob);

  logger.info('Cron jobs set up successfully');
};

export default setupCronJobs;