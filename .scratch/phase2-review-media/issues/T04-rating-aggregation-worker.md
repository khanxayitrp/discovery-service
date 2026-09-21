# T04: Idempotent Rating Aggregation Worker

**What to build:**  
An asynchronous background worker that polls or consumes review domain events (`ReviewPublished`, `ReviewUpdated`, `ReviewDeleted`) from the `outbox_events` table and recalculates the aggregated rating (`places.rating_average`, `places.rating_count`, `places.review_count`). The worker is strictly idempotent: re-delivering or retrying an event will never cause double additions or corrupted scores. Upon recalculating, it marks the event as `PROCESSED` and invalidates the place detail Redis cache.

**Blocked by:** T03 (Member Review Submission & Anti-Fraud)

**Status:** done

## Definition of Done (DoD Pipeline)
`Outbox Event → Worker Consumer → Idempotency Check → Database Aggregate → Place Entity Update → Outbox Mark Processed → Cache Invalidation → Idempotency Test`

## Acceptance Criteria
- [x] Worker polls or listens for `outbox_events` where `aggregate_type = 'REVIEW'` and `status = 'PENDING'`.
- [x] **Idempotency Guarantee:**
  - Before performing aggregation, worker locks and checks the event state. If already `PROCESSED`, the event is skipped immediately without altering data.
  - State transitions are executed atomically (`PENDING` -> `PROCESSING` -> `PROCESSED`).
- [x] **Rating Aggregation Calculation:**
  - Worker executes an accurate aggregate query for the affected `place_id`:
    ```sql
    SELECT 
      ROUND(AVG(rating)::numeric, 2) AS rating_avg,
      COUNT(review_id)::int AS total_reviews
    FROM discovery_db.reviews
    WHERE place_id = :placeId AND status = 'PUBLISHED' AND deleted_at IS NULL;
    ```
  - Updates `places.rating_average = rating_avg`, `places.rating_count = total_reviews`, and `places.review_count = total_reviews`.
- [x] Sets the outbox event record `status = 'PROCESSED'`, `processed_at = now()`.
- [x] In the event of an unhandled error during aggregation, sets `status = 'FAILED'`, increments `retry_count`, and schedules `next_retry_at`.
- [x] Automatically invalidates the Redis cache for `place:detail:<placeId>` and `place:detail:<slug>`.
- [x] Integration test proves idempotency: executing the worker twice on the exact same event results in identical `rating_average` and `review_count`.
