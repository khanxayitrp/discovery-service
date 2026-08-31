import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("idx_place_aliases_alias", ["alias"], {})
@Index("place_aliases_pkey", ["aliasId"], { unique: true })
@Index("idx_place_aliases_language", ["languageCode"], {})
@Index("idx_place_aliases_place", ["placeId"], {})
@Entity("place_aliases", { schema: "discovery_db" })
export class PlaceAliases {
  @Column("uuid", {
    primary: true,
    name: "alias_id",
    default: () => "gen_random_uuid()",
  })
  aliasId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("character varying", { name: "alias", length: 255 })
  alias: string;

  @Column("character varying", {
    name: "language_code",
    nullable: true,
    length: 10,
  })
  languageCode: string | null;

  @Column("character varying", {
    name: "alias_type",
    length: 30,
    default: () => "'ALIAS'",
  })
  aliasType: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.placeAliases, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
