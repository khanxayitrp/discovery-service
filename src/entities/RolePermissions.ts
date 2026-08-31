import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Permissions } from "./Permissions";
import { Roles } from "./Roles";

@Index("role_permissions_pkey", ["permissionId", "roleId"], { unique: true })
@Entity("role_permissions", { schema: "discovery_db" })
export class RolePermissions {
  @Column("uuid", { primary: true, name: "role_id" })
  roleId: string;

  @Column("uuid", { primary: true, name: "permission_id" })
  permissionId: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Permissions, (permissions) => permissions.rolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "permission_id", referencedColumnName: "permissionId" }])
  permission: Permissions;

  @ManyToOne(() => Roles, (roles) => roles.rolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "role_id", referencedColumnName: "roleId" }])
  role: Roles;
}
