import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_place_location_history_place", ["createdAt", "placeId"], {})
@Index("place_location_history_pkey", ["locationHistoryId"], { unique: true })
@Entity("place_location_history", { schema: "discovery_db" })
export class PlaceLocationHistory {
  @Column("uuid", {
    primary: true,
    name: "location_history_id",
    default: () => "gen_random_uuid()",
  })
  locationHistoryId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("double precision", {
    name: "old_latitude",
    nullable: true,
    precision: 53,
  })
  oldLatitude: number | null;

  @Column("double precision", {
    name: "old_longitude",
    nullable: true,
    precision: 53,
  })
  oldLongitude: number | null;

  @Column("double precision", { name: "new_latitude", precision: 53 })
  newLatitude: number;

  @Column("double precision", { name: "new_longitude", precision: 53 })
  newLongitude: number;

  @Column("uuid", { name: "changed_by", nullable: true })
  changedBy: string | null;

  @Column("character varying", {
    name: "change_source",
    length: 30,
    default: () => "'SYSTEM'",
  })
  changeSource: string;

  @Column("text", { name: "reason", nullable: true })
  reason: string | null;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'APPLIED'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.placeLocationHistories, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
