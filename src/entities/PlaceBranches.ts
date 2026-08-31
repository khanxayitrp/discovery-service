import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Places } from "./Places";

@Index("place_branches_pkey", ["branchId"], { unique: true })
@Index("idx_place_branches_branch", ["branchPlaceId"], {})
@Index("uq_place_branch", ["branchPlaceId", "parentPlaceId"], { unique: true })
@Index("idx_place_branches_parent", ["parentPlaceId"], {})
@Entity("place_branches", { schema: "discovery_db" })
export class PlaceBranches {
  @Column("uuid", {
    primary: true,
    name: "branch_id",
    default: () => "gen_random_uuid()",
  })
  branchId: string;

  @Column("uuid", { name: "parent_place_id", unique: true })
  parentPlaceId: string;

  @Column("uuid", { name: "branch_place_id", unique: true })
  branchPlaceId: string;

  @Column("character varying", {
    name: "branch_code",
    nullable: true,
    length: 80,
  })
  branchCode: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.placeBranches, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "branch_place_id", referencedColumnName: "placeId" }])
  branchPlace: Places;

  @ManyToOne(() => Places, (places) => places.placeBranches2, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "parent_place_id", referencedColumnName: "placeId" }])
  parentPlace: Places;
}
