import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Badges } from "./Badges";

@Index("idx_user_badges_badge", ["badgeId"], {})
@Index("user_badges_pkey", ["badgeId", "userId"], { unique: true })
@Entity("user_badges", { schema: "discovery_db" })
export class UserBadges {
  @Column("uuid", { primary: true, name: "user_id" })
  userId: string;

  @Column("uuid", { primary: true, name: "badge_id" })
  badgeId: string;

  @Column("timestamp with time zone", {
    name: "awarded_at",
    default: () => "now()",
  })
  awardedAt: Date;

  @Column("character varying", {
    name: "reference_type",
    nullable: true,
    length: 50,
  })
  referenceType: string | null;

  @Column("uuid", { name: "reference_id", nullable: true })
  referenceId: string | null;

  @ManyToOne(() => Badges, (badges) => badges.userBadges, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "badge_id", referencedColumnName: "badgeId" }])
  badge: Badges;
}
