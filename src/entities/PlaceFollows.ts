import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_place_follows_place", ["placeId"], {})
@Index("place_follows_pkey", ["placeId", "userId"], { unique: true })
@Entity("place_follows", { schema: "discovery_db" })
export class PlaceFollows {
  @Column("uuid", { primary: true, name: "user_id" })
  userId: string;

  @Column("uuid", { primary: true, name: "place_id" })
  placeId: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.placeFollows, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
