import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("check_ins_pkey", ["checkInId"], { unique: true })
@Index("idx_check_ins_place", ["checkedInAt", "placeId"], {})
@Index("idx_check_ins_user", ["checkedInAt", "userId"], {})
@Entity("check_ins", { schema: "discovery_db" })
export class CheckIns {
  @Column("uuid", {
    primary: true,
    name: "check_in_id",
    default: () => "gen_random_uuid()",
  })
  checkInId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

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

  @Column("double precision", {
    name: "accuracy_meters",
    nullable: true,
    precision: 53,
  })
  accuracyMeters: number | null;

  @Column("character varying", {
    name: "source",
    length: 30,
    default: () => "'GPS'",
  })
  source: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'VALID'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "checked_in_at",
    default: () => "now()",
  })
  checkedInAt: Date;

  @ManyToOne(() => Places, (places) => places.checkIns, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
