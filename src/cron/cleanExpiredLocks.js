import { cleanExpiredLocks } from '../services/bookingService.js';
import logger from '../config/logger.js';

const job = async () => {
  logger.info('Running cron job: cleanExpiredLocks');
  try {
    await cleanExpiredLocks();
    logger.info('Cron job completed: cleanExpiredLocks');
  } catch (error) {
    logger.error(`Error in cleanExpiredLocks cron job: ${error.message}`);
  }
};

export default job;