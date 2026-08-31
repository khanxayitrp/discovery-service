import { Column, Entity, Index } from "typeorm";

@Index("community_quality_rules_pkey", ["qualityRuleId"], { unique: true })
@Index("community_quality_rules_rule_code_key", ["ruleCode"], { unique: true })
@Entity("community_quality_rules", { schema: "discovery_db" })
export class CommunityQualityRules {
  @Column("uuid", {
    primary: true,
    name: "quality_rule_id",
    default: () => "gen_random_uuid()",
  })
  qualityRuleId: string;

  @Column("character varying", { name: "rule_code", unique: true, length: 50 })
  ruleCode: string;

  @Column("character varying", { name: "content_type", length: 30 })
  contentType: string;

  @Column("integer", { name: "min_text_length", nullable: true })
  minTextLength: number | null;

  @Column("integer", { name: "min_media_count", nullable: true })
  minMediaCount: number | null;

  @Column("numeric", {
    name: "min_video_duration_seconds",
    nullable: true,
    precision: 12,
    scale: 3,
  })
  minVideoDurationSeconds: string | null;

  @Column("boolean", { name: "requires_rating", default: () => "false" })
  requiresRating: boolean;

  @Column("jsonb", { name: "extra_conditions", nullable: true })
  extraConditions: object | null;

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
}
