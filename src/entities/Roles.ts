import { Column, Entity, Index, OneToMany } from "typeorm";
import { PartnerUserRoles } from "./PartnerUserRoles";
import { PlaceUserRoles } from "./PlaceUserRoles";
import { RolePermissions } from "./RolePermissions";
import { UserRoles } from "./UserRoles";

@Index("roles_code_key", ["code"], { unique: true })
@Index("roles_pkey", ["roleId"], { unique: true })
@Entity("roles", { schema: "discovery_db" })
export class Roles {
  @Column("uuid", {
    primary: true,
    name: "role_id",
    default: () => "gen_random_uuid()",
  })
  roleId: string;

  @Column("character varying", { name: "code", unique: true, length: 50 })
  code: string;

  @Column("character varying", { name: "name", length: 100 })
  name: string;

  @Column("character varying", { name: "scope_type", length: 30 })
  scopeType: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToMany(
    () => PartnerUserRoles,
    (partnerUserRoles) => partnerUserRoles.role
  )
  partnerUserRoles: PartnerUserRoles[];

  @OneToMany(() => PlaceUserRoles, (placeUserRoles) => placeUserRoles.role)
  placeUserRoles: PlaceUserRoles[];

  @OneToMany(() => RolePermissions, (rolePermissions) => rolePermissions.role)
  rolePermissions: RolePermissions[];

  @OneToMany(() => UserRoles, (userRoles) => userRoles.role)
  userRoles: UserRoles[];
}
