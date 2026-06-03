import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Gavel, Swords, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { data } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [players, teams, tournaments, matches, auctions, topPlayer] = await Promise.all([
        supabase.from("players").select("*", { count: "exact", head: true }),
        supabase.from("teams").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("auctions").select("*", { count: "exact", head: true }),
        supabase.from("players").select("full_name, elo").order("elo", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        players: players.count ?? 0,
        teams: teams.count ?? 0,
        tournaments: tournaments.count ?? 0,
        matches: matches.count ?? 0,
        auctions: auctions.count ?? 0,
        topPlayer: topPlayer.data,
      };
    },
  });

  const cards = [
    { label: "Players", value: data?.players ?? 0, icon: Crown },
    { label: "Teams", value: data?.teams ?? 0, icon: Users },
    { label: "Tournaments", value: data?.tournaments ?? 0, icon: Trophy },
    { label: "Matches", value: data?.matches ?? 0, icon: Swords },
    { label: "Auctions", value: data?.auctions ?? 0, icon: Gavel },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Admin Overview</h1>
      <p className="mt-1 text-muted-foreground">Everything happening in your league.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border/60 bg-card p-5">
            <c.icon className="h-5 w-5 text-gold" />
            <div className="mt-3 font-display text-3xl font-bold text-gradient-gold">{c.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {data?.topPlayer && (
        <div className="mt-8 rounded-xl border border-gold/30 bg-gradient-to-br from-card to-background p-6">
          <div className="text-xs uppercase tracking-wider text-gold-soft">Top-rated player</div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold">{data.topPlayer.full_name}</span>
            <span className="font-display text-2xl text-gradient-gold">{data.topPlayer.elo} Elo</span>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Getting started</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Create a <strong className="text-foreground">tournament</strong> with a format and dates.</li>
          <li>2. Add <strong className="text-foreground">teams</strong> with budgets and assign them to the tournament.</li>
          <li>3. Add <strong className="text-foreground">players</strong> — every player starts at 1500 Elo.</li>
          <li>4. Run an <strong className="text-foreground">auction</strong> or assign players to teams directly.</li>
          <li>5. Schedule <strong className="text-foreground">matches</strong> and record results — Elo, stats and standings update automatically.</li>
        </ol>
      </div>
    </div>
  );
}
