# T01: Media Upload Pipeline (Presigned URL & Upload Confirmation)

**What to build:**  
An authenticated community member or business user can request a short-lived presigned upload URL to upload photos or videos directly to S3-compatible Object Storage (AWS S3, MinIO, or Cloudflare R2) without transmitting raw binary files through Discovery DB1. Once uploaded, the user confirms the upload to transition the media asset to a processed state with an accessible CDN URL, ready to be linked to reviews or place profiles.

**Blocked by:** None (can start immediately)

**Status:** done

## Definition of Done (DoD Pipeline)
`DTO → Validation → Database → Service → Authorization → Controller → Route → Local Mock Simulator → Integration Test`

## Acceptance Criteria
- [x] Authenticated members can call `POST /api/v1/discovery/media/upload-url` with `fileName`, `fileSizeBytes`, `mimeType`, and `purpose` ('REVIEW' | 'PLACE_COVER' | 'PLACE_GALLERY').
- [x] System generates a unique `objectKey` and returns `mediaAssetId`, presigned PUT URL, and expiry time.
- [x] S3-compatible storage service supports AWS S3, MinIO, and Cloudflare R2, with an automatic Local Mock Simulator fallback when credentials are not configured in `.env`.
- [x] Binary files are never accepted, stored, or processed directly in the Discovery Service database (strictly obeying Core Concept rule #1).
- [x] Record in `media_assets` is created with initial status `processing_status = 'UPLOAD_PENDING'` and `moderation_status = 'PENDING'`.
- [x] Authenticated members can confirm the upload via `POST /api/v1/discovery/media/:id/confirm`.
- [x] Confirmation validates that the asset belongs to the user, updates `processing_status = 'PROCESSED'`, sets `cdn_url`, and marks it ready for attachment.
- [x] E2E/Integration test validates the full request-upload-confirm flow.
