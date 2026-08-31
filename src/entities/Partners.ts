import { Column, Entity, Index, OneToMany, OneToOne } from "typeorm";
import { PartnerPlaces } from "./PartnerPlaces";
import { PartnerUsers } from "./PartnerUsers";
import { PlaceClaims } from "./PlaceClaims";

@Index("partners_pkey", ["partnerId"], { unique: true })
@Index("idx_partners_status", ["status"], {})
@Entity("partners", { schema: "discovery_db" })
export class Partners {
  @Column("uuid", {
    primary: true,
    name: "partner_id",
    default: () => "gen_random_uuid()",
  })
  partnerId: string;

  @Column("character varying", {
    name: "legal_name",
    nullable: true,
    length: 255,
  })
  legalName: string | null;

  @Column("character varying", { name: "display_name", length: 255 })
  displayName: string;

  @Column("character varying", {
    name: "partner_type",
    nullable: true,
    length: 50,
  })
  partnerType: string | null;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

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

  @OneToOne(() => PartnerPlaces, (partnerPlaces) => partnerPlaces.partner)
  partnerPlaces: PartnerPlaces;

  @OneToMany(() => PartnerUsers, (partnerUsers) => partnerUsers.partner)
  partnerUsers: PartnerUsers[];

  @OneToMany(() => PlaceClaims, (placeClaims) => placeClaims.partner)
  placeClaims: PlaceClaims[];
}
