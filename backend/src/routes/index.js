import { Router } from 'express';
import env from '../config/env.js';
import { getDbMode } from '../config/db.js';
import authRoutes from './authRoutes.js';
import gymRoutes from './gymRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import newsRoutes from './newsRoutes.js';
import coachRoutes from './coachRoutes.js';
import mapRoutes from './mapRoutes.js';
import eventRoutes from './eventRoutes.js';

const router = Router();

const health = (_req, res) => {
  res.json({
    success: true,
    message: 'ArenaX API is running',
    service: 'ArenaX',
    version: '1.0.0',
    database: getDbMode(),
    time: new Date().toISOString(),
  });
};

router.get('/health', health);
router.use('/auth', authRoutes);
router.use('/gyms', gymRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/news', newsRoutes);
router.use('/coach/settings', coachRoutes);
router.use('/map', mapRoutes);
router.use('/events', eventRoutes);

router.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

export default router;