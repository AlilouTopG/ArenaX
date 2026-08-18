import cron from 'node-cron';
import env from '../config/env.js';
import { runNewsEngine } from '../services/newsEngineService.js';
import logger from '../utils/logger.js';

export const runNewsFetchNow = async () => {
  logger.info('Starting AI news engine run');
  const stored = await runNewsEngine();
  logger.info(`AI news engine completed, stored ${stored} articles`);
  return stored;
};

export const startNewsCron = () => {
  const minutes = Math.min(env.NEWS_FETCH_INTERVAL_MIN || 30, 59);
  const expression = `*/${minutes} * * * *`;
  const job = cron.schedule(expression, async () => {
    await runNewsFetchNow().catch((error) => logger.error('News cron failed', { error: error.message }));
  });
  logger.info(`AI news cron scheduled (every ${minutes} minutes)`);
  return job;
};