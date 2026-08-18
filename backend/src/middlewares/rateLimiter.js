import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import redis from '../config/redis.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Rate Limiting Framework (RLF)
 * - Uses Redis when available (shared, cluster-safe), otherwise falls back to in-memory.
 * - Applied globally + strict tiers for auth (brute-force protection).
 */

const createStore = (keyPrefix, points, durationSec, blockDurationSec) => {
  if (env.REDIS_URL) {
    return new RateLimiterRedis({
      storeClient: redis,
      keyPrefix,
      points,
      duration: durationSec,
      blockDuration: blockDurationSec,
    });
  }
  return new RateLimiterMemory({
    keyPrefix,
    points,
    duration: durationSec,
    blockDuration: blockDurationSec,
  });
};

const toSeconds = (ms) => Math.ceil(ms / 1000);

/* ------------------------- Global tier ------------------------- */

const points = env.RATE_LIMIT_MAX;
const duration = toSeconds(env.RATE_LIMIT_WINDOW_MS);

export const globalLimiter = createStore('rl:global', points, duration, duration * 2);
logger.info(env.REDIS_URL ? 'Rate limiter backed by Redis' : 'Rate limiter using in-memory store (set REDIS_URL in production)');

export const globalRateLimiter = (req, res, next) => {
  globalLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((err) => {
      if (err instanceof Error) {
        logger.error('Rate limiter error', { error: err.message });
        return next(err);
      }
      res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfterSeconds: Math.ceil(err.msBeforeNext / 1000),
      });
    });
};

/* ------------------------- Route tiers ------------------------- */

const newsLimiter = createStore('rl:news', 30, 60, 120);
const apiLimiter = createStore('rl:api', 120, 60, 120);
const writeLimiterStore = createStore('rl:write', 30, 60, 120);

const consume = (limiterInstance) => (req, res, next) => {
  limiterInstance
    .consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ success: false, message: 'Too many requests, slow down.' }));
};

export const newsRateLimiter = consume(newsLimiter);
export const apiRateLimiter = consume(apiLimiter);
export const writeRateLimiter = consume(writeLimiterStore);

/* --------------- Strict brute-force protection (auth) --------------- */

const LOGIN_MAX_PER_IP = 20;
const LOGIN_MAX_PER_IP_EMAIL = 5;
const LOGIN_WINDOW = 900;
const LOGIN_BLOCK = 1800;
const REGISTER_MAX_PER_IP = 5;
const REGISTER_WINDOW = 3600;
const REGISTER_BLOCK = 3600;

const loginByIp = createStore('rl:bf:ip', LOGIN_MAX_PER_IP, LOGIN_WINDOW, LOGIN_BLOCK);
const loginByIpEmail = createStore('rl:bf:login', LOGIN_MAX_PER_IP_EMAIL, LOGIN_WINDOW, LOGIN_BLOCK);
const registerByIp = createStore('rl:bf:register', REGISTER_MAX_PER_IP, REGISTER_WINDOW, REGISTER_BLOCK);

const tooMany = (res, msBeforeNext) => {
  res.set('Retry-After', String(Math.ceil(msBeforeNext / 1000)));
  return res.status(429).json({
    success: false,
    message: 'Too many login attempts. Please wait before trying again.',
    retryAfterSeconds: Math.ceil(msBeforeNext / 1000),
  });
};

export const registerRateLimiter = (req, res, next) => {
  registerByIp
    .consume(req.ip)
    .then(() => next())
    .catch((err) => (err instanceof Error ? next(err) : tooMany(res, err.msBeforeNext)));
};

export const loginBruteForceLimiter = (req, res, next) => {
  const email = String(req.body?.email || 'anonymous').toLowerCase().trim();
  const compositeKey = `${req.ip}:${email}`;

  loginByIp
    .consume(req.ip)
    .then(() => loginByIpEmail.consume(compositeKey))
    .then(() => next())
    .catch((err) => {
      if (err instanceof Error) return next(err);
      return tooMany(res, err.msBeforeNext);
    });
};

export const penalizeFailedLogin = async (req) => {
  const email = String(req.body?.email || 'anonymous').toLowerCase().trim();
  const compositeKey = `${req.ip}:${email}`;
  try {
    await loginByIpEmail.penalty(compositeKey);
  } catch (error) {
    logger.debug('Login penalty skipped (already blocked)', { error: error.message });
  }
};