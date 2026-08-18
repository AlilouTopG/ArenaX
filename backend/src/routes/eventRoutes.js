import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { isCoach } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import { sanitizeInput } from '../middlewares/sanitize.js';
import { apiRateLimiter, writeRateLimiter } from '../middlewares/rateLimiter.js';
import { createEventValidator, updateEventValidator, idParamValidator, listEventsValidator } from '../utils/validators.js';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';

const router = Router();

router.use(apiRateLimiter);

router.get('/', validate(listEventsValidator), listEvents);
router.get('/:id', validate(idParamValidator), getEventById);

router.post('/', protect, isCoach, writeRateLimiter, sanitizeInput, validate(createEventValidator), createEvent);
router.patch('/:id', protect, isCoach, writeRateLimiter, sanitizeInput, validate(updateEventValidator), updateEvent);
router.delete('/:id', protect, isCoach, writeRateLimiter, validate(idParamValidator), deleteEvent);

export default router;