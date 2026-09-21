# T02: Public Review & Media Consumption API

**What to build:**  
Any guest or authenticated user can view a paginated list of published reviews for a place, including reviewer details, numerical rating, review text, and attached media galleries. Users can also view the full media gallery of any place. All read traffic is cached in Redis for high-performance retrieval.

**Blocked by:** None (independent, can start immediately)

**Status:** done

## Definition of Done (DoD Pipeline)
`DTO → Validation → Database Query → Service → Controller → Route → Redis Cache → Integration Test`

## Acceptance Criteria
- [x] Public endpoint `GET /api/v1/discovery/places/:id/reviews` returns published reviews only (`status = 'PUBLISHED'`), omitting soft-deleted or pending reviews.
- [x] Supports query parameters: `page`, `limit` (max 100, default 20), and `sortBy` ('newest', 'highest_rating', 'lowest_rating').
- [x] Each review item in the response includes rating, title, content, publishedAt, reviewer info (`userId`), and attached `mediaAssets` (CDN URLs, thumbnails, media type).
- [x] Public endpoint `GET /api/v1/discovery/places/:id/media` returns the place's media gallery (photos/videos from reviews and official uploads).
- [x] Read responses are cached in Redis (`place:reviews:<placeId>:*`) with appropriate TTL (e.g. 5-10 minutes).
- [x] Non-existent place IDs return a clean 404 Not Found response.
- [x] Integration tests verify pagination, sorting, cache hit, and response schema.
