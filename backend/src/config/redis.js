import { createClient } from 'redis';
import env from './env.js';
import logger from '../utils/logger.js';

let client = null;

if (env.REDIS_URL) {
  client = createClient({ url: env.REDIS_URL });
  client.on('error', (err) => logger.error('Redis error', { error: err.message }));
  client.connect().catch((err) => logger.warn('Redis connect failed, using memory fallbacks', { error: err.message }));
}

export default client;
