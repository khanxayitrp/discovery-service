import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("place_contributions_pkey", ["contributionId"], { unique: true })
@Index("idx_place_contributions_place", ["createdAt", "placeId"], {})
@Index("idx_place_contributions_user", ["createdAt", "userId"], {})
@Index("idx_place_contributions_status", ["status"], {})
@Entity("place_contributions", { schema: "discovery_db" })
export class PlaceContributions {
  @Column("uuid", {
    primary: true,
    name: "contribution_id",
    default: () => "gen_random_uuid()",
  })
  contributionId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "place_id", nullable: true })
  placeId: string | null;

  @Column("character varying", { name: "contribution_type", length: 50 })
  contributionType: string;

  @Column("character varying", {
    name: "reference_type",
    nullable: true,
    length: 50,
  })
  referenceType: string | null;

  @Column("uuid", { name: "reference_id", nullable: true })
  referenceId: string | null;

  @Column("jsonb", { name: "proposed_value", nullable: true })
  proposedValue: object | null;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "submitted_at",
    default: () => "now()",
  })
  submittedAt: Date;

  @Column("timestamp with time zone", { name: "reviewed_at", nullable: true })
  reviewedAt: Date | null;

  @Column("uuid", { name: "reviewed_by", nullable: true })
  reviewedBy: string | null;

  @Column("text", { name: "rejection_reason", nullable: true })
  rejectionReason: string | null;

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

  @ManyToOne(() => Places, (places) => places.placeContributions, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
