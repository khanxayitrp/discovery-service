import { IsNull } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Reviews } from '../entities/Reviews';
import { ReviewMedia } from '../entities/ReviewMedia';
import { PlaceMedia } from '../entities/PlaceMedia';
import { GetPlaceReviewsQueryDto } from '../dto/review.dto';

export class ReviewRepository {
    private reviewRepo = AppDataSource.getRepository(Reviews);
    private reviewMediaRepo = AppDataSource.getRepository(ReviewMedia);
    private placeMediaRepo = AppDataSource.getRepository(PlaceMedia);

    /**
     * Get paginated published reviews for a place, sorted appropriately
     */
    async findPublishedReviewsByPlaceId(
        placeId: string,
        query: GetPlaceReviewsQueryDto
    ): Promise<{ items: any[]; total: number }> {
        const { page, limit, sortBy } = query;
        const offset = (page - 1) * limit;

        const qb = this.reviewRepo
            .createQueryBuilder('review')
            .where('review.placeId = :placeId', { placeId })
            .andWhere('review.status = :status', { status: 'PUBLISHED' })
            .andWhere('review.deletedAt IS NULL');

        if (sortBy === 'highest_rating') {
            qb.orderBy('review.rating', 'DESC').addOrderBy('review.createdAt', 'DESC');
        } else if (sortBy === 'lowest_rating') {
            qb.orderBy('review.rating', 'ASC').addOrderBy('review.createdAt', 'DESC');
        } else {
            qb.orderBy('review.createdAt', 'DESC');
        }

        qb.skip(offset).take(limit);

        const [reviews, total] = await qb.getManyAndCount();

        // Attach media assets for each review
        if (reviews.length > 0) {
            const reviewIds = reviews.map((r) => r.reviewId);
            const mediaList = await this.reviewMediaRepo
                .createQueryBuilder('rm')
                .innerJoinAndSelect('rm.mediaAsset', 'asset')
                .where('rm.reviewId IN (:...reviewIds)', { reviewIds })
                .orderBy('rm.sortOrder', 'ASC')
                .getMany();

            const mediaByReview = new Map<string, any[]>();
            for (const m of mediaList) {
                const list = mediaByReview.get(m.reviewId) || [];
                list.push({
                    mediaAssetId: m.mediaAsset.mediaAssetId,
                    mediaType: m.mediaAsset.mediaType,
                    cdnUrl: m.mediaAsset.cdnUrl,
                    thumbnailUrl: m.mediaAsset.thumbnailObjectKey,
                    isPrimary: m.isPrimary,
                    sortOrder: m.sortOrder,
                });
                mediaByReview.set(m.reviewId, list);
            }

            const items = reviews.map((r) => ({
                reviewId: r.reviewId,
                placeId: r.placeId,
                userId: r.userId,
                rating: Number(r.rating),
                title: r.title,
                content: r.content,
                status: r.status,
                isVerifiedVisit: r.isVerifiedVisit,
                publishedAt: r.publishedAt,
                createdAt: r.createdAt,
                media: mediaByReview.get(r.reviewId) || [],
            }));

            return { items, total };
        }

        return { items: [], total };
    }

    /**
     * Get paginated media assets associated with a place (from official PlaceMedia and Reviews)
     */
    async findPlaceMedia(
        placeId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ items: any[]; total: number }> {
        const offset = (page - 1) * limit;

        // 1. Fetch from PlaceMedia
        const officialMediaQb = this.placeMediaRepo
            .createQueryBuilder('pm')
            .innerJoinAndSelect('pm.mediaAsset', 'asset')
            .where('pm.placeId = :placeId', { placeId })
            .orderBy('pm.sortOrder', 'ASC')
            .skip(offset)
            .take(limit);

        const [officialMedia, totalOfficial] = await officialMediaQb.getManyAndCount();

        // 2. Fetch from ReviewMedia where reviews are published
        const reviewMediaQb = this.reviewMediaRepo
            .createQueryBuilder('rm')
            .innerJoinAndSelect('rm.mediaAsset', 'asset')
            .innerJoin('rm.review', 'review')
            .where('review.placeId = :placeId', { placeId })
            .andWhere('review.status = :status', { status: 'PUBLISHED' })
            .andWhere('review.deletedAt IS NULL')
            .orderBy('rm.createdAt', 'DESC')
            .skip(offset)
            .take(limit);

        const [reviewMedia, totalReviewMedia] = await reviewMediaQb.getManyAndCount();

        const combined = [
            ...officialMedia.map((m) => ({
                source: 'PLACE',
                mediaAssetId: m.mediaAsset.mediaAssetId,
                mediaType: m.mediaAsset.mediaType,
                cdnUrl: m.mediaAsset.cdnUrl,
                caption: m.caption,
                isPrimary: m.isPrimary,
                createdAt: m.createdAt,
            })),
            ...reviewMedia.map((m) => ({
                source: 'REVIEW',
                mediaAssetId: m.mediaAsset.mediaAssetId,
                mediaType: m.mediaAsset.mediaType,
                cdnUrl: m.mediaAsset.cdnUrl,
                caption: null,
                isPrimary: m.isPrimary,
                createdAt: m.createdAt,
            })),
        ].slice(0, limit);

        return {
            items: combined,
            total: totalOfficial + totalReviewMedia,
        };
    }

    /**
     * Find active review by user for a place (used for 1 active review check in T03)
     */
    async findUserReviewForPlace(userId: string, placeId: string): Promise<Reviews | null> {
        return await this.reviewRepo.findOne({
            where: {
                userId,
                placeId,
                deletedAt: IsNull(),
            },
        });
    }

    /**
     * Calculate AVG(rating) and COUNT(reviewId) of published reviews for a place
     */
    async calculateRatingAggregate(placeId: string): Promise<{ ratingAverage: number | null; reviewCount: number }> {
        const raw = await this.reviewRepo
            .createQueryBuilder('review')
            .select('ROUND(AVG(review.rating)::numeric, 2)', 'avg')
            .addSelect('COUNT(review.reviewId)', 'count')
            .where('review.placeId = :placeId', { placeId })
            .andWhere('review.status = :status', { status: 'PUBLISHED' })
            .andWhere('review.deletedAt IS NULL')
            .getRawOne();

        const count = parseInt(raw?.count || '0', 10);
        const avg = count > 0 && raw?.avg ? parseFloat(raw.avg) : null;

        return { ratingAverage: avg, reviewCount: count };
    }
}

export const reviewRepository = new ReviewRepository();
