import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Places } from "./Places";
import { PointLedger } from "./PointLedger";

@Index("idx_community_actions_code", ["actionCode", "createdAt"], {})
@Index("community_actions_pkey", ["actionId"], { unique: true })
@Index("idx_community_actions_user", ["createdAt", "userId"], {})
@Index("idx_community_actions_place", ["createdAt", "placeId"], {})
@Entity("community_actions", { schema: "discovery_db" })
export class CommunityActions {
  @Column("uuid", {
    primary: true,
    name: "action_id",
    default: () => "gen_random_uuid()",
  })
  actionId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("character varying", { name: "action_code", length: 50 })
  actionCode: string;

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

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'COMPLETED'",
  })
  status: string;

  @Column("jsonb", { name: "metadata", nullable: true })
  metadata: object | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.communityActions, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;

  @OneToOne(() => PointLedger, (pointLedger) => pointLedger.communityAction)
  pointLedger: PointLedger;
}
