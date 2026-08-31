import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Reviews } from "./Reviews";

@Index("review_comments_pkey", ["commentId"], { unique: true })
@Index("idx_review_comments_review", ["createdAt", "reviewId"], {})
@Index("idx_review_comments_parent", ["parentCommentId"], {})
@Entity("review_comments", { schema: "discovery_db" })
export class ReviewComments {
  @Column("uuid", {
    primary: true,
    name: "comment_id",
    default: () => "gen_random_uuid()",
  })
  commentId: string;

  @Column("uuid", { name: "review_id" })
  reviewId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "parent_comment_id", nullable: true })
  parentCommentId: string | null;

  @Column("text", { name: "content" })
  content: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PUBLISHED'",
  })
  status: string;

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

  @ManyToOne(
    () => ReviewComments,
    (reviewComments) => reviewComments.reviewComments,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "parent_comment_id", referencedColumnName: "commentId" },
  ])
  parentComment: ReviewComments;

  @OneToMany(
    () => ReviewComments,
    (reviewComments) => reviewComments.parentComment
  )
  reviewComments: ReviewComments[];

  @ManyToOne(() => Reviews, (reviews) => reviews.reviewComments, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "review_id", referencedColumnName: "reviewId" }])
  review: Reviews;
}
