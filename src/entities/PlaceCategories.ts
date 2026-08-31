import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Categories } from "./Categories";
import { Places } from "./Places";

@Index("place_categories_pkey", ["categoryId", "placeId"], { unique: true })
@Index("idx_place_categories_category", ["categoryId"], {})
@Index("uq_place_categories_primary", ["placeId"], { unique: true })
@Entity("place_categories", { schema: "discovery_db" })
export class PlaceCategories {
  @Column("uuid", { primary: true, name: "place_id" })
  placeId: string;

  @Column("uuid", { primary: true, name: "category_id" })
  categoryId: string;

  @Column("boolean", { name: "is_primary", default: () => "false" })
  isPrimary: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Categories, (categories) => categories.placeCategories, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "category_id", referencedColumnName: "categoryId" }])
  category: Categories;

  @OneToOne(() => Places, (places) => places.placeCategories, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
