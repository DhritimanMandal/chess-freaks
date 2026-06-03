import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Crown, Gavel, Swords, TrendingUp, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { PlayerCard } from "@/components/PlayerCard";
import { supabase } from "@/integrations/supabase/client";
import { getTitle, titleColor } from "@/lib/title";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chess Freaks — Pro Chess Tournament Management" },
      {
        name: "description",
        content:
          "Run chess leagues end-to-end: tournaments, team auctions, Elo ratings, live standings and player stats.",
      },
      { property: "og:title", content: "Chess Freaks — Pro Chess Tournament Management" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [p, t, tour] = await Promise.all([
        supabase.from("players").select("*", { count: "exact", head: true }),
        supabase.from("teams").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("*", { count: "exact", head: true }),
      ]);
      return {
        players: p.count ?? 0,
        teams: t.count ?? 0,
        tournaments: tour.count ?? 0,
      };
    },
  });

  const { data: topPlayers } = useQuery({
    queryKey: ["top-players"],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("*, teams(name)")
        .order("elo", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: recentTournaments } = useQuery({
    queryKey: ["recent-tournaments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background bg-noir">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 chess-grid opacity-40" />
        <div className="absolute -top-32 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold-soft">
              <Crown className="h-3 w-3" /> Professional Chess League Platform
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Where Chess Leagues
              <br />
              <span className="text-gradient-gold">Are Crowned.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Tournaments, team auctions, Elo ratings, live standings — every piece of your chess
              league, on one board.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-br from-gold to-gold-soft text-gold-foreground hover:opacity-90 shadow-[var(--shadow-gold)]">
                <Link to="/tournaments">
                  Explore tournaments <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Admin sign in</Link>
              </Button>
            </div>

            {/* Live stats */}
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6">
              {[
                { label: "Players", value: stats?.players ?? 0 },
                { label: "Teams", value: stats?.teams ?? 0 },
                { label: "Tournaments", value: stats?.tournaments ?? 0 },
              ].map((s) => (
                <div key={s.label} className="border-l border-gold/30 pl-4 text-left">
                  <div className="font-display text-3xl font-bold text-gradient-gold">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Everything a chess league needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the opening bid to the final standings.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Trophy,
              title: "Tournament Management",
              desc: "Round Robin, Swiss, Knockout, or League — set format, dates, and teams in seconds.",
            },
            {
              icon: Gavel,
              title: "Player Auctions",
              desc: "Live bidding interface, team budgets, automatic roster assignment.",
            },
            {
              icon: TrendingUp,
              title: "Automatic Elo",
              desc: "Standard chess Elo — updates after every result with title badges (CFM/IM/GM).",
            },
            {
              icon: Swords,
              title: "Match Scheduling",
              desc: "Auto-generated fixtures, pairings, stages and results capture.",
            },
            {
              icon: Users,
              title: "Team & Player DB",
              desc: "Rich player profiles — country, photo, stats, MVPs, auction value, history.",
            },
            {
              icon: Crown,
              title: "Live Standings",
              desc: "Real-time scoreboards, tie-breaks and analytics for every tournament.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-gold/40 hover:shadow-[var(--shadow-gold)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TOP PLAYERS */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Top-rated Players</h2>
              <p className="mt-2 text-muted-foreground">Highest active Elo across all leagues.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/players">
                See all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {topPlayers && topPlayers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPlayers.map((p: any) => (
                <PlayerCard key={p.id} player={p} teamName={p.teams?.name} />
              ))}
            </div>
          ) : (
            <EmptyState message="No players yet. Admins can add them from the dashboard." />
          )}
        </div>
      </section>

      {/* RECENT TOURNAMENTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Recent Tournaments</h2>
            <p className="mt-2 text-muted-foreground">Latest action on the boards.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/tournaments">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {recentTournaments && recentTournaments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recentTournaments.map((t: any) => (
              <div
                key={t.id}
                className="rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-gold/40"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
                  <Trophy className="h-3 w-3" />
                  {t.format.replace("_", " ")}
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  {t.status} · {t.start_date ?? "TBD"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No tournaments yet." />
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-background p-10 text-center sm:p-16">
            <div className="absolute inset-0 chess-grid opacity-40" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Ready to run your <span className="text-gradient-gold">next league?</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Create a tournament, auction your squad, and let the platform handle Elo, standings,
                and results.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-gradient-to-br from-gold to-gold-soft text-gold-foreground">
                  <Link to="/auth">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Chess Freaks — Every game counted.
      </footer>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
