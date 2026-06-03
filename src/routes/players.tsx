import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlayerCard } from "@/components/PlayerCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getTitle } from "@/lib/title";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players — Chess Freaks" },
      { name: "description", content: "Browse all rated players, their Elo, titles, teams and stats." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const [q, setQ] = useState("");
  const [titleFilter, setTitleFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["players-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("*, teams(name)")
        .order("elo", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((p: any) => {
      if (q && !p.full_name.toLowerCase().includes(q.toLowerCase())) return false;
      if (titleFilter !== "all") {
        const t = getTitle(p.elo);
        if (titleFilter === "none" && t !== null) return false;
        if (titleFilter !== "none" && t !== titleFilter) return false;
      }
      return true;
    });
  }, [data, q, titleFilter]);

  return (
    <div className="min-h-screen bg-background bg-noir">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold">
          <span className="text-gradient-gold">Players</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          {data?.length ?? 0} rated players across all leagues.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search players..."
              className="pl-9"
            />
          </div>
          <Select value={titleFilter} onValueChange={setTitleFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All titles</SelectItem>
              <SelectItem value="GM">GM (2500+)</SelectItem>
              <SelectItem value="IM">IM (2300+)</SelectItem>
              <SelectItem value="CFM">CFM (2000+)</SelectItem>
              <SelectItem value="none">Untitled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="col-span-full text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No players match your filters.
            </p>
          ) : (
            filtered.map((p: any) => <PlayerCard key={p.id} player={p} teamName={p.teams?.name} />)
          )}
        </div>
      </div>
    </div>
  );
}
