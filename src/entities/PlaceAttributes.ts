import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_place_attributes_code", ["attributeCode"], {})
@Index("place_attributes_pkey", ["placeAttributeId"], { unique: true })
@Index("idx_place_attributes_place", ["placeId"], {})
@Index("idx_place_attributes_json", ["valueJson"], {})
@Entity("place_attributes", { schema: "discovery_db" })
export class PlaceAttributes {
  @Column("uuid", {
    primary: true,
    name: "place_attribute_id",
    default: () => "gen_random_uuid()",
  })
  placeAttributeId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("character varying", { name: "attribute_code", length: 100 })
  attributeCode: string;

  @Column("text", { name: "value_text", nullable: true })
  valueText: string | null;

  @Column("numeric", { name: "value_number", nullable: true })
  valueNumber: string | null;

  @Column("boolean", { name: "value_boolean", nullable: true })
  valueBoolean: boolean | null;

  @Column("jsonb", { name: "value_json", nullable: true })
  valueJson: object | null;

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

  @ManyToOne(() => Places, (places) => places.placeAttributes, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
