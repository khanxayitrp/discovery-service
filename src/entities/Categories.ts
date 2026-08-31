import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { PlaceCategories } from "./PlaceCategories";

@Index("categories_pkey", ["categoryId"], { unique: true })
@Index("categories_code_key", ["code"], { unique: true })
@Index("idx_categories_parent", ["parentId"], {})
@Index("categories_slug_key", ["slug"], { unique: true })
@Entity("categories", { schema: "discovery_db" })
export class Categories {
  @Column("uuid", {
    primary: true,
    name: "category_id",
    default: () => "gen_random_uuid()",
  })
  categoryId: string;

  @Column("uuid", { name: "parent_id", nullable: true })
  parentId: string | null;

  @Column("character varying", { name: "code", unique: true, length: 80 })
  code: string;

  @Column("character varying", { name: "name", length: 150 })
  name: string;

  @Column("character varying", { name: "slug", unique: true, length: 180 })
  slug: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("integer", { name: "sort_order", default: () => "0" })
  sortOrder: number;

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

  @ManyToOne(() => Categories, (categories) => categories.categories, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "parent_id", referencedColumnName: "categoryId" }])
  parent: Categories;

  @OneToMany(() => Categories, (categories) => categories.parent)
  categories: Categories[];

  @OneToMany(
    () => PlaceCategories,
    (placeCategories) => placeCategories.category
  )
  placeCategories: PlaceCategories[];
}
