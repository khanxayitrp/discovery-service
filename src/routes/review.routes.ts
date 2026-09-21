import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { reviewIdParamSchema } from '../dto/review.dto';

const router = Router();

// Member: Delete review by ID (Author or Admin)
router.delete(
    '/:reviewId',
    requireAuth,
    validateRequest({ params: reviewIdParamSchema }),
    (req, res, next) => reviewController.deleteReview(req, res, next)
);

export default router;