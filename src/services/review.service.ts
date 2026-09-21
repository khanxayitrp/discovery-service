import { IsNull } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { reviewRepository } from '../repositories/review.repo';
import { redisService } from './redis.service';
import { outboxService } from './outbox.service';
import { Places } from '../entities/Places';
import { Reviews } from '../entities/Reviews';
import { ReviewMedia } from '../entities/ReviewMedia';
import { PlaceMembers } from '../entities/PlaceMembers';
import { PartnerPlaces } from '../entities/PartnerPlaces';
import { MediaAssets } from '../entities/MediaAssets';
import {
    GetPlaceReviewsQueryDto,
    CreateReviewDto,
} from '../dto/review.dto';
import { AppError } from '../utils/app-error';

const PROFANITY_LIST = ['spam_test_badword', 'abuse_keyword', 'fraud_fake_review'];

export class ReviewService {
    /**
     * T02: Public get paginated reviews for a place with Redis caching
     */
    async getPlaceReviews(placeId: string, query: GetPlaceReviewsQueryDto) {
        const cacheKey = `place:reviews:${placeId}:${query.sortBy}:${query.page}:${query.limit}`;
        const cached = await redisService.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        // Verify place exists
        const placeRepo = AppDataSource.getRepository(Places);
        const place = await placeRepo.findOne({ where: { placeId } });
        if (!place) {
            throw AppError.notFound(`Place with ID '${placeId}' not found`);
        }

        const result = await reviewRepository.findPublishedReviewsByPlaceId(placeId, query);

        const responsePayload = {
            items: result.items,
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
            },
        };

        // Cache for 5 minutes (300s)
        await redisService.set(cacheKey, JSON.stringify(responsePayload), 300);

