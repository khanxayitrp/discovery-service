import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { CommunityActions } from "./CommunityActions";
import { Places } from "./Places";
import { PointRules } from "./PointRules";

@Index("uq_point_ledger_action", ["communityActionId"], { unique: true })
@Index("idx_point_ledger_user", ["createdAt", "userId"], {})
@Index("idx_point_ledger_place", ["createdAt", "placeId"], {})
@Index("point_ledger_pkey", ["pointTransactionId"], { unique: true })
@Index("idx_point_ledger_status", ["status"], {})
@Entity("point_ledger", { schema: "discovery_db" })
export class PointLedger {
  @Column("uuid", {
    primary: true,
    name: "point_transaction_id",
    default: () => "gen_random_uuid()",
  })
  pointTransactionId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "community_action_id", nullable: true })
  communityActionId: string | null;

  @Column("uuid", { name: "place_id", nullable: true })
  placeId: string | null;

  @Column("character varying", {
    name: "reference_type",
    nullable: true,
    length: 50,
  })
  referenceType: string | null;

  @Column("uuid", { name: "reference_id", nullable: true })
  referenceId: string | null;

  @Column("integer", { name: "points" })
  points: number;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", { name: "approved_at", nullable: true })
  approvedAt: Date | null;

  @Column("uuid", { name: "approved_by", nullable: true })
  approvedBy: string | null;

  @OneToOne(
    () => CommunityActions,
    (communityActions) => communityActions.pointLedger,
    { onDelete: "SET NULL" }
  )
  @JoinColumn([
    { name: "community_action_id", referencedColumnName: "actionId" },
  ])
  communityAction: CommunityActions;

  @ManyToOne(() => Places, (places) => places.pointLedgers, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;

  @ManyToOne(() => PointRules, (pointRules) => pointRules.pointLedgers)
  @JoinColumn([{ name: "point_rule_id", referencedColumnName: "pointRuleId" }])
  pointRule: PointRules;
}
