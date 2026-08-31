import { Column, Entity, Index } from "typeorm";

@Index("idx_audit_logs_actor", ["actorUserId", "createdAt"], {})
@Index("audit_logs_pkey", ["auditLogId"], { unique: true })
@Index("idx_audit_logs_correlation", ["correlationId"], {})
@Index("idx_audit_logs_entity", ["createdAt", "entityId", "entityType"], {})
@Entity("audit_logs", { schema: "discovery_db" })
export class AuditLogs {
  @Column("uuid", {
    primary: true,
    name: "audit_log_id",
    default: () => "gen_random_uuid()",
  })
  auditLogId: string;

  @Column("uuid", { name: "actor_user_id", nullable: true })
  actorUserId: string | null;

  @Column("character varying", { name: "action", length: 100 })
  action: string;

  @Column("character varying", { name: "entity_type", length: 100 })
  entityType: string;

  @Column("uuid", { name: "entity_id", nullable: true })
  entityId: string | null;

  @Column("jsonb", { name: "old_data", nullable: true })
  oldData: object | null;

  @Column("jsonb", { name: "new_data", nullable: true })
  newData: object | null;

  @Column("inet", { name: "ip_address", nullable: true })
  ipAddress: string | null;

  @Column("text", { name: "user_agent", nullable: true })
  userAgent: string | null;

  @Column("uuid", { name: "correlation_id", nullable: true })
  correlationId: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;
}
