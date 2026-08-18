import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  MONGO_URI: process.env.MONGO_URI || null,
  AUTO_SEED: process.env.AUTO_SEED !== 'false',
  REDIS_URL: process.env.REDIS_URL || null,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev_access_secret_not_for_production'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev_refresh_secret_not_for_production'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'ArenaX',

  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim()),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  RATE_LIMIT_AUTH_MAX: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',

  NEWS_FETCH_INTERVAL_MIN: parseInt(process.env.NEWS_FETCH_INTERVAL_MIN || '30', 10),
  NEWS_SOURCES: (process.env.NEWS_SOURCES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || null,
  WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL || null,

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

const requiredSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
if (env.NODE_ENV === 'production') {
  for (const key of requiredSecrets) {
    if (!env[key]) {
      throw new Error(`Missing required environment secret: ${key}`);
    }
  }
}

export default Object.freeze(env);
