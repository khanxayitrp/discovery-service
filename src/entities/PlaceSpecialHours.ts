import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_place_special_hours_place", ["businessDate", "placeId"], {})
@Index("uq_special_hours_date", ["businessDate", "placeId"], { unique: true })
@Index("place_special_hours_pkey", ["specialHourId"], { unique: true })
@Entity("place_special_hours", { schema: "discovery_db" })
export class PlaceSpecialHours {
  @Column("uuid", {
    primary: true,
    name: "special_hour_id",
    default: () => "gen_random_uuid()",
  })
  specialHourId: string;

  @Column("uuid", { name: "place_id", unique: true })
  placeId: string;

  @Column("date", { name: "business_date", unique: true })
  businessDate: string;

  @Column("time without time zone", { name: "open_time", nullable: true })
  openTime: string | null;

  @Column("time without time zone", { name: "close_time", nullable: true })
  closeTime: string | null;

  @Column("boolean", { name: "is_closed", default: () => "false" })
  isClosed: boolean;

  @Column("boolean", { name: "is_24_hours", default: () => "false" })
  is_24Hours: boolean;

  @Column("character varying", { name: "reason", nullable: true, length: 255 })
  reason: string | null;

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

  @ManyToOne(() => Places, (places) => places.placeSpecialHours, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
