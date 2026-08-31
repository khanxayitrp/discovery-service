import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("uq_place_hours_day", ["dayOfWeek", "placeId"], { unique: true })
@Index("place_hours_pkey", ["placeHourId"], { unique: true })
@Index("idx_place_hours_place", ["placeId"], {})
@Entity("place_hours", { schema: "discovery_db" })
export class PlaceHours {
  @Column("uuid", {
    primary: true,
    name: "place_hour_id",
    default: () => "gen_random_uuid()",
  })
  placeHourId: string;

  @Column("uuid", { name: "place_id", unique: true })
  placeId: string;

  @Column("smallint", { name: "day_of_week", unique: true })
  dayOfWeek: number;

  @Column("time without time zone", { name: "open_time", nullable: true })
  openTime: string | null;

  @Column("time without time zone", { name: "close_time", nullable: true })
  closeTime: string | null;

  @Column("boolean", { name: "is_closed", default: () => "false" })
  isClosed: boolean;

  @Column("boolean", { name: "is_24_hours", default: () => "false" })
  is_24Hours: boolean;

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

  @ManyToOne(() => Places, (places) => places.placeHours, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
