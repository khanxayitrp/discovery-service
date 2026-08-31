import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Roles } from "./Roles";

@Index("idx_user_roles_role", ["roleId"], {})
@Index("uq_user_role", ["roleId", "userId"], { unique: true })
@Index("idx_user_roles_user", ["status", "userId"], {})
@Index("user_roles_pkey", ["userRoleId"], { unique: true })
@Entity("user_roles", { schema: "discovery_db" })
export class UserRoles {
  @Column("uuid", {
    primary: true,
    name: "user_role_id",
    default: () => "gen_random_uuid()",
  })
  userRoleId: string;

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

  @ManyToOne(() => Roles, (roles) => roles.userRoles, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "role_id", referencedColumnName: "roleId" }])
  role: Roles;
}
