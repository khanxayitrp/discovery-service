import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UserRewards } from "./UserRewards";

@Index("idx_credit_ledger_user", ["createdAt", "userId"], {})
@Index("credit_ledger_pkey", ["creditTransactionId"], { unique: true })
@Index("idx_credit_ledger_reference", ["referenceId", "referenceType"], {})
@Entity("credit_ledger", { schema: "discovery_db" })
export class CreditLedger {
  @Column("uuid", {
    primary: true,
    name: "credit_transaction_id",
    default: () => "gen_random_uuid()",
  })
  creditTransactionId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("character varying", {
    name: "reference_type",
    nullable: true,
    length: 50,
  })
  referenceType: string | null;

  @Column("uuid", { name: "reference_id", nullable: true })
  referenceId: string | null;

  @Column("numeric", { name: "amount", precision: 18, scale: 2 })
  amount: string;

  @Column("character varying", { name: "transaction_type", length: 30 })
  transactionType: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => UserRewards, (userRewards) => userRewards.creditLedgers, {
    onDelete: "SET NULL",
  })
  @JoinColumn([
    { name: "user_reward_id", referencedColumnName: "userRewardId" },
  ])
  userReward: UserRewards;
}
