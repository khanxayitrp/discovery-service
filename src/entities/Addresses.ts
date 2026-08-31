import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { Places } from "./Places";

@Index("addresses_pkey", ["addressId"], { unique: true })
@Index("idx_addresses_place", ["placeId"], {})
@Index("uq_addresses_primary", ["placeId"], { unique: true })
@Entity("addresses", { schema: "discovery_db" })
export class Addresses {
  @Column("uuid", {
    primary: true,
    name: "address_id",
    default: () => "gen_random_uuid()",
  })
  addressId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("character", { name: "country_code", nullable: true, length: 2 })
  countryCode: string | null;

  @Column("character varying", {
    name: "province_code",
    nullable: true,
    length: 30,
  })
  provinceCode: string | null;

  @Column("character varying", {
    name: "district_code",
    nullable: true,
    length: 30,
  })
  districtCode: string | null;

  @Column("character varying", {
    name: "village_code",
    nullable: true,
    length: 30,
  })
  villageCode: string | null;

  @Column("character varying", {
    name: "address_line1",
    nullable: true,
    length: 255,
  })
  addressLine1: string | null;

  @Column("character varying", {
    name: "address_line2",
    nullable: true,
    length: 255,
  })
  addressLine2: string | null;

  @Column("character varying", {
    name: "postal_code",
    nullable: true,
    length: 20,
  })
  postalCode: string | null;

  @Column("double precision", {
    name: "latitude",
    nullable: true,
    precision: 53,
  })
  latitude: number | null;

  @Column("double precision", {
    name: "longitude",
    nullable: true,
    precision: 53,
  })
  longitude: number | null;

  @Column("boolean", { name: "is_primary", default: () => "false" })
  isPrimary: boolean;

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

  @OneToOne(() => Places, (places) => places.addresses, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
