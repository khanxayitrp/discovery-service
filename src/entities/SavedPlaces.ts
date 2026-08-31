import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_saved_places_place", ["placeId"], {})
@Index("saved_places_pkey", ["placeId", "userId"], { unique: true })
@Entity("saved_places", { schema: "discovery_db" })
export class SavedPlaces {
  @Column("uuid", { primary: true, name: "user_id" })
  userId: string;

  @Column("uuid", { primary: true, name: "place_id" })
  placeId: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.savedPlaces, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
