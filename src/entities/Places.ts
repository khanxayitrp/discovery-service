import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Addresses } from "./Addresses";
import { CheckIns } from "./CheckIns";
import { CommunityActions } from "./CommunityActions";
import { PartnerPlaces } from "./PartnerPlaces";
import { PlaceAliases } from "./PlaceAliases";
import { PlaceAmenities } from "./PlaceAmenities";
import { PlaceAttributes } from "./PlaceAttributes";
import { PlaceBranches } from "./PlaceBranches";
import { PlaceCategories } from "./PlaceCategories";
import { PlaceClaims } from "./PlaceClaims";
import { PlaceCommerceRefs } from "./PlaceCommerceRefs";
import { PlaceContacts } from "./PlaceContacts";
import { PlaceContributions } from "./PlaceContributions";
import { PlaceFollows } from "./PlaceFollows";
import { PlaceHours } from "./PlaceHours";
import { PlaceLocationHistory } from "./PlaceLocationHistory";
import { PlaceLocations } from "./PlaceLocations";
import { PlaceMedia } from "./PlaceMedia";
import { PlaceMembers } from "./PlaceMembers";
import { PlaceSpecialHours } from "./PlaceSpecialHours";
import { PlaceTypes } from "./PlaceTypes";
import { PointLedger } from "./PointLedger";
import { Reviews } from "./Reviews";
import { SavedPlaces } from "./SavedPlaces";

@Index("idx_places_created_at", ["createdAt"], {})
@Index("idx_places_active", ["isActive"], {})
@Index("places_pkey", ["placeId"], { unique: true })
@Index("idx_places_type", ["placeTypeId"], {})
@Index("places_slug_key", ["slug"], { unique: true })
@Index("idx_places_status", ["status"], {})
@Index("idx_places_verification", ["verificationStatus"], {})
@Entity("places", { schema: "discovery_db" })
export class Places {
  @Column("uuid", {
    primary: true,
    name: "place_id",
    default: () => "gen_random_uuid()",
  })
  placeId: string;

  @Column("uuid", { name: "place_type_id" })
  placeTypeId: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @Column("character varying", { name: "slug", unique: true, length: 300 })
  slug: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'ACTIVE'",
  })
  status: string;

  @Column("character varying", {
    name: "verification_status",
    length: 30,
    default: () => "'UNVERIFIED'",
  })
  verificationStatus: string;

  @Column("character varying", {
    name: "source_type",
    length: 30,
    default: () => "'PLATFORM'",
  })
  sourceType: string;

  @Column("numeric", {
    name: "rating_average",
    nullable: true,
    precision: 3,
    scale: 2,
  })
  ratingAverage: string | null;

  @Column("integer", { name: "rating_count", default: () => "0" })
  ratingCount: number;

  @Column("integer", { name: "review_count", default: () => "0" })
  reviewCount: number;

  @Column("integer", { name: "check_in_count", default: () => "0" })
  checkInCount: number;

  @Column("boolean", { name: "is_claimed", default: () => "false" })
  isClaimed: boolean;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("uuid", { name: "created_by", nullable: true })
  createdBy: string | null;

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

  @Column("timestamp with time zone", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => Addresses, (addresses) => addresses.place)
  addresses: Addresses;

  @OneToMany(() => CheckIns, (checkIns) => checkIns.place)
  checkIns: CheckIns[];

  @OneToMany(
    () => CommunityActions,
    (communityActions) => communityActions.place
  )
  communityActions: CommunityActions[];

  @OneToMany(() => PartnerPlaces, (partnerPlaces) => partnerPlaces.place)
  partnerPlaces: PartnerPlaces[];

  @OneToMany(() => PlaceAliases, (placeAliases) => placeAliases.place)
  placeAliases: PlaceAliases[];

  @OneToMany(() => PlaceAmenities, (placeAmenities) => placeAmenities.place)
  placeAmenities: PlaceAmenities[];

  @OneToMany(() => PlaceAttributes, (placeAttributes) => placeAttributes.place)
  placeAttributes: PlaceAttributes[];

  @OneToMany(() => PlaceBranches, (placeBranches) => placeBranches.branchPlace)
  placeBranches: PlaceBranches[];

  @OneToMany(() => PlaceBranches, (placeBranches) => placeBranches.parentPlace)
  placeBranches2: PlaceBranches[];

  @OneToOne(() => PlaceCategories, (placeCategories) => placeCategories.place)
  placeCategories: PlaceCategories;

  @OneToMany(() => PlaceClaims, (placeClaims) => placeClaims.place)
  placeClaims: PlaceClaims[];

  @OneToMany(
    () => PlaceCommerceRefs,
    (placeCommerceRefs) => placeCommerceRefs.place
  )
  placeCommerceRefs: PlaceCommerceRefs[];

  @OneToMany(() => PlaceContacts, (placeContacts) => placeContacts.place)
  placeContacts: PlaceContacts[];

  @OneToMany(
    () => PlaceContributions,
    (placeContributions) => placeContributions.place
  )
  placeContributions: PlaceContributions[];

  @OneToMany(() => PlaceFollows, (placeFollows) => placeFollows.place)
  placeFollows: PlaceFollows[];

  @OneToMany(() => PlaceHours, (placeHours) => placeHours.place)
  placeHours: PlaceHours[];

  @OneToMany(
    () => PlaceLocationHistory,
    (placeLocationHistory) => placeLocationHistory.place
  )
  placeLocationHistories: PlaceLocationHistory[];

  @OneToOne(() => PlaceLocations, (placeLocations) => placeLocations.place)
  placeLocations: PlaceLocations;

  @OneToOne(() => PlaceMedia, (placeMedia) => placeMedia.place)
  placeMedia: PlaceMedia;

  @OneToMany(() => PlaceMembers, (placeMembers) => placeMembers.place)
  placeMembers: PlaceMembers[];

  @OneToMany(
    () => PlaceSpecialHours,
    (placeSpecialHours) => placeSpecialHours.place
  )
  placeSpecialHours: PlaceSpecialHours[];

  @ManyToOne(() => PlaceTypes, (placeTypes) => placeTypes.places)
  @JoinColumn([{ name: "place_type_id", referencedColumnName: "placeTypeId" }])
  placeType: PlaceTypes;

  @OneToMany(() => PointLedger, (pointLedger) => pointLedger.place)
  pointLedgers: PointLedger[];

  @OneToMany(() => Reviews, (reviews) => reviews.place)
  reviews: Reviews[];

  @OneToMany(() => SavedPlaces, (savedPlaces) => savedPlaces.place)
  savedPlaces: SavedPlaces[];
}
