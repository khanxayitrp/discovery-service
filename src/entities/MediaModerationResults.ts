import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { MediaAssets } from "./MediaAssets";

@Index("idx_media_moderation_asset", ["createdAt", "mediaAssetId"], {})
@Index("media_moderation_results_pkey", ["moderationId"], { unique: true })
@Index("idx_media_moderation_provider", ["provider"], {})
@Entity("media_moderation_results", { schema: "discovery_db" })
export class MediaModerationResults {
  @Column("uuid", {
    primary: true,
    name: "moderation_id",
    default: () => "gen_random_uuid()",
  })
  moderationId: string;

  @Column("uuid", { name: "media_asset_id" })
  mediaAssetId: string;

  @Column("character varying", { name: "provider", length: 100 })
  provider: string;

  @Column("character varying", { name: "result", length: 30 })
  result: string;

  @Column("numeric", {
    name: "confidence",
    nullable: true,
    precision: 6,
    scale: 5,
  })
  confidence: string | null;

  @Column("character varying", {
    name: "reason_code",
    nullable: true,
    length: 100,
  })
  reasonCode: string | null;

  @Column("jsonb", { name: "details", nullable: true })
  details: object | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(
    () => MediaAssets,
    (mediaAssets) => mediaAssets.mediaModerationResults,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "media_asset_id", referencedColumnName: "mediaAssetId" },
  ])
  mediaAsset: MediaAssets;
}
