import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Reviews } from "./Reviews";

@Index("review_likes_pkey", ["reviewId", "userId"], { unique: true })
@Entity("review_likes", { schema: "discovery_db" })
export class ReviewLikes {
  @Column("uuid", { primary: true, name: "review_id" })
  reviewId: string;

  @Column("uuid", { primary: true, name: "user_id" })
  userId: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => Reviews, (reviews) => reviews.reviewLikes, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "review_id", referencedColumnName: "reviewId" }])
  review: Reviews;
}
