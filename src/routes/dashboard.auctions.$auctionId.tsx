import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gavel, Hammer, Play, SkipForward } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTitle } from "@/lib/title";

export const Route = createFileRoute("/dashboard/auctions/$auctionId")({
  component: AuctionFloor,
});

type Auction = {
  id: string;
  status: "pending" | "live" | "completed";
  current_player_id: string | null;
  current_team_id: string | null;
  current_bid: number;
  tournament_id: string | null;
};

type Player = {
  id: string;
  full_name: string;
  country: string | null;
  elo: number;
  team_id: string | null;
  auction_value: number;
  photo_url: string | null;
};

type Team = {
  id: string;
  name: string;
  budget: number;
  tournament_id: string | null;
};

type Bid = {
  id: string;
  amount: number;
  team_id: string;
  player_id: string;
  created_at: string;
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

function AuctionFloor() {
  const { auctionId } = Route.useParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [nextPlayerId, setNextPlayerId] = useState("");
  const [basePrice, setBasePrice] = useState(1000000);
  const [bidTeamId, setBidTeamId] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  const loadAll = async () => {
    const [{ data: a }, { data: p }, { data: t }, { data: b }] = await Promise.all([
      supabase.from("auctions").select("*").eq("id", auctionId).maybeSingle(),
      supabase.from("players").select("*").order("elo", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("bids")
        .select("*")
        .eq("auction_id", auctionId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setAuction(a as Auction | null);
    setPlayers((p ?? []) as Player[]);
    setTeams((t ?? []) as Team[]);
    setBids((b ?? []) as Bid[]);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel(`auction-${auctionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auctions", filter: `id=eq.${auctionId}` },
        loadAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bids", filter: `auction_id=eq.${auctionId}` },
        loadAll,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === auction?.current_player_id) ?? null,
    [players, auction?.current_player_id],
  );
  const currentTeam = useMemo(
    () => teams.find((t) => t.id === auction?.current_team_id) ?? null,
    [teams, auction?.current_team_id],
  );
  const pool = useMemo(() => players.filter((p) => !p.team_id), [players]);
  const eligibleTeams = useMemo(() => {
    if (!auction) return teams;
    return auction.tournament_id
      ? teams.filter((t) => t.tournament_id === auction.tournament_id)
      : teams;
  }, [teams, auction]);

  const start = async () => {
    if (!nextPlayerId) return toast.error("Pick a player");
    const { error } = await supabase.rpc("set_current_player", {
      _auction_id: auctionId,
      _player_id: nextPlayerId,
      _base_price: basePrice,
    });
    if (error) return toast.error(error.message);
    setNextPlayerId("");
  };

  const placeBid = async () => {
    const amt = parseInt(bidAmount, 10);
    if (!bidTeamId || !amt) return toast.error("Choose a team and amount");
    const { error } = await supabase.rpc("place_bid", {
      _auction_id: auctionId,
      _team_id: bidTeamId,
      _amount: amt,
    });
    if (error) return toast.error(error.message);
    setBidAmount("");
  };

  const finalize = async () => {
    const { error } = await supabase.rpc("finalize_current_player", {
      _auction_id: auctionId,
    });
    if (error) return toast.error(error.message);
    toast.success(
      auction?.current_team_id ? "Sold!" : "Marked unsold",
    );
  };

  const setAuctionStatus = async (status: Auction["status"]) => {
    const { error } = await supabase.from("auctions").update({ status }).eq("id", auctionId);
    if (error) toast.error(error.message);
  };

  if (!auction) {
    return <p className="text-muted-foreground">Loading auction…</p>;
  }

  const minBid = auction.current_bid + (auction.current_bid >= 5000000 ? 500000 : 100000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard/auctions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All auctions
        </Link>
        <div className="flex items-center gap-2">
          {auction.status !== "live" && (
            <Button size="sm" variant="outline" onClick={() => setAuctionStatus("live")}>
              <Play className="mr-1 h-3.5 w-3.5" /> Go live
            </Button>
          )}
          {auction.status === "live" && (
            <Button size="sm" variant="outline" onClick={() => setAuctionStatus("completed")}>
              End auction
            </Button>
          )}
        </div>
      </div>

      {/* Auction floor */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-card/40 p-6 shadow-elegant">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
          <Gavel className="h-3.5 w-3.5" /> On the block
        </div>
        {currentPlayer ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-3xl font-bold">{currentPlayer.full_name}</h2>
                {getTitle(currentPlayer.elo) && (
                  <Badge variant="outline" className="border-gold/40 text-gold">
                    {getTitle(currentPlayer.elo)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentPlayer.country ?? "—"} · Elo {currentPlayer.elo}
              </p>
              <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                Current bid
              </p>
              <p className="font-display text-4xl font-bold text-gradient-gold">
                {fmt(auction.current_bid)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentTeam ? `Leading: ${currentTeam.name}` : "No bids yet"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:w-64">
              <Select value={bidTeamId} onValueChange={setBidTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Bidding team" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id} disabled={t.budget < minBid}>
                      {t.name} · {fmt(t.budget)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={`Min ${fmt(minBid)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <Button onClick={placeBid}>
                <Hammer className="mr-1 h-4 w-4" /> Place bid
              </Button>
              <Button variant="outline" onClick={finalize}>
                <SkipForward className="mr-1 h-4 w-4" />
                {auction.current_team_id ? "Sold to leader" : "Mark unsold"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <Label>Next player</Label>
              <Select value={nextPlayerId} onValueChange={setNextPlayerId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pick from pool" />
                </SelectTrigger>
                <SelectContent>
                  {pool.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} · Elo {p.elo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Base price</Label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(parseInt(e.target.value, 10) || 0)}
                className="mt-1.5"
              />
            </div>
            <Button onClick={start}>
              <Play className="mr-1 h-4 w-4" /> Put on block
            </Button>
          </div>
        )}
      </div>

      {/* Bid history & teams */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h3 className="font-display text-lg font-semibold">Recent bids</h3>
          <div className="mt-3 space-y-2">
            {bids.length === 0 && (
              <p className="text-sm text-muted-foreground">No bids yet.</p>
            )}
            {bids.map((b) => {
              const t = teams.find((x) => x.id === b.team_id);
              const p = players.find((x) => x.id === b.player_id);
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{t?.name ?? "Team"}</span>
                    <span className="text-muted-foreground"> · {p?.full_name ?? "—"}</span>
                  </div>
                  <span className="font-display font-semibold text-gold">{fmt(b.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h3 className="font-display text-lg font-semibold">Team budgets</h3>
          <div className="mt-3 space-y-2">
            {eligibleTeams.length === 0 && (
              <p className="text-sm text-muted-foreground">No teams configured.</p>
            )}
            {eligibleTeams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2 text-sm"
              >
                <span className="font-medium">{t.name}</span>
                <span className="font-display font-semibold">{fmt(t.budget)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
