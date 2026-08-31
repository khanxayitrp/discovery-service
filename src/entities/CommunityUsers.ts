import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { MediaAssets } from "./MediaAssets";

@Index("idx_community_users_league", ["currentLeagueId"], {})
@Index("idx_community_users_status", ["status"], {})
@Index("community_users_pkey", ["userId"], { unique: true })
@Entity("community_users", { schema: "discovery_db" })
export class CommunityUsers {
  @Column("uuid", { primary: true, name: "user_id" })
  userId: string;

  @Column("character varying", {
    name: "display_name",
    nullable: true,
    length: 150,
  })
  displayName: string | null;

  @Column("text", { name: "bio", nullable: true })
  bio: string | null;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("bigint", { name: "current_point_balance", default: () => "0" })
  currentPointBalance: string;

  @Column("bigint", { name: "lifetime_points", default: () => "0" })
  lifetimePoints: string;

  @Column("uuid", { name: "current_league_id", nullable: true })
  currentLeagueId: string | null;

  @Column("timestamp with time zone", {
    name: "joined_at",
    default: () => "now()",
  })
  joinedAt: Date;

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

  @ManyToOne(() => MediaAssets, (mediaAssets) => mediaAssets.communityUsers, {
    onDelete: "SET NULL",
  })
  @JoinColumn([
    { name: "avatar_media_asset_id", referencedColumnName: "mediaAssetId" },
  ])
  avatarMediaAsset: MediaAssets;
}
