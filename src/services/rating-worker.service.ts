import { AppDataSource } from '../config/data-source';
import { OutboxEvents } from '../entities/OutboxEvents';
import { Places } from '../entities/Places';
import { redisService } from './redis.service';

export interface ProcessedEventResult {
    eventId: string;
    placeId: string;
    eventType: string;
    ratingAverage: number | null;
    reviewCount: number;
    skipped: boolean;
}

export class RatingWorkerService {
    private isRunning: boolean = false;
    private timer: NodeJS.Timeout | null = null;

    /**
     * Process a batch of pending review outbox events with strict idempotency
     */
    async processPendingEvents(batchSize: number = 20): Promise<ProcessedEventResult[]> {
        const outboxRepo = AppDataSource.getRepository(OutboxEvents);

        // 1. Fetch pending review events in chronological order
        const pendingEvents = await outboxRepo
            .createQueryBuilder('event')
            .where('event.aggregateType = :type', { type: 'REVIEW' })
            .andWhere('event.status = :status', { status: 'PENDING' })
            .orderBy('event.createdAt', 'ASC')
            .take(batchSize)
            .getMany();

        if (pendingEvents.length === 0) {
            return [];
        }

        const results: ProcessedEventResult[] = [];

        for (const event of pendingEvents) {
            const result = await this.processSingleEvent(event);
            if (result) {
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Process a single event idempotently inside a transaction
     */
    async processSingleEvent(event: OutboxEvents): Promise<ProcessedEventResult | null> {
        return await AppDataSource.transaction(async (manager) => {
            // 1. Idempotency Lock: Atomically claim the event from PENDING -> PROCESSING
            const claimResult = await manager
                .createQueryBuilder()
                .update(OutboxEvents)
                .set({ status: 'PROCESSING' })
                .where('eventId = :id AND status = :status', {
                    id: event.eventId,
                    status: 'PENDING',
                })
                .execute();

            if (claimResult.affected === 0) {
                // Another worker or process already claimed/processed this event - skip to prevent race condition
                return {
                    eventId: event.eventId,
                    placeId: (event.payload as any)?.place_id,
                    eventType: event.eventType,
                    ratingAverage: null,
                    reviewCount: 0,
                    skipped: true,
                };
            }

            const payload = event.payload as any;
            const placeId = payload.place_id;

            try {
                // 2. Perform accurate aggregation from source-of-truth published reviews
                const raw = await manager.query(
                    `SELECT 
                        ROUND(AVG(rating)::numeric, 2) AS rating_avg,
                        COUNT(review_id)::int AS total_reviews
                     FROM discovery_db.reviews
                     WHERE place_id = $1 AND status = 'PUBLISHED' AND deleted_at IS NULL`,
                    [placeId]
                );

                const totalReviews = parseInt(raw[0]?.total_reviews || '0', 10);
                const ratingAvg = totalReviews > 0 && raw[0]?.rating_avg ? parseFloat(raw[0].rating_avg) : null;

                // 3. Update places entity
                const place = await manager.findOne(Places, { where: { placeId } });
                if (place) {
                    place.ratingAverage = ratingAvg !== null ? ratingAvg.toFixed(2) : null;
                    place.ratingCount = totalReviews;
                    place.reviewCount = totalReviews;
                    place.updatedAt = new Date();
                    await manager.save(place);

                    // 4. Invalidate Redis Cache
                    await redisService.del(`place:detail:${place.placeId}`);
                    if (place.slug) {
                        await redisService.del(`place:detail:${place.slug}`);
                    }
                    await redisService.delByPattern('places:nearby:*');
                }

                // 5. Mark event as PROCESSED
                await manager.update(OutboxEvents, { eventId: event.eventId }, {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                    lastError: null,
                });

                console.log(
                    `⭐ [RatingWorker] Re-aggregated place ${placeId} -> rating_avg: ${ratingAvg}, review_count: ${totalReviews}`
                );

                return {
                    eventId: event.eventId,
                    placeId,
                    eventType: event.eventType,
                    ratingAverage: ratingAvg,
                    reviewCount: totalReviews,
                    skipped: false,
                };
            } catch (err: any) {
                console.error(`❌ [RatingWorker] Failed processing event ${event.eventId}:`, err);

                // Mark event as FAILED with retry count
                await manager.update(OutboxEvents, { eventId: event.eventId }, {
                    status: 'FAILED',
                    lastError: err.message || 'Unknown processing error',
                    retryCount: event.retryCount + 1,
                    nextRetryAt: new Date(Date.now() + 60000), // retry in 1 min
                });

                throw err;
            }
        });
    }

    /**
     * Start worker background interval loop
     */
    startWorker(intervalMs: number = 5000) {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`⚙️ [RatingWorker] Background worker started (polling every ${intervalMs}ms)`);

        this.timer = setInterval(async () => {
            try {
                await this.processPendingEvents(20);
            } catch (err) {
                console.error('RatingWorker polling error:', err);
            }
        }, intervalMs);
    }

    /**
     * Stop worker background interval loop
     */
    stopWorker() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        console.log('🛑 [RatingWorker] Background worker stopped');
    }
}

export const ratingWorkerService = new RatingWorkerService();
