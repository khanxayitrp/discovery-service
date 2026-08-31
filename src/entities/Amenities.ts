import { Column, Entity, Index, OneToMany } from "typeorm";
import { PlaceAmenities } from "./PlaceAmenities";

@Index("amenities_pkey", ["amenityId"], { unique: true })
@Index("amenities_code_key", ["code"], { unique: true })
@Entity("amenities", { schema: "discovery_db" })
export class Amenities {
  @Column("uuid", {
    primary: true,
    name: "amenity_id",
    default: () => "gen_random_uuid()",
  })
  amenityId: string;

  @Column("character varying", { name: "code", unique: true, length: 50 })
  code: string;

  @Column("character varying", { name: "name", length: 150 })
  name: string;

  @Column("character varying", { name: "category", nullable: true, length: 50 })
  category: string | null;

  @Column("character varying", { name: "icon", nullable: true, length: 255 })
  icon: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToMany(() => PlaceAmenities, (placeAmenities) => placeAmenities.amenity)
  placeAmenities: PlaceAmenities[];
}
