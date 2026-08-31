import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { CreditLedger } from "./CreditLedger";
import { LeagueRewards } from "./LeagueRewards";
import { UserLeagues } from "./UserLeagues";

@Index("idx_user_rewards_status", ["expiresAt", "status"], {})
@Index("idx_user_rewards_user", ["status", "userId"], {})
@Index("user_rewards_pkey", ["userRewardId"], { unique: true })
@Entity("user_rewards", { schema: "discovery_db" })
export class UserRewards {
  @Column("uuid", {
    primary: true,
    name: "user_reward_id",
    default: () => "gen_random_uuid()",
  })
  userRewardId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("character varying", {
    name: "status",
    length: 30,
    default: () => "'AVAILABLE'",
  })
  status: string;

  @Column("timestamp with time zone", {
    name: "issued_at",
    default: () => "now()",
  })
  issuedAt: Date;

  @Column("timestamp with time zone", { name: "expires_at", nullable: true })
  expiresAt: Date | null;

  @Column("timestamp with time zone", { name: "redeemed_at", nullable: true })
  redeemedAt: Date | null;

  @Column("uuid", { name: "redemption_reference", nullable: true })
  redemptionReference: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToMany(() => CreditLedger, (creditLedger) => creditLedger.userReward)
  creditLedgers: CreditLedger[];

  @ManyToOne(() => LeagueRewards, (leagueRewards) => leagueRewards.userRewards)
  @JoinColumn([
    { name: "league_reward_id", referencedColumnName: "leagueRewardId" },
  ])
  leagueReward: LeagueRewards;

  @ManyToOne(() => UserLeagues, (userLeagues) => userLeagues.userRewards, {
    onDelete: "SET NULL",
  })
  @JoinColumn([
    { name: "user_league_id", referencedColumnName: "userLeagueId" },
  ])
  userLeague: UserLeagues;
}
