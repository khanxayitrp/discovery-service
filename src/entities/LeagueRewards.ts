import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { LeagueTiers } from "./LeagueTiers";
import { UserRewards } from "./UserRewards";

@Index("idx_league_rewards_league", ["leagueId"], {})
@Index("league_rewards_pkey", ["leagueRewardId"], { unique: true })
@Entity("league_rewards", { schema: "discovery_db" })
export class LeagueRewards {
  @Column("uuid", {
    primary: true,
    name: "league_reward_id",
    default: () => "gen_random_uuid()",
  })
  leagueRewardId: string;

  @Column("uuid", { name: "league_id" })
  leagueId: string;

  @Column("character varying", { name: "reward_type", length: 50 })
  rewardType: string;

  @Column("character varying", {
    name: "reward_code",
    nullable: true,
    length: 100,
  })
  rewardCode: string | null;

  @Column("character varying", { name: "reward_name", length: 255 })
  rewardName: string;

  @Column("numeric", {
    name: "reward_value",
    nullable: true,
    precision: 18,
    scale: 2,
  })
  rewardValue: string | null;

  @Column("character", { name: "currency_code", nullable: true, length: 3 })
  currencyCode: string | null;

  @Column("integer", { name: "quantity", nullable: true })
  quantity: number | null;

  @Column("integer", { name: "valid_days", nullable: true })
  validDays: number | null;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => LeagueTiers, (leagueTiers) => leagueTiers.leagueRewards, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "league_id", referencedColumnName: "leagueId" }])
  league: LeagueTiers;

  @OneToMany(() => UserRewards, (userRewards) => userRewards.leagueReward)
  userRewards: UserRewards[];
}
