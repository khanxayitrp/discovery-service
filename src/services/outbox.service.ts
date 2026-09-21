import { EntityManager } from 'typeorm';
import { OutboxEvents } from '../entities/OutboxEvents';

export interface CreateOutboxEventParams {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: object;
}

export class OutboxService {
    /**
     * Records an event in the outbox_events table within the provided transaction/manager.
     * This guarantees that data mutations and event logs are committed atomically.
     */
    async recordEvent(
        manager: EntityManager,
        params: CreateOutboxEventParams
    ): Promise<OutboxEvents> {
        const outboxRepo = manager.getRepository(OutboxEvents);
        const outboxEvent = outboxRepo.create({
            aggregateType: params.aggregateType,
            aggregateId: params.aggregateId,
            eventType: params.eventType,
            payload: params.payload,
            status: 'PENDING',
            retryCount: 0,
        });

        const saved = await outboxRepo.save(outboxEvent);
        console.log(`📨 [Outbox] Recorded event ${params.eventType} for ${params.aggregateType}:${params.aggregateId}`);
        return saved;
    }
}

export const outboxService = new OutboxService();
