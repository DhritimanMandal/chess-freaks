import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gavel, Plus, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/auctions")({
  component: AuctionsAdmin,
});

type Auction = {
  id: string;
  status: "pending" | "live" | "completed";
  current_bid: number;
  tournament_id: string | null;
  created_at: string;
};

type Tournament = { id: string; name: string };

function AuctionsAdmin() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: a }, { data: t }] = await Promise.all([
      supabase.from("auctions").select("*").order("created_at", { ascending: false }),
      supabase.from("tournaments").select("id,name").order("created_at", { ascending: false }),
    ]);
    setAuctions((a ?? []) as Auction[]);
    setTournaments((t ?? []) as Tournament[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("auctions-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const createAuction = async () => {
    const { error } = await supabase
      .from("auctions")
      .insert({ tournament_id: tournamentId || null, status: "pending" });
    if (error) return toast.error(error.message);
    toast.success("Auction created");
    setTournamentId("");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Auctions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Run live player auctions with real-time bidding.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="font-display text-lg font-semibold">New auction</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="t">Tournament (optional)</Label>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger id="t" className="mt-1.5">
                <SelectValue placeholder="No tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createAuction}>
            <Plus className="mr-1 h-4 w-4" /> Create
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : auctions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gold/30 bg-card/50 p-12 text-center">
            <Gavel className="mx-auto h-10 w-10 text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">No auctions yet — create one above.</p>
          </div>
        ) : (
          auctions.map((a) => {
            const t = tournaments.find((x) => x.id === a.tournament_id);
            return (
              <Link
                key={a.id}
                to="/dashboard/auctions/$auctionId"
                params={{ auctionId: a.id }}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-gold/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <span className="truncate font-medium">
                      {t?.name ?? "Untitled auction"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Auction["status"] }) {
  const map = {
    pending: "bg-muted text-muted-foreground",
    live: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    completed: "bg-gold/15 text-gold ring-1 ring-gold/30",
  } as const;
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}
