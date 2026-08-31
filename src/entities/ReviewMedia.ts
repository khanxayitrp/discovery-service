import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { MediaAssets } from "./MediaAssets";
import { Reviews } from "./Reviews";

@Index("review_media_media_asset_id_key", ["mediaAssetId"], { unique: true })
@Index("idx_review_media_review", ["reviewId", "sortOrder"], {})
@Index("uq_review_media_primary", ["reviewId"], { unique: true })
@Index("review_media_pkey", ["reviewMediaId"], { unique: true })
@Entity("review_media", { schema: "discovery_db" })
export class ReviewMedia {
  @Column("uuid", {
    primary: true,
    name: "review_media_id",
    default: () => "gen_random_uuid()",
  })
  reviewMediaId: string;

  @Column("uuid", { name: "review_id" })
  reviewId: string;

  @Column("uuid", { name: "media_asset_id", unique: true })
  mediaAssetId: string;

  @Column("character varying", { name: "media_type", length: 30 })
  mediaType: string;

  @Column("integer", { name: "sort_order", default: () => "0" })
  sortOrder: number;

  @Column("boolean", { name: "is_primary", default: () => "false" })
  isPrimary: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToOne(() => MediaAssets, (mediaAssets) => mediaAssets.reviewMedia, {
    onDelete: "RESTRICT",
  })
  @JoinColumn([
    { name: "media_asset_id", referencedColumnName: "mediaAssetId" },
  ])
  mediaAsset: MediaAssets;

  @OneToOne(() => Reviews, (reviews) => reviews.reviewMedia, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "review_id", referencedColumnName: "reviewId" }])
  review: Reviews;
}
