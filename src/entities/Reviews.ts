import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm";
import { ReviewComments } from "./ReviewComments";
import { ReviewLikes } from "./ReviewLikes";
import { ReviewMedia } from "./ReviewMedia";
import { Places } from "./Places";

@Index("idx_reviews_place", ["createdAt", "placeId"], {})
@Index("idx_reviews_user", ["createdAt", "userId"], {})
@Index("idx_reviews_quality", ["qualityStatus"], {})
@Index("reviews_pkey", ["reviewId"], { unique: true })
@Index("idx_reviews_status", ["status"], {})
@Entity("reviews", { schema: "discovery_db" })
export class Reviews {
  @Column("uuid", {
    primary: true,
    name: "review_id",
    default: () => "gen_random_uuid()",
  })
  reviewId: string;

  @Column("uuid", { name: "place_id" })
  placeId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("numeric", { name: "rating", precision: 2, scale: 1 })
  rating: string;

  @Column("character varying", { name: "title", nullable: true, length: 255 })
  title: string | null;

  @Column("text", { name: "content", nullable: true })
  content: string | null;

  @Column("character varying", {
    name: "review_type",
    length: 30,
    default: () => "'TEXT'",
  })
  reviewType: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

  @Column("boolean", { name: "is_verified_visit", default: () => "false" })
  isVerifiedVisit: boolean;

  @Column("character varying", {
    name: "quality_status",
    length: 30,
    default: () => "'NOT_EVALUATED'",
  })
  qualityStatus: string;

  @Column("timestamp with time zone", { name: "published_at", nullable: true })
  publishedAt: Date | null;

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

  @OneToMany(() => ReviewComments, (reviewComments) => reviewComments.review)
  reviewComments: ReviewComments[];

  @OneToMany(() => ReviewLikes, (reviewLikes) => reviewLikes.review)
  reviewLikes: ReviewLikes[];

  @OneToOne(() => ReviewMedia, (reviewMedia) => reviewMedia.review)
  reviewMedia: ReviewMedia;

  @ManyToOne(() => Places, (places) => places.reviews, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "place_id", referencedColumnName: "placeId" }])
  place: Places;
}
