import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/standings")({
  head: () => ({
    meta: [
      { title: "Live Standings — Chess Freaks" },
      { name: "description", content: "Live team standings, points, wins and tie-breaks." },
    ],
  }),
  component: StandingsPage,
});

function StandingsPage() {
  const { data } = useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*, players(elo)")
        .order("points", { ascending: false });
      return (data ?? []).map((t: any) => ({
        ...t,
        avg_elo:
          t.players && t.players.length > 0
            ? Math.round(t.players.reduce((s: number, p: any) => s + p.elo, 0) / t.players.length)
            : 0,
        roster: t.players?.length ?? 0,
      }));
    },
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-screen bg-background bg-noir">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-gold to-gold-soft text-gold-foreground">
            <Trophy className="h-5 w-5" />
          </span>
          <h1 className="font-display text-4xl font-bold">Live Standings</h1>
        </div>
        <p className="mt-2 text-muted-foreground">Auto-refreshes every 15 seconds.</p>

        <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Roster</TableHead>
                <TableHead className="text-right">Avg Elo</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((t, i) => (
                <TableRow key={t.id} className="border-border/60">
                  <TableCell className="font-display font-bold text-gold">{i + 1}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-right">{t.roster}</TableCell>
                  <TableCell className="text-right font-mono">{t.avg_elo || "—"}</TableCell>
                  <TableCell className="text-right font-display text-lg font-bold text-gradient-gold">
                    {t.points}
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No standings yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
