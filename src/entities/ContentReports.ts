import { Column, Entity, Index } from "typeorm";

@Index("idx_content_reports_reporter", ["createdAt", "reporterUserId"], {})
@Index("idx_content_reports_status", ["createdAt", "status"], {})
@Index("content_reports_pkey", ["reportId"], { unique: true })
@Index("idx_content_reports_target", ["targetId", "targetType"], {})
@Entity("content_reports", { schema: "discovery_db" })
export class ContentReports {
  @Column("uuid", {
    primary: true,
    name: "report_id",
    default: () => "gen_random_uuid()",
  })
  reportId: string;

  @Column("uuid", { name: "reporter_user_id" })
  reporterUserId: string;

  @Column("character varying", { name: "target_type", length: 50 })
  targetType: string;

  @Column("uuid", { name: "target_id" })
  targetId: string;

  @Column("character varying", { name: "reason_code", length: 50 })
  reasonCode: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

  @Column("uuid", { name: "reviewed_by", nullable: true })
  reviewedBy: string | null;

  @Column("timestamp with time zone", { name: "reviewed_at", nullable: true })
  reviewedAt: Date | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;
}
