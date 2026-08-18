import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { runNewsEngine } from '../src/services/newsEngineService.js';
import logger from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const main = async () => {
  await connectDB();
  logger.info('Starting manual news fetch (AI News Engine)');
  const stored = await runNewsEngine();
  logger.info(`Done. Stored ${stored} new article(s).`);
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (error) => {
  logger.error('fetch-news failed', { error: error.message });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});