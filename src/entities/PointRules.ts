import { Column, Entity, Index, OneToMany } from "typeorm";
import { PointLedger } from "./PointLedger";
import { PointSubjectLimits } from "./PointSubjectLimits";

@Index("point_rules_action_code_key", ["actionCode"], { unique: true })
@Index("point_rules_pkey", ["pointRuleId"], { unique: true })
@Entity("point_rules", { schema: "discovery_db" })
export class PointRules {
  @Column("uuid", {
    primary: true,
    name: "point_rule_id",
    default: () => "gen_random_uuid()",
  })
  pointRuleId: string;

  @Column("character varying", {
    name: "action_code",
    unique: true,
    length: 50,
  })
  actionCode: string;

  @Column("character varying", { name: "name", length: 150 })
  name: string;

  @Column("integer", { name: "points" })
  points: number;

  @Column("boolean", { name: "requires_approval", default: () => "false" })
  requiresApproval: boolean;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "valid_from",
    default: () => "now()",
  })
  validFrom: Date;

  @Column("timestamp with time zone", { name: "valid_until", nullable: true })
  validUntil: Date | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", {
    name: "updated_at",
    default: () => "now()",
  })
  updatedAt: Date;

  @OneToMany(() => PointLedger, (pointLedger) => pointLedger.pointRule)
  pointLedgers: PointLedger[];

  @OneToMany(
    () => PointSubjectLimits,
    (pointSubjectLimits) => pointSubjectLimits.pointRule
  )
  pointSubjectLimits: PointSubjectLimits[];
}
