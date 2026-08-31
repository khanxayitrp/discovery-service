import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { PointRules } from "./PointRules";

@Index("idx_point_subject_limits_rule", ["pointRuleId"], {})
@Index("point_subject_limits_pkey", ["pointSubjectLimitId"], { unique: true })
@Entity("point_subject_limits", { schema: "discovery_db" })
export class PointSubjectLimits {
  @Column("uuid", {
    primary: true,
    name: "point_subject_limit_id",
    default: () => "gen_random_uuid()",
  })
  pointSubjectLimitId: string;

  @Column("uuid", { name: "point_rule_id" })
  pointRuleId: string;

  @Column("character varying", { name: "scope_type", length: 30 })
  scopeType: string;

  @Column("integer", { name: "max_points" })
  maxPoints: number;

  @Column("character varying", { name: "period_type", length: 30 })
  periodType: string;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => PointRules, (pointRules) => pointRules.pointSubjectLimits, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "point_rule_id", referencedColumnName: "pointRuleId" }])
  pointRule: PointRules;
}
