import { Column, Entity, Index } from "typeorm";

@Index("idx_moderation_actions_active", ["endsAt", "userId"], {})
@Index("moderation_actions_pkey", ["moderationActionId"], { unique: true })
@Index("idx_moderation_actions_user", ["startsAt", "userId"], {})
@Entity("moderation_actions", { schema: "discovery_db" })
export class ModerationActions {
  @Column("uuid", {
    primary: true,
    name: "moderation_action_id",
    default: () => "gen_random_uuid()",
  })
  moderationActionId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("character varying", { name: "action_type", length: 50 })
  actionType: string;

  @Column("text", { name: "reason", nullable: true })
  reason: string | null;

  @Column("timestamp with time zone", { name: "starts_at" })
  startsAt: Date;

  @Column("timestamp with time zone", { name: "ends_at", nullable: true })
  endsAt: Date | null;

  @Column("uuid", { name: "created_by", nullable: true })
  createdBy: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;
}
