import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Roles } from "./Roles";
import { PlaceMembers } from "./PlaceMembers";

@Index("uq_place_user_role", ["placeId", "roleId", "userId"], { unique: true })
@Index("idx_place_user_roles_place_user", ["placeId", "status", "userId"], {})
@Index("place_user_roles_pkey", ["placeUserRoleId"], { unique: true })
@Index("idx_place_user_roles_role", ["roleId"], {})
@Entity("place_user_roles", { schema: "discovery_db" })
export class PlaceUserRoles {
  @Column("uuid", {
    primary: true,
    name: "place_user_role_id",
    default: () => "gen_random_uuid()",
  })
  placeUserRoleId: string;

  @Column("uuid", { name: "place_id", unique: true })
  placeId: string;

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

  @ManyToOne(() => Roles, (roles) => roles.placeUserRoles, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "role_id", referencedColumnName: "roleId" }])
  role: Roles;

  @ManyToOne(
    () => PlaceMembers,
    (placeMembers) => placeMembers.placeUserRoles,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "place_id", referencedColumnName: "placeId" },
    { name: "user_id", referencedColumnName: "userId" },
  ])
  placeMembers: PlaceMembers;
}
