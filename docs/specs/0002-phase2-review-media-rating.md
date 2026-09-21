# Specification: Phase 2 — Review, Media & Rating Aggregation

**Issue/Spec ID:** SPEC-0002  
**Triage Label:** `ready-for-agent`  
**Status:** Draft / Ready for Review  
**Domain:** Review & Rating, Media Assets, Transactional Outbox Worker  
**Related ADR:** [ADR 0002: Architecture for Phase 2](file:///Users/inseemicrofinance02/discovery-service/docs/adr/0002-phase2-review-media-rating-aggregation.md)  
**Related Glossary:** [Discovery Glossary](file:///Users/inseemicrofinance02/discovery-service/docs/glossary.md)

---

## Problem Statement

Users exploring places on the platform have no way to evaluate the quality or authenticity of places without community reviews, ratings, and media. Currently:
1. Community members cannot rate places, share feedback, or upload photos/videos of their visits.
2. The platform lacks a secure, scalable media ingestion pipeline that obeys the golden rule: binary files must never pass through or be stored inside DB1.
3. Rating aggregation (`rating_average` and `review_count`) is not derived from real reviews, leaving places without social proof.
4. Without strict anti-fraud rules, store owners could artificially inflate their own ratings or malicious actors could spam reviews.
5. In a distributed environment, naive aggregate calculations risk race conditions, inconsistent counters, and duplicate event processing.

---

## Solution

Implement an end-to-end UGC Engagement and Review Management subsystem (Phase 2):
1. **Presigned Upload Pipeline:** Enables authenticated users to request short-lived presigned upload URLs and upload photos/videos directly to S3-compatible Object Storage, storing only verified metadata in DB1.
2. **Review Management with Anti-Fraud:** Allows members to submit ratings (1.0 to 5.0) and reviews with optional media attachments, enforcing 1 active review per user per place, while barring store owners/managers from reviewing their own establishments.
3. **Hybrid Moderation Policy:** Automatically publishes clean, verified reviews while staging flagged content into a pending queue for moderation.
4. **Resilient Rating Aggregation (Outbox + Idempotent Worker + Reconciliation):**
   - Atomically records structured domain events (`ReviewPublished`, `ReviewUpdated`, `ReviewDeleted`) in `outbox_events`.
   - Executes an asynchronous idempotent worker that recalculates and updates `places.rating_average`, `places.rating_count`, and `places.review_count`.
   - Provides a periodic reconciliation mechanism to prevent long-term data drift.
5. **Public Consumption APIs:** Exposes cached, paginated endpoints for guests and members to view place reviews, ratings breakdown, and media galleries.

---

## User Stories

1. As a community member, I want to submit a rating between 1 and 5 stars for a place I visited, so that I can share my evaluation with other users.
2. As a community member, I want to write a text review describing my experience, so that other visitors know what to expect.
3. As a community member, I want to upload photos and videos of food, ambiance, or receipts, so that my review is visual and helpful.
4. As a community member, I want to request a secure presigned upload URL, so that my media uploads directly and quickly to cloud storage without burdening the application server.
5. As a community member, I want to confirm my media upload after finishing the file transfer, so that the platform can verify and attach it to my review.
6. As a community member, I want my review to update if I submit a new review for the same place, so that my feedback reflects my most recent experience rather than creating duplicate entries.
7. As a community member, I want to edit or delete my previous review, so that I can maintain control over my posted content.
8. As a guest user, I want to view paginated reviews for any place, sorted by newest or highest rating, so that I can make an informed decision before visiting.
9. As a guest user, I want to see the media gallery attached to a place's reviews, so that I can view authentic photos taken by visitors.
10. As a guest user, I want to see the aggregated rating average and total review count on the place detail page, so that I immediately know the general consensus.
11. As a platform administrator, I want store owners and managers to be prevented from reviewing their own places, so that the rating system remains trustworthy and free of self-promotion fraud.
12. As a platform moderator, I want suspicious or inappropriate reviews to enter a pending queue before publishing, so that malicious content does not appear publicly.
13. As a platform engineer, I want rating calculations to be performed through an idempotent asynchronous worker reading from an outbox table, so that database transactions remain fast and duplicate events cannot corrupt scores.
14. As a platform engineer, I want an automated reconciliation job to periodically re-evaluate place ratings against published reviews, so that derived counters never drift over time.
15. As a frontend client, I want cached place reviews and media endpoints with Redis support, so that response times remain sub-50ms under high read traffic.

---

## Implementation Decisions

### 1. Media Upload Pipeline
- The media upload mechanism uses the **Presigned PUT URL pattern** via an S3-compatible SDK.
- The Discovery Service creates a `media_assets` entry with `processing_status = 'UPLOAD_PENDING'` and `moderation_status = 'PENDING'`, returning a signed URL and `media_asset_id`.
- Clients upload the raw binary directly to Object Storage via HTTP PUT.
- A confirmation endpoint transitions the asset to `PROCESSED`, sets the CDN URL, and marks it ready to be linked to a review.
- A development fallback simulator is provided when S3 credentials are not configured, enabling zero-dependency local testing.

### 2. Review Lifecycle & Anti-Fraud Boundary
- Enforce a strict constraint: **1 active review per user per place**. Submitting a review for a place already reviewed by that user executes an update/upsert semantics.
- Ownership verification: Users holding `STORE_MANAGER` or `PARTNER_OWNER` roles for a given `place_id` are rejected with HTTP 403 when attempting to submit a review for that place.
- Hybrid Moderation Filter:
  - If `is_verified_visit` is true or text passes standard validation, status is set to `PUBLISHED` and `published_at` is stamped.
  - If flagged by anti-spam/keyword rules, status is set to `PENDING`.

### 3. Outbox Event Contract
Every review state transition publishes an atomic domain event within the database transaction:
```json
{
  "event_id": "uuid",
  "aggregate_type": "REVIEW",
  "aggregate_id": "review_uuid",
  "event_type": "ReviewPublished | ReviewUpdated | ReviewDeleted",
  "payload": {
    "review_id": "review_uuid",
    "place_id": "place_uuid",
    "user_id": "user_uuid",
    "rating": 4.5,
    "previous_rating": null,
    "status": "PUBLISHED"
  }
}
```

### 4. Idempotent Rating Worker & Aggregation
- A dedicated asynchronous worker queries pending `outbox_events` matching `Review*` event types.
- Idempotency is guaranteed by updating `status = 'PROCESSING'` using atomic SQL locks, and storing processed states to guarantee that re-delivered events cannot execute double additions.
- The worker executes an aggregate query on `reviews`:
  ```sql
  SELECT 
    ROUND(AVG(rating)::numeric, 2) AS rating_avg,
    COUNT(review_id) AS total_count
  FROM reviews
  WHERE place_id = :placeId AND status = 'PUBLISHED' AND deleted_at IS NULL;
  ```
- Updates `places.rating_average`, `places.rating_count`, `places.review_count`, sets the outbox status to `PROCESSED`, and clears Redis cache for `place:detail:<idOrSlug>`.

### 5. Periodic Reconciliation
- A reconciliation service provides a method to audit and reconcile places where cached aggregates differ from the raw `reviews` table, intended to run on a periodic schedule.

---

## Testing Decisions

### Seam Definition
- **Primary Seam: HTTP API Integration Seam.**
  - Tests will exercise the public and member HTTP endpoints (`/api/v1/discovery/places/:id/reviews`, `/api/v1/discovery/media/*`).
  - No internal service internals or mock repositories will be tested in isolation; all verification tests request/response behavior, database state, outbox events, and cache invalidation as observable external outcomes.

### What Makes a Good Test
1. **Black-box verification:** Test inputs (headers, payloads, parameters) and assert external outputs (HTTP status, JSON body, resulting database rows in `reviews`, `media_assets`, `outbox_events`, `places`).
2. **Anti-fraud enforcement:** Verify that store owners receive 403 Forbidden when reviewing their own store.
3. **Idempotency verification:** Trigger the rating worker twice on the exact same event and assert that `rating_average` and `review_count` remain identical.
4. **Cache invalidation:** Assert that after a review is published, subsequent place detail queries reflect the updated rating rather than stale cache.

---

## Out of Scope

- Gamification point allocation (`point_ledger`, leagues, reward credits) — Scheduled for Phase 6.
- Full Admin Moderation Dashboard UI and manual resolution workflows (`content_reports`, `moderation_actions`) — Scheduled for Phase 5.
- Video transcoding, video streaming HLS pipelines, and multi-resolution image resizing workers (handled via asynchronous media worker in cloud pipeline).
- Full-text review search projections into Elasticsearch — Scheduled when search index consumers are connected.

---

## Further Notes

- In accordance with the project golden rule: **Binary media files must NEVER be stored in DB1**.
- All timestamps must use ISO-8601 UTC format.
- Decimal ratings must be constrained to 1 decimal place precision (e.g. 1.0, 3.5, 5.0) and stored in numeric(2,1).
