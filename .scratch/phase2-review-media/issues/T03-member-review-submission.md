# T03: Member Review Submission & Anti-Fraud (with Media Attachments)

**What to build:**  
An authenticated community member can write a review and give a numerical rating (1.0 to 5.0 stars) for any active place they visited, optionally attaching confirmed photos/videos. The system enforces strict anti-fraud rules: store owners/managers cannot review their own stores, and each user is limited to 1 active review per place (submitting again updates their previous review). Clean reviews are published immediately under a hybrid moderation model, and state changes atomically emit domain events (`ReviewPublished`, `ReviewUpdated`, `ReviewDeleted`) into `outbox_events` within the database transaction.

**Blocked by:** T01 (Optional: Text-only reviews can be submitted without T01; media attachment requires T01)

**Status:** done

## Definition of Done (DoD Pipeline)
`DTO → Validation → Database → Service → Authorization → Controller → Route → Outbox/Event → Cache → Integration Test`

## Sub-tasks
- [x] **Sub-task 3.1: DTO & Validation Schema**
  - Create Zod schemas: `rating` (number 1.0 to 5.0, precision 0.1), `title` (optional max 255), `content` (optional max 2000 chars), `mediaAssetIds` (optional array of UUIDs max 10).
- [x] **Sub-task 3.2: Anti-Fraud & Conflict-of-Interest Guard**
  - Check whether the authenticated user holds an ownership or managerial role for the target place (`place_members`, `partner_places`, or partner roles). If matched, reject with HTTP 403 Forbidden.
- [x] **Sub-task 3.3: 1 Active Review Policy (Upsert Logic)**
  - Query existing active review by `userId` and `placeId`. If found, execute an UPDATE with new rating/content/media; otherwise execute an INSERT.
- [x] **Sub-task 3.4: Hybrid Moderation & Status Assignment**
  - Check text content against basic profanity/spam rules.
  - If clean or `is_verified_visit = true`: set `status = 'PUBLISHED'` and `published_at = now()`.
  - If flagged: set `status = 'PENDING'` and `quality_status = 'FLAGGED'`.
- [x] **Sub-task 3.5: Media Attachment Linking**
  - Verify that provided `mediaAssetIds` exist, belong to the user, and are `PROCESSED`.
  - Insert records into `review_media` with sequential `sort_order` and primary indicator.
- [x] **Sub-task 3.6: Transactional Outbox Event Emission**
  - In the same DB transaction: emit structured event to `outbox_events`:
    - `ReviewPublished`: for new published reviews
    - `ReviewUpdated`: for edits / re-submissions
    - `ReviewDeleted`: for deleted reviews
  - Event payload format:
    ```json
    {
      "event_id": "uuid",
      "event_type": "ReviewPublished",
      "review_id": "uuid",
      "place_id": "uuid",
      "user_id": "uuid",
      "rating": 4.5,
      "previous_rating": null,
      "status": "PUBLISHED"
    }
    ```
- [x] **Sub-task 3.7: Member Review Deletion**
  - Endpoint `DELETE /api/v1/discovery/reviews/:id` allowing author (or admin) to soft-delete a review, setting `deleted_at` and publishing `ReviewDeleted` outbox event.
- [x] **Sub-task 3.8: Cache Invalidation & Integration Tests**
  - Invalidate `place:reviews:<placeId>:*` and `place:detail:<placeId>`.
  - Automated integration tests cover valid submit, upsert behavior, owner-blocked 403, and outbox event integrity.
