import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { MediaAssets } from "./MediaAssets";
import { Places } from "./Places";

@Index("place_media_media_asset_id_key", ["mediaAssetId"], { unique: true })
@Index("place_media_pkey", ["mediaId"], { unique: true })
@Index("idx_place_media_place", ["placeId", "sortOrder"], {})
@Index("uq_place_media_primary", ["placeId"], { unique: true })
@Entity("place_media", { schema: "discovery_db" })
export class PlaceMedia {
  @Column("uuid", {
    primary: true,
    name: "media_id",
    default: () => "gen_random_uuid()",
  })
  mediaId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("uuid", { name: "media_asset_id", unique: true })
  mediaAssetId: string;

  @Column("text", { name: "caption", nullable: true })
  caption: string | null;

  @Column("integer", { name: "sort_order", default: () => "0" })
  sortOrder: number;

  @Column("boolean", { name: "is_primary", default: () => "false" })
  isPrimary: boolean;

  @Column("uuid", { name: "created_by", nullable: true })
  createdBy: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToOne(() => MediaAssets, (mediaAssets) => mediaAssets.placeMedia, {
    onDelete: "RESTRICT",
  })
  @JoinColumn([
    { name: "media_asset_id", referencedColumnName: "mediaAssetId" },
  ])
  mediaAsset: MediaAssets;

  @OneToOne(() => Places, (places) => places.placeMedia, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
