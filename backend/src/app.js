import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import env from './config/env.js';
import { corsOptions } from './config/cors.js';
import routes from './routes/index.js';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { sanitizeInput } from './middlewares/sanitize.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
        upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts:
      env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
  }),
);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  return next();
});

app.use(cors(corsOptions));

app.use(compression());

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use(mongoSanitize());
app.use(sanitizeInput);

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'ArenaX Sports Hub API', docs: `${env.API_PREFIX}/health` });
});

app.use(env.API_PREFIX, globalRateLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;