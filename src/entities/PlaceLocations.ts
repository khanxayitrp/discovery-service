import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_place_locations_geo", ["geoPoint"], {})
@Index("place_locations_pkey", ["locationId"], { unique: true })
@Index("uq_place_locations_primary", ["placeId"], { unique: true })
@Index("idx_place_locations_place", ["placeId"], {})
@Entity("place_locations", { schema: "discovery_db" })
export class PlaceLocations {
  @Column("uuid", {
    primary: true,
    name: "location_id",
    default: () => "gen_random_uuid()",
  })
  locationId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("character varying", {
    name: "location_type",
    length: 30,
    default: () => "'PRIMARY'",
  })
  locationType: string;

  @Column("double precision", { name: "latitude", precision: 53 })
  latitude: number;

  @Column("double precision", { name: "longitude", precision: 53 })
  longitude: number;

  @Column("geography", { name: "geo_point" })
  geoPoint: string;

  @Column("double precision", {
    name: "accuracy_meters",
    nullable: true,
    precision: 53,
  })
  accuracyMeters: number | null;

  @Column("character varying", {
    name: "source",
    length: 30,
    default: () => "'USER'",
  })
  source: string;

  @Column("character varying", {
    name: "verification_status",
    length: 30,
    default: () => "'UNVERIFIED'",
  })
  verificationStatus: string;

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

  @OneToOne(() => Places, (places) => places.placeLocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
