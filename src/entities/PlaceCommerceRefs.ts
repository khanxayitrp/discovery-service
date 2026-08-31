import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index(
  "idx_place_commerce_refs_entity",
  ["commerceEntityId", "commerceEntityType"],
  {}
)
@Index("uq_place_commerce_entity", ["commerceEntityId", "commerceEntityType"], {
  unique: true,
})
@Index("place_commerce_refs_pkey", ["placeCommerceRefId"], { unique: true })
@Index("idx_place_commerce_refs_place", ["placeId", "status"], {})
@Entity("place_commerce_refs", { schema: "discovery_db" })
export class PlaceCommerceRefs {
  @Column("uuid", {
    primary: true,
    name: "place_commerce_ref_id",
    default: () => "gen_random_uuid()",
  })
  placeCommerceRefId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("uuid", { name: "commerce_entity_id", unique: true })
  commerceEntityId: string;

  @Column("character varying", {
    name: "commerce_entity_type",
    unique: true,
    length: 50,
  })
  commerceEntityType: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "linked_at",
    default: () => "now()",
  })
  linkedAt: Date;

  @Column("timestamp with time zone", { name: "unlinked_at", nullable: true })
  unlinkedAt: Date | null;

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

  @ManyToOne(() => Places, (places) => places.placeCommerceRefs, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
