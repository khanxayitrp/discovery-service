import { AppDataSource } from '../config/data-source';
import { Places } from '../entities/Places';
import { AuditLogs } from '../entities/AuditLogs';
import { redisService } from './redis.service';

export interface ReconciliationReport {
    totalScanned: number;
    driftCount: number;
    repairedPlaces: Array<{
        placeId: string;
        name: string;
        oldRating: string | null;
        newRating: string | null;
        oldReviewCount: number;
        newReviewCount: number;
    }>;
    executionTimeMs: number;
}

export class ReconciliationService {
    /**
     * Audit and reconcile places.rating_average and review_count against raw published reviews
     */
    async reconcileAllPlaces(): Promise<ReconciliationReport> {
        const startTime = Date.now();
        const placeRepo = AppDataSource.getRepository(Places);
        const auditRepo = AppDataSource.getRepository(AuditLogs);

        // 1. Fetch raw truth aggregates for all places with published reviews
        const rawTruths: Array<{ place_id: string; real_avg: string; real_count: string }> =
            await AppDataSource.query(`
                SELECT 
                    place_id,
                    ROUND(AVG(rating)::numeric, 2) AS real_avg,
                    COUNT(review_id)::int AS real_count
                FROM discovery_db.reviews
                WHERE status = 'PUBLISHED' AND deleted_at IS NULL
                GROUP BY place_id
            `);

        const truthMap = new Map<string, { realAvg: string | null; realCount: number }>();
        for (const row of rawTruths) {
            truthMap.set(row.place_id, {
                realAvg: row.real_avg ? Number(row.real_avg).toFixed(2) : null,
                realCount: parseInt(row.real_count, 10),
            });
        }

        // 2. Fetch all active places
        const places = await placeRepo.find({ where: { isActive: true } });
        const repairedPlaces: ReconciliationReport['repairedPlaces'] = [];

        for (const place of places) {
            const truth = truthMap.get(place.placeId) || { realAvg: null, realCount: 0 };
            const currentAvg = place.ratingAverage ? Number(place.ratingAverage).toFixed(2) : null;
            const currentCount = place.reviewCount || 0;

            const isDrift =
                currentAvg !== truth.realAvg ||
                currentCount !== truth.realCount ||
                place.ratingCount !== truth.realCount;

            if (isDrift) {
                // Record repair details
                repairedPlaces.push({
                    placeId: place.placeId,
                    name: place.name,
                    oldRating: currentAvg,
                    newRating: truth.realAvg,
                    oldReviewCount: currentCount,
                    newReviewCount: truth.realCount,
                });

                // Update place
                place.ratingAverage = truth.realAvg;
                place.ratingCount = truth.realCount;
                place.reviewCount = truth.realCount;
                place.updatedAt = new Date();
                await placeRepo.save(place);

                // Record Audit Log
                const auditLog = auditRepo.create({
                    action: 'RATING_RECONCILIATION_DRIFT_REPAIRED',
                    entityType: 'PLACE',
                    entityId: place.placeId,
                    oldData: {
                        ratingAverage: currentAvg,
                        reviewCount: currentCount,
                    },
                    newData: {
                        ratingAverage: truth.realAvg,
                        reviewCount: truth.realCount,
                    },
                });
                await auditRepo.save(auditLog);

                // Invalidate Redis Cache
                await redisService.del(`place:detail:${place.placeId}`);
                if (place.slug) {
                    await redisService.del(`place:detail:${place.slug}`);
                }
            }
        }

        if (repairedPlaces.length > 0) {
            await redisService.delByPattern('places:nearby:*');
            console.log(`🧹 [Reconciliation] Repaired ${repairedPlaces.length} places with data drift`);
        } else {
            console.log('✅ [Reconciliation] Audit complete: 0 drift found. Data is 100% consistent.');
        }

        return {
            totalScanned: places.length,
            driftCount: repairedPlaces.length,
            repairedPlaces,
            executionTimeMs: Date.now() - startTime,
        };
    }
}

export const reconciliationService = new ReconciliationService();
