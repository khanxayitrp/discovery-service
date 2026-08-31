import { Column, Entity, Index, OneToMany, OneToOne } from "typeorm";
import { CommunityUsers } from "./CommunityUsers";
import { MediaModerationResults } from "./MediaModerationResults";
import { PlaceMedia } from "./PlaceMedia";
import { ReviewMedia } from "./ReviewMedia";

@Index("idx_media_assets_created_by", ["createdBy"], {})
@Index("media_assets_pkey", ["mediaAssetId"], { unique: true })
@Index("idx_media_assets_moderation", ["moderationStatus"], {})
@Index("media_assets_object_key_key", ["objectKey"], { unique: true })
@Index("idx_media_assets_processing", ["processingStatus"], {})
@Entity("media_assets", { schema: "discovery_db" })
export class MediaAssets {
  @Column("uuid", {
    primary: true,
    name: "media_asset_id",
    default: () => "gen_random_uuid()",
  })
  mediaAssetId: string;

  @Column("character varying", { name: "media_type", length: 30 })
  mediaType: string;

  @Column("character varying", { name: "storage_provider", length: 50 })
  storageProvider: string;

  @Column("text", { name: "object_key", unique: true })
  objectKey: string;

  @Column("text", { name: "cdn_url", nullable: true })
  cdnUrl: string | null;

  @Column("text", { name: "thumbnail_object_key", nullable: true })
  thumbnailObjectKey: string | null;

  @Column("character varying", { name: "mime_type", length: 100 })
  mimeType: string;

  @Column("character varying", {
    name: "original_filename",
    nullable: true,
    length: 255,
  })
  originalFilename: string | null;

  @Column("bigint", { name: "file_size_bytes", nullable: true })
  fileSizeBytes: string | null;

  @Column("integer", { name: "width", nullable: true })
  width: number | null;

  @Column("integer", { name: "height", nullable: true })
  height: number | null;

  @Column("numeric", {
    name: "duration_seconds",
    nullable: true,
    precision: 12,
    scale: 3,
  })
  durationSeconds: string | null;

  @Column("character", { name: "checksum_sha256", nullable: true, length: 64 })
  checksumSha256: string | null;

  @Column("character varying", {
    name: "processing_status",
    length: 30,
    default: () => "'UPLOADING'",
  })
  processingStatus: string;

  @Column("character varying", {
    name: "moderation_status",
    length: 30,
    default: () => "'PENDING'",
  })
  moderationStatus: string;

  @Column("uuid", { name: "created_by", nullable: true })
  createdBy: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", {
    name: "updated_at",
    default: () => "now()",
  })
  updatedAt: Date;

  @OneToMany(
    () => CommunityUsers,
    (communityUsers) => communityUsers.avatarMediaAsset
  )
  communityUsers: CommunityUsers[];

  @OneToMany(
    () => MediaModerationResults,
    (mediaModerationResults) => mediaModerationResults.mediaAsset
  )
  mediaModerationResults: MediaModerationResults[];

  @OneToOne(() => PlaceMedia, (placeMedia) => placeMedia.mediaAsset)
  placeMedia: PlaceMedia;

  @OneToOne(() => ReviewMedia, (reviewMedia) => reviewMedia.mediaAsset)
  reviewMedia: ReviewMedia;
}
