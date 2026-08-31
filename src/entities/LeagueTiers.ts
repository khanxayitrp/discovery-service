import { Column, Entity, Index, OneToMany } from "typeorm";
import { LeagueRewards } from "./LeagueRewards";
import { UserLeagues } from "./UserLeagues";

@Index("league_tiers_code_key", ["code"], { unique: true })
@Index("league_tiers_pkey", ["leagueId"], { unique: true })
@Entity("league_tiers", { schema: "discovery_db" })
export class LeagueTiers {
  @Column("uuid", {
    primary: true,
    name: "league_id",
    default: () => "gen_random_uuid()",
  })
  leagueId: string;

  @Column("character varying", { name: "code", unique: true, length: 50 })
  code: string;

  @Column("character varying", { name: "tier_group", length: 30 })
  tierGroup: string;

  @Column("character varying", { name: "name", length: 100 })
  name: string;

  @Column("bigint", { name: "min_points", default: () => "0" })
  minPoints: string;

  @Column("bigint", { name: "max_points", nullable: true })
  maxPoints: string | null;

  @Column("integer", { name: "sort_order" })
  sortOrder: number;

  @Column("text", { name: "icon_url", nullable: true })
  iconUrl: string | null;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("boolean", { name: "is_manual_selection", default: () => "false" })
  isManualSelection: boolean;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive: boolean;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @OneToMany(() => LeagueRewards, (leagueRewards) => leagueRewards.league)
  leagueRewards: LeagueRewards[];

  @OneToMany(() => UserLeagues, (userLeagues) => userLeagues.league)
  userLeagues: UserLeagues[];
}