        return responsePayload;
    }

    /**
     * T02: Public get media gallery for a place with Redis caching
     */
    async getPlaceMedia(placeId: string, page: number = 1, limit: number = 20) {
        const cacheKey = `place:media:${placeId}:${page}:${limit}`;
        const cached = await redisService.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const placeRepo = AppDataSource.getRepository(Places);
        const place = await placeRepo.findOne({ where: { placeId } });
        if (!place) {
            throw AppError.notFound(`Place with ID '${placeId}' not found`);
        }

        const result = await reviewRepository.findPlaceMedia(placeId, page, limit);

        const responsePayload = {
            items: result.items,
            meta: {
                total: result.total,
                page,
                limit,
            },
        };

        // Cache for 5 minutes
        await redisService.set(cacheKey, JSON.stringify(responsePayload), 300);

        return responsePayload;
    }

    /**
     * T03: Member create or update review with anti-fraud, 1-active-review, and transactional outbox
     */
    async createOrUpdateReview(
        userId: string,
        placeId: string,
        dto: CreateReviewDto,
        partnerId?: string
    ) {
        // 1. Verify place exists and is active
        const placeRepo = AppDataSource.getRepository(Places);
        const place = await placeRepo.findOne({ where: { placeId } });
        if (!place || !place.isActive) {
            throw AppError.notFound(`Active place with ID '${placeId}' not found`);
        }

        // 2. Anti-Fraud Check: Bar store owners/managers from reviewing their own place
        const isMember = await AppDataSource.getRepository(PlaceMembers).findOne({
            where: { placeId, userId, status: 'ACTIVE' },
        });

        if (isMember) {
            throw AppError.forbidden('Forbidden: Store owners and managers are prohibited from reviewing their own place');
        }

        if (partnerId) {
            const isPartnerPlace = await AppDataSource.getRepository(PartnerPlaces).findOne({
                where: { placeId, partnerId, status: 'ACTIVE' },
            });
            if (isPartnerPlace) {
                throw AppError.forbidden('Forbidden: Partner owners are prohibited from reviewing their own affiliated places');
            }
        }

        // 3. Moderation Check: Simple profanity / spam detection
        const textToCheck = `${dto.title || ''} ${dto.content || ''}`.toLowerCase();
        const isFlagged = PROFANITY_LIST.some((word) => textToCheck.includes(word));

        const reviewStatus = isFlagged ? 'PENDING' : 'PUBLISHED';
        const qualityStatus = isFlagged ? 'FLAGGED' : 'PASSED';
        const publishedAt = isFlagged ? null : new Date();

        // 4. Execute Review mutation in transaction
        return await AppDataSource.transaction(async (manager) => {
            const revRepo = manager.getRepository(Reviews);
            const existingReview = await revRepo.findOne({
                where: { userId, placeId, deletedAt: IsNull() },
            });

            let savedReview: Reviews;
            let eventType: string;
            let previousRating: number | null = null;

            if (existingReview) {
                // Upsert: update existing review
                previousRating = Number(existingReview.rating);
                existingReview.rating = dto.rating.toFixed(1);
                existingReview.title = dto.title || null;
                existingReview.content = dto.content || null;
                existingReview.status = reviewStatus;
                existingReview.qualityStatus = qualityStatus;
                if (!existingReview.publishedAt && reviewStatus === 'PUBLISHED') {
                    existingReview.publishedAt = publishedAt;
                }
                existingReview.updatedAt = new Date();

                savedReview = await revRepo.save(existingReview);
                eventType = 'ReviewUpdated';
            } else {
                // Insert new review
                const newReview = revRepo.create({
                    userId,
                    placeId,
                    rating: dto.rating.toFixed(1),
                    title: dto.title || null,
                    content: dto.content || null,
                    status: reviewStatus,
                    qualityStatus,
                    publishedAt,
                    isVerifiedVisit: false,
                });

                savedReview = await revRepo.save(newReview);
                eventType = 'ReviewPublished';
            }

            // 5. Attach Review Media if provided
            if (dto.mediaAssetIds && dto.mediaAssetIds.length > 0) {
                const revMediaRepo = manager.getRepository(ReviewMedia);
                const mediaAssetRepo = manager.getRepository(MediaAssets);

                // Remove existing media links for this review if updating
                if (existingReview) {
                    await revMediaRepo.delete({ reviewId: savedReview.reviewId });
                }

                for (let i = 0; i < dto.mediaAssetIds.length; i++) {
                    const mediaAssetId = dto.mediaAssetIds[i];
                    const asset = await mediaAssetRepo.findOne({ where: { mediaAssetId } });

                    if (asset) {
                        const link = revMediaRepo.create({
                            reviewId: savedReview.reviewId,
                            mediaAssetId,
                            mediaType: asset.mediaType,
                            sortOrder: i,
                            isPrimary: i === 0,
                        });
                        await revMediaRepo.save(link);
                    }
                }
            }

            // 6. Record Outbox Event for Rating Aggregation and Search Sync
            if (reviewStatus === 'PUBLISHED') {
                await outboxService.recordEvent(manager, {
                    aggregateType: 'REVIEW',
                    aggregateId: savedReview.reviewId,
                    eventType,
                    payload: {
                        review_id: savedReview.reviewId,
                        place_id: savedReview.placeId,
                        user_id: savedReview.userId,
                        rating: Number(savedReview.rating),
                        previous_rating: previousRating,
                        status: savedReview.status,
                    },
                });
            }

            // 7. Invalidate Redis Caches
            await this.clearReviewCache(placeId);

            return savedReview;
        });
    }

    /**
     * T03: Soft delete review by author or admin
     */
    async deleteReview(userId: string, reviewId: string, userRoles: string[] = []) {
        return await AppDataSource.transaction(async (manager) => {
            const revRepo = manager.getRepository(Reviews);
            const review = await revRepo.findOne({ where: { reviewId } });

            if (!review) {
                throw AppError.notFound(`Review '${reviewId}' not found`);
            }

            const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SYSTEM');
            if (review.userId !== userId && !isAdmin) {
                throw AppError.forbidden('Forbidden: You can only delete your own reviews');
            }

            const oldRating = Number(review.rating);
            review.deletedAt = new Date();
            review.status = 'HIDDEN';

            const saved = await revRepo.save(review);

            // Record Outbox Event
            await outboxService.recordEvent(manager, {
                aggregateType: 'REVIEW',
                aggregateId: saved.reviewId,
                eventType: 'ReviewDeleted',
                payload: {
                    review_id: saved.reviewId,
                    place_id: saved.placeId,
                    user_id: saved.userId,
                    rating: oldRating,
                    status: 'DELETED',
                },
            });

            await this.clearReviewCache(review.placeId);

            return { message: 'Review deleted successfully', reviewId };
        });
    }

    /**
     * Clear caches associated with place reviews
     */
    async clearReviewCache(placeId: string) {
        await redisService.delByPattern(`place:reviews:${placeId}:*`);
        await redisService.delByPattern(`place:media:${placeId}:*`);
    }
}

export const reviewService = new ReviewService();
