import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { nearByValidator } from '../utils/validators.js';
import { nearByGyms, gymMapMarkers } from '../controllers/mapController.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.use(apiRateLimiter);

router.get('/nearby', validate(nearByValidator), nearByGyms);
router.get('/markers', gymMapMarkers);

export default router;