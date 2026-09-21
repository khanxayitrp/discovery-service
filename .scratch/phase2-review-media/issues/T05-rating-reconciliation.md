# T05: Periodic Rating Reconciliation Service & CLI

**What to build:**  
A periodic audit and reconciliation service (runnable as a background cron job or triggered via internal CLI/endpoint) that cross-examines the cached aggregates in the `places` table against the source-of-truth `reviews` table. It identifies any data drift (discrepancies between `places.rating_average`/`review_count` and raw published reviews), reconciles the values, records an audit log, and invalidates stale caches.

**Blocked by:** T04 (Idempotent Rating Aggregation Worker)

**Status:** done

## Definition of Done (DoD Pipeline)
`Reconciliation Service → Database Drift Detection → Auto-Repair Aggregation → Audit Log Record → Cache Invalidation → End-to-End Chain Test (T03 → T04 → T05)`

## Acceptance Criteria
- [x] Reconciliation service queries all active places and compares `places.rating_average` and `places.review_count` against:
  ```sql
  SELECT 
    place_id,
    ROUND(AVG(rating)::numeric, 2) AS real_avg,
    COUNT(review_id)::int AS real_count
  FROM discovery_db.reviews
  WHERE status = 'PUBLISHED' AND deleted_at IS NULL
  GROUP BY place_id;
  ```
- [x] For any place where the values differ (drift detected):
  - Updates `places.rating_average` and `places.review_count` to match raw truth.
  - Invalids the Redis cache for `place:detail:<placeId>`.
  - Records a drift event in `discovery_db.audit_logs`.
- [x] For places with zero published reviews, ensures `rating_average = null` and `review_count = 0`.
- [x] Returns a structured reconciliation report: `{ totalScanned, driftCount, repairedPlaces, executionTimeMs }`.
- [x] **Full Chain End-to-End Test (T03 → T04 → T05):**
  - Step 1: Member creates a review (T03).
  - Step 2: Event `ReviewPublished` is emitted to outbox (T03).
  - Step 3: Aggregation worker runs and updates `places.rating_average` (T04).
  - Step 4: Redis cache is invalidated and place detail returns the new rating (T04).
  - Step 5: Reconciliation job runs and reports **0 drift found** (`driftCount: 0`) (T05).
