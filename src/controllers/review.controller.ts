import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import {
    GetPlaceReviewsQueryDto,
    CreateReviewDto,
} from '../dto/review.dto';

export class ReviewController {
    /**
     * T02: GET /places/:placeId/reviews
     * Public get paginated published reviews
     */
    async getPlaceReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const placeId = req.params.placeId as string;
            const query = req.query as unknown as GetPlaceReviewsQueryDto;

            const result = await reviewService.getPlaceReviews(placeId, query);

            return res.status(200).json({
                status: 'success',
                data: result.items,
                meta: result.meta,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * T02: GET /places/:placeId/media
     * Public get paginated media gallery
     */
    async getPlaceMedia(req: Request, res: Response, next: NextFunction) {
        try {
            const placeId = req.params.placeId as string;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await reviewService.getPlaceMedia(placeId, page, limit);

            return res.status(200).json({
                status: 'success',
                data: result.items,
                meta: result.meta,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * T03: POST /places/:placeId/reviews
     * Member submit or update review
     */
    async createOrUpdateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const placeId = req.params.placeId as string;
            const userId = req.user!.id;
            const partnerId = req.user?.partnerId;
            const dto = req.body as CreateReviewDto;

            const review = await reviewService.createOrUpdateReview(
                userId,
                placeId,
                dto,
                partnerId
            );

            return res.status(201).json({
                status: 'success',
                message: 'Review saved successfully',
                data: review,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * T03: DELETE /reviews/:reviewId
     * Member or Admin delete review
     */
    async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = req.params.reviewId as string;
            const userId = req.user!.id;
            const userRoles = req.user?.roles || [];

            const result = await reviewService.deleteReview(userId, reviewId, userRoles);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const reviewController = new ReviewController();