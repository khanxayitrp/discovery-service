import { Column, Entity, Index, OneToMany } from "typeorm";
import { UserBadges } from "./UserBadges";

@Index("badges_pkey", ["badgeId"], { unique: true })
@Index("badges_code_key", ["code"], { unique: true })
@Entity("badges", { schema: "discovery_db" })
export class Badges {
  @Column("uuid", {
    primary: true,
    name: "badge_id",
    default: () => "gen_random_uuid()",
  })
  badgeId: string;

  @Column("character varying", { name: "code", unique: true, length: 50 })
  code: string;

  @Column("character varying", { name: "name", length: 100 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("text", { name: "icon_url", nullable: true })
  iconUrl: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToMany(() => UserBadges, (userBadges) => userBadges.badge)
  userBadges: UserBadges[];
}
