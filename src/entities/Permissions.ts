import { Column, Entity, Index, OneToMany } from "typeorm";
import { RolePermissions } from "./RolePermissions";

@Index("permissions_code_key", ["code"], { unique: true })
@Index("permissions_pkey", ["permissionId"], { unique: true })
@Entity("permissions", { schema: "discovery_db" })
export class Permissions {
  @Column("uuid", {
    primary: true,
    name: "permission_id",
    default: () => "gen_random_uuid()",
  })
  permissionId: string;

  @Column("character varying", { name: "code", unique: true, length: 100 })
  code: string;

  @Column("character varying", { name: "name", length: 150 })
  name: string;

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
    () => RolePermissions,
    (rolePermissions) => rolePermissions.permission
  )
  rolePermissions: RolePermissions[];
}
