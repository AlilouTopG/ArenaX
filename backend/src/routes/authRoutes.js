import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { sanitizeInput } from '../middlewares/sanitize.js';
import { registerRateLimiter, loginBruteForceLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/auth.js';
import { registerValidator, loginValidator, refreshValidator } from '../utils/validators.js';

const router = Router();

router.post('/register', registerRateLimiter, sanitizeInput, validate(registerValidator), register);
router.post('/login', loginBruteForceLimiter, sanitizeInput, validate(loginValidator), login);
router.post('/refresh', loginBruteForceLimiter, sanitizeInput, validate(refreshValidator), refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

export default router;