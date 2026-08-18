import { Router } from 'express';
import { newsRateLimiter } from '../middlewares/rateLimiter.js';
import { listNews, getNewsById, getCategories } from '../controllers/newsController.js';
import { validate } from '../middlewares/validate.js';
import { idParamValidator } from '../utils/validators.js';

const router = Router();

router.use(newsRateLimiter);

router.get('/', listNews);
router.get('/categories', getCategories);
router.get('/:id', validate(idParamValidator), getNewsById);

export default router;