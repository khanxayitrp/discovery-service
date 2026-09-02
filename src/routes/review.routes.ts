import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';

const router = Router();
router.get('/:placeId', reviewController.getPlaceReviews.bind(reviewController));
router.post('/', reviewController.createReview.bind(reviewController));
export default router;