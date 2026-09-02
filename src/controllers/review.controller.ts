import { Request, Response } from 'express';

export class ReviewController {
    async getPlaceReviews(req: Request, res: Response) {
        // TODO: Implement GET from Redis Cache[cite: 1]
        res.status(200).json({ message: 'Get reviews for a place' });
    }

    async createReview(req: Request, res: Response) {
        // TODO: Insert review and execute Cache Invalidation[cite: 1]
        res.status(201).json({ message: 'Review created' });
    }
}
export const reviewController = new ReviewController();