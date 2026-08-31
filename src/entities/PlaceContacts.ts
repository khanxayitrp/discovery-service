import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("place_contacts_pkey", ["contactId"], { unique: true })
@Index("idx_place_contacts_type", ["contactType"], {})
@Index("idx_place_contacts_place", ["placeId"], {})
@Entity("place_contacts", { schema: "discovery_db" })
export class PlaceContacts {
  @Column("uuid", {
    primary: true,
    name: "contact_id",
    default: () => "gen_random_uuid()",
  })
  contactId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("character varying", { name: "contact_type", length: 30 })
  contactType: string;

  @Column("character varying", { name: "contact_value", length: 255 })
  contactValue: string;

  @Column("boolean", { name: "is_primary", default: () => "false" })
  isPrimary: boolean;

  @Column("boolean", { name: "is_verified", default: () => "false" })
  isVerified: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.placeContacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
