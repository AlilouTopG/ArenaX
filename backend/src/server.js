import app from './app.js';
import env from './config/env.js';
import { connectDB, closeDB, isInMemory } from './config/db.js';
import logger from './utils/logger.js';
import { startExpiryReminderCron } from './jobs/subscriptionExpiryJob.js';
import { startNewsCron, runNewsFetchNow } from './jobs/newsFetcherJob.js';
import { seedDemoData } from './services/seedService.js';

const bootstrap = async () => {
  const { isInMemory: memory } = await connectDB();

  if (env.AUTO_SEED) {
    try {
      const seeded = await seedDemoData();
      logger.info(`Auto-seed: ${seeded.gyms} gyms, ${seeded.events} events, ${seeded.news} news articles ready`);
    } catch (error) {
      logger.warn('Auto-seed skipped', { error: error.message });
    }
  }

  if (memory) {
    logger.info('Running on in-memory database - demo data available instantly (resets on restart)');
  }

  startExpiryReminderCron();
  startNewsCron();

  if (env.NODE_ENV === 'production' || env.NEWS_SOURCES.length > 0) {
    runNewsFetchNow().catch((error) => logger.error('Initial news fetch failed', { error: error.message }));
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`ArenaX backend running on port ${env.PORT} (${env.NODE_ENV} | db: ${memory ? 'in-memory' : 'mongodb'})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await closeDB();
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

bootstrap().catch((error) => {
  logger.error('Bootstrap failed', { error: error.message });
  process.exit(1);
});