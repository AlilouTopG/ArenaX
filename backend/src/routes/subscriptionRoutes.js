import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { isCoach } from '../middlewares/rbac.js';
import { writeRateLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { sanitizeInput } from '../middlewares/sanitize.js';
import { createSubscriptionValidator, listSubscriptionsValidator, idParamValidator } from '../utils/validators.js';
import {
  create,
  list,
  getOne,
  update,
  remove,
} from '../controllers/subscriptionController.js';

const router = Router();

router.use(protect, isCoach, writeRateLimiter);

router.post('/', sanitizeInput, validate(createSubscriptionValidator), create);
router.get('/', validate(listSubscriptionsValidator), list);
router.get('/:id', validate(idParamValidator), getOne);
router.patch('/:id', sanitizeInput, validate(idParamValidator), update);
router.delete('/:id', validate(idParamValidator), remove);

export default router;