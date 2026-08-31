import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Places } from "./Places";
import { PlaceUserRoles } from "./PlaceUserRoles";

@Index("idx_place_members_place", ["placeId", "status"], {})
@Index("uq_place_member", ["placeId", "userId"], { unique: true })
@Index("place_members_pkey", ["placeMemberId"], { unique: true })
@Index("idx_place_members_user", ["status", "userId"], {})
@Entity("place_members", { schema: "discovery_db" })
export class PlaceMembers {
  @Column("uuid", {
    primary: true,
    name: "place_member_id",
    default: () => "gen_random_uuid()",
  })
  placeMemberId: string;

  @Column("uuid", { name: "place_id", unique: true })
  placeId: string;

  @Column("uuid", { name: "user_id", unique: true })
  userId: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("uuid", { name: "granted_by", nullable: true })
  grantedBy: string | null;

  @Column("timestamp with time zone", {
    name: "granted_at",
    default: () => "now()",
  })
  grantedAt: Date;

  @Column("timestamp with time zone", { name: "revoked_at", nullable: true })
  revokedAt: Date | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Places, (places) => places.placeMembers, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;

  @OneToMany(
    () => PlaceUserRoles,
    (placeUserRoles) => placeUserRoles.placeMembers
  )
  placeUserRoles: PlaceUserRoles[];
}
