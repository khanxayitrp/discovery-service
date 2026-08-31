import { Column, Entity, Index } from "typeorm";

@Index("idx_outbox_aggregate", ["aggregateId", "aggregateType"], {})
@Index("idx_outbox_pending", ["createdAt", "nextRetryAt", "status"], {})
@Index("outbox_events_pkey", ["eventId"], { unique: true })
@Entity("outbox_events", { schema: "discovery_db" })
export class OutboxEvents {
  @Column("uuid", {
    primary: true,
    name: "event_id",
    default: () => "gen_random_uuid()",
  })
  eventId: string;

  @Column("character varying", { name: "aggregate_type", length: 100 })
  aggregateType: string;

  @Column("uuid", { name: "aggregate_id" })
  aggregateId: string;

  @Column("character varying", { name: "event_type", length: 100 })
  eventType: string;

  @Column("jsonb", { name: "payload" })
  payload: object;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'PENDING'",
  })
  status: string;

  @Column("integer", { name: "retry_count", default: () => "0" })
  retryCount: number;

  @Column("timestamp with time zone", { name: "next_retry_at", nullable: true })
  nextRetryAt: Date | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", { name: "processed_at", nullable: true })
  processedAt: Date | null;

  @Column("text", { name: "last_error", nullable: true })
  lastError: string | null;
}
