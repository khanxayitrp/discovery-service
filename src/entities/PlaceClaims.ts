import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Partners } from "./Partners";
import { Places } from "./Places";

@Index("place_claims_pkey", ["claimId"], { unique: true })
@Index("idx_place_claims_requester", ["createdAt", "requestedBy"], {})
@Index("idx_place_claims_partner", ["partnerId", "status"], {})
@Index("idx_place_claims_place", ["placeId", "status"], {})
@Entity("place_claims", { schema: "discovery_db" })
export class PlaceClaims {
  @Column("uuid", {
    primary: true,
    name: "claim_id",
    default: () => "gen_random_uuid()",
  })
  claimId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("uuid", { name: "partner_id" })
  partnerId: string;

  @Column("uuid", { name: "requested_by" })
  requestedBy: string;

  @Column("character varying", {
    name: "claim_type",
    length: 50,
    default: () => "'OWNER'",
  })
  claimType: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

  @Column("character varying", {
    name: "verification_method",
    nullable: true,
    length: 50,
  })
  verificationMethod: string | null;

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

  @ManyToOne(() => Partners, (partners) => partners.placeClaims, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "partner_id", referencedColumnName: "partnerId" }])
  partner: Partners;

  @ManyToOne(() => Places, (places) => places.placeClaims, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
