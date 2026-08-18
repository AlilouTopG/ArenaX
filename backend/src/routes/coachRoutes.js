import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { isCoach } from '../middlewares/rbac.js';
import { writeRateLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { sanitizeInput } from '../middlewares/sanitize.js';
import { coachSettingsValidator } from '../utils/validators.js';
import {
  getSettings,
  updateSettings,
  linkTelegram,
  testNotification,
} from '../controllers/coachController.js';

const router = Router();

router.use(protect, isCoach, writeRateLimiter);

router.get('/', getSettings);
router.patch('/', sanitizeInput, validate(coachSettingsValidator), updateSettings);
router.post('/telegram/link', sanitizeInput, linkTelegram);
router.post('/test', testNotification);

export default router;