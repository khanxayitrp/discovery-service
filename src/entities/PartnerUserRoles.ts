import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Roles } from "./Roles";
import { PartnerUsers } from "./PartnerUsers";

@Index("uq_partner_user_role", ["partnerId", "roleId", "userId"], {
  unique: true,
})
@Index(
  "idx_partner_user_roles_partner_user",
  ["partnerId", "status", "userId"],
  {}
)
@Index("partner_user_roles_pkey", ["partnerUserRoleId"], { unique: true })
@Index("idx_partner_user_roles_role", ["roleId"], {})
@Entity("partner_user_roles", { schema: "discovery_db" })
export class PartnerUserRoles {
  @Column("uuid", {
    primary: true,
    name: "partner_user_role_id",
    default: () => "gen_random_uuid()",
  })
  partnerUserRoleId: string;

  @Column("uuid", { name: "partner_id", unique: true })
  partnerId: string;

  @Column("uuid", { name: "user_id", unique: true })
  userId: string;

  @Column("uuid", { name: "role_id", unique: true })
  roleId: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "granted_at",
    default: () => "now()",
  })
  grantedAt: Date;

  @Column("timestamp with time zone", { name: "revoked_at", nullable: true })
  revokedAt: Date | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Roles, (roles) => roles.partnerUserRoles, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "role_id", referencedColumnName: "roleId" }])
  role: Roles;

  @ManyToOne(
    () => PartnerUsers,
    (partnerUsers) => partnerUsers.partnerUserRoles,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "partner_id", referencedColumnName: "partnerId" },
    { name: "user_id", referencedColumnName: "userId" },
  ])
  partnerUsers: PartnerUsers;
}
