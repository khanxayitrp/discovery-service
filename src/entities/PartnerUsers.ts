import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { PartnerUserRoles } from "./PartnerUserRoles";
import { Partners } from "./Partners";

@Index("uq_partner_user", ["partnerId", "userId"], { unique: true })
@Index("idx_partner_users_partner", ["partnerId", "status"], {})
@Index("partner_users_pkey", ["partnerUserId"], { unique: true })
@Index("idx_partner_users_user", ["status", "userId"], {})
@Entity("partner_users", { schema: "discovery_db" })
export class PartnerUsers {
  @Column("uuid", {
    primary: true,
    name: "partner_user_id",
    default: () => "gen_random_uuid()",
  })
  partnerUserId: string;

  @Column("uuid", { name: "partner_id", unique: true })
  partnerId: string;

  @Column("uuid", { name: "user_id", unique: true })
  userId: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "joined_at",
    default: () => "now()",
  })
  joinedAt: Date;

  @Column("timestamp with time zone", { name: "revoked_at", nullable: true })
  revokedAt: Date | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToMany(
    () => PartnerUserRoles,
    (partnerUserRoles) => partnerUserRoles.partnerUsers
  )
  partnerUserRoles: PartnerUserRoles[];

  @ManyToOne(() => Partners, (partners) => partners.partnerUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "partner_id", referencedColumnName: "partnerId" }])
  partner: Partners;
}
