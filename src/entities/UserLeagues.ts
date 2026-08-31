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

@Index("idx_user_leagues_user", ["achievedAt", "userId"], {})
@Index("idx_user_leagues_current", ["userId"], {})
@Index("user_leagues_pkey", ["userLeagueId"], { unique: true })
@Entity("user_leagues", { schema: "discovery_db" })
export class UserLeagues {
  @Column("uuid", {
    primary: true,
    name: "user_league_id",
    default: () => "gen_random_uuid()",
  })
  userLeagueId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("timestamp with time zone", {
    name: "achieved_at",
    default: () => "now()",
  })
  achievedAt: Date;

  @Column("bigint", { name: "achieved_points" })
  achievedPoints: string;

  @Column("character varying", {
    name: "source",
    length: 50,
    default: () => "'POINT_THRESHOLD'",
  })
  source: string;

  @Column("boolean", { name: "is_current", default: () => "true" })
  isCurrent: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => LeagueTiers, (leagueTiers) => leagueTiers.userLeagues)
  @JoinColumn([{ name: "league_id", referencedColumnName: "leagueId" }])
  league: LeagueTiers;

  @OneToMany(() => UserRewards, (userRewards) => userRewards.userLeague)
  userRewards: UserRewards[];
}
