import { Column, Entity, Index, OneToMany } from "typeorm";
import { Places } from "./Places";

@Index("place_types_code_key", ["code"], { unique: true })
@Index("place_types_pkey", ["placeTypeId"], { unique: true })
@Entity("place_types", { schema: "discovery_db" })
export class PlaceTypes {
  @Column("uuid", {
    primary: true,
    name: "place_type_id",
    default: () => "gen_random_uuid()",
  })
  placeTypeId: string;

  @Column("character varying", { name: "code", unique: true, length: 50 })
  code: string;

  @Column("character varying", { name: "name", length: 120 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

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

  @OneToMany(() => Places, (places) => places.placeType)
  places: Places[];
}
