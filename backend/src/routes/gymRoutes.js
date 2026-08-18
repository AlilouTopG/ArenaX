import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { isAdmin, isCoach } from '../middlewares/rbac.js';
import { writeRateLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { sanitizeInput } from '../middlewares/sanitize.js';
import { createGymValidator, idParamValidator } from '../utils/validators.js';
import {
  createGym,
  getMyGym,
  updateGym,
  listGyms,
  getGymById,
  verifyGym,
} from '../controllers/gymController.js';

const router = Router();

router.get('/', listGyms);
router.get('/:id', validate(idParamValidator), getGymById);

router.post('/', protect, isCoach, writeRateLimiter, sanitizeInput, validate(createGymValidator), createGym);
router.get('/me/gym', protect, isCoach, getMyGym);
router.patch('/me/gym', protect, isCoach, writeRateLimiter, sanitizeInput, updateGym);

router.patch('/:id/verify', protect, isAdmin, writeRateLimiter, validate(idParamValidator), verifyGym);

export default router;