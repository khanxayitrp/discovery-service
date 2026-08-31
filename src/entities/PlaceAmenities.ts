import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Amenities } from "./Amenities";
import { Places } from "./Places";

@Index("idx_place_amenities_amenity", ["amenityId"], {})
@Index("place_amenities_pkey", ["amenityId", "placeId"], { unique: true })
@Entity("place_amenities", { schema: "discovery_db" })
export class PlaceAmenities {
  @Column("uuid", { primary: true, name: "place_id" })
  placeId: string;

  @Column("uuid", { primary: true, name: "amenity_id" })
  amenityId: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Amenities, (amenities) => amenities.placeAmenities, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "amenity_id", referencedColumnName: "amenityId" }])
  amenity: Amenities;

  @ManyToOne(() => Places, (places) => places.placeAmenities, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
