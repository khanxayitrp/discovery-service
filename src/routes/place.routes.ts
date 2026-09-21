import { Router } from 'express';
import { placeController } from '../controllers/place.controller';
import { reviewController } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
    nearbyQuerySchema,
    searchQuerySchema,
    placeParamSchema,
} from '../dto/place.dto';
import {
    getPlaceReviewsQuerySchema,
    getPlaceMediaQuerySchema,
    createReviewSchema,
    placeIdParamSchema,
} from '../dto/review.dto';

const router = Router();

// Public: Nearby discovery (PostGIS + Redis cache)
router.get(
    '/nearby',
    validateRequest({ query: nearbyQuerySchema }),
    (req, res, next) => placeController.getNearby(req, res, next)
);

// Public: Search places (Keyword, Category, Geo, Status)
router.get(
    '/search',
    validateRequest({ query: searchQuerySchema }),
    (req, res, next) => placeController.search(req, res, next)
);

// Public: Place reviews (T02)
router.get(
    '/:placeId/reviews',
    validateRequest({ params: placeIdParamSchema, query: getPlaceReviewsQuerySchema }),
    (req, res, next) => reviewController.getPlaceReviews(req, res, next)
);

// Public: Place media gallery (T02)
router.get(
    '/:placeId/media',
    validateRequest({ params: placeIdParamSchema, query: getPlaceMediaQuerySchema }),
    (req, res, next) => reviewController.getPlaceMedia(req, res, next)
);

// Member: Create or update review for a place (T03)
router.post(
    '/:placeId/reviews',
    requireAuth,
    validateRequest({ params: placeIdParamSchema, body: createReviewSchema }),
    (req, res, next) => reviewController.createOrUpdateReview(req, res, next)
);

// Public: Place detail by UUID or Slug
router.get(
    '/:idOrSlug',
    validateRequest({ params: placeParamSchema }),
    (req, res, next) => placeController.getDetail(req, res, next)
);

export default router;