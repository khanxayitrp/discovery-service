import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Partners } from "./Partners";
import { Places } from "./Places";

@Index("uq_partner_places_primary", ["partnerId"], { unique: true })
@Index("idx_partner_places_partner", ["partnerId", "status"], {})
@Index(
  "uq_partner_place_relationship",
  ["partnerId", "placeId", "relationshipType"],
  { unique: true }
)
@Index("partner_places_pkey", ["partnerPlaceId"], { unique: true })
@Index("idx_partner_places_place", ["placeId", "status"], {})
@Entity("partner_places", { schema: "discovery_db" })
export class PartnerPlaces {
  @Column("uuid", {
    primary: true,
    name: "partner_place_id",
    default: () => "gen_random_uuid()",
  })
  partnerPlaceId: string;

  @Column("uuid", { name: "partner_id", unique: true })
  partnerId: string;

  @Column("uuid", { name: "place_id", unique: true })
  placeId: string;

  @Column("character varying", {
    name: "relationship_type",
    unique: true,
    length: 30,
    default: () => "'OWNER'",
  })
  relationshipType: string;

  @Column("boolean", { name: "is_primary", default: () => "false" })
  isPrimary: boolean;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "started_at",
    default: () => "now()",
  })
  startedAt: Date;

  @Column("timestamp with time zone", { name: "ended_at", nullable: true })
  endedAt: Date | null;

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

  @OneToOne(() => Partners, (partners) => partners.partnerPlaces, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "partner_id", referencedColumnName: "partnerId" }])
  partner: Partners;

  @ManyToOne(() => Places, (places) => places.partnerPlaces, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
