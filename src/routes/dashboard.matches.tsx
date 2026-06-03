import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/matches")({
  component: MatchesAdmin,
});

const RESULT_LABEL: Record<string, string> = {
  pending: "Pending",
  team_a: "Team A win",
  team_b: "Team B win",
  draw: "Draw",
};

function MatchesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tournament_id: "",
    stage: "",
    team_a_id: "",
    team_b_id: "",
    player_a_id: "",
    player_b_id: "",
    scheduled_at: "",
  });

  const { data: matches } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, tournament:tournaments(name), team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name), player_a:players!matches_player_a_id_fkey(full_name), player_b:players!matches_player_b_id_fkey(full_name)")
        .order("scheduled_at", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });

  const { data: tournaments } = useQuery({
    queryKey: ["mat-tournaments"],
    queryFn: async () => (await supabase.from("tournaments").select("id, name").order("name")).data ?? [],
  });
  const { data: teams } = useQuery({
    queryKey: ["mat-teams"],
    queryFn: async () => (await supabase.from("teams").select("id, name").order("name")).data ?? [],
  });
  const { data: players } = useQuery({
    queryKey: ["mat-players"],
    queryFn: async () => (await supabase.from("players").select("id, full_name").order("full_name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("matches").insert({
        tournament_id: form.tournament_id || null,
        stage: form.stage || null,
        team_a_id: form.team_a_id || null,
        team_b_id: form.team_b_id || null,
        player_a_id: form.player_a_id || null,
        player_b_id: form.player_b_id || null,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Match scheduled");
      setOpen(false);
      setForm({ tournament_id: "", stage: "", team_a_id: "", team_b_id: "", player_a_id: "", player_b_id: "", scheduled_at: "" });
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateResult = useMutation({
    mutationFn: async ({ id, result, mvp_player_id }: { id: string; result: string; mvp_player_id: string | null }) => {
      const { error } = await supabase
        .from("matches")
        .update({ result: result as any, mvp_player_id: mvp_player_id || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Result recorded — Elo & standings updated");
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-matches"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Matches</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-br from-gold to-gold-soft text-gold-foreground">
              <Plus className="mr-1 h-4 w-4" /> Schedule match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Schedule a match</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Tournament</Label>
                <Select value={form.tournament_id} onValueChange={(v) => setForm({ ...form, tournament_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Friendly" /></SelectTrigger>
                  <SelectContent>
                    {(tournaments ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Input value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} placeholder="QF / SF / Final" />
              </div>
              <div className="space-y-1.5">
                <Label>Scheduled at</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Team A</Label>
                <Select value={form.team_a_id} onValueChange={(v) => setForm({ ...form, team_a_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(teams ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Team B</Label>
                <Select value={form.team_b_id} onValueChange={(v) => setForm({ ...form, team_b_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(teams ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Player A</Label>
                <Select value={form.player_a_id} onValueChange={(v) => setForm({ ...form, player_a_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(players ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Player B</Label>
                <Select value={form.player_b_id} onValueChange={(v) => setForm({ ...form, player_b_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(players ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Tournament</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(matches ?? []).map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : "TBD"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.tournament?.name ?? "—"} {m.stage ? `· ${m.stage}` : ""}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="font-medium">{m.player_a?.full_name ?? m.team_a?.name ?? "TBD"}</span>
                    <span className="mx-2 text-muted-foreground">vs</span>
                    <span className="font-medium">{m.player_b?.full_name ?? m.team_b?.name ?? "TBD"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {m.result === "pending" ? (
                    <ResultSetter
                      match={m}
                      onSubmit={(result, mvp) => updateResult.mutate({ id: m.id, result, mvp_player_id: mvp })}
                    />
                  ) : (
                    <Badge className="bg-gold/20 text-gold-soft">{RESULT_LABEL[m.result]}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!matches || matches.length === 0) && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No matches scheduled.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Tip: when you record a result, player Elo, win/loss stats and team points update automatically.
      </p>
    </div>
  );
}

function ResultSetter({ match, onSubmit }: { match: any; onSubmit: (r: string, mvp: string | null) => void }) {
  const [result, setResult] = useState<string>("");
  const [mvp, setMvp] = useState<string>("");
  const playerOpts = [match.player_a, match.player_b].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={result} onValueChange={setResult}>
        <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Set result" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="team_a">{match.team_a?.name ?? "Player A"} wins</SelectItem>
          <SelectItem value="team_b">{match.team_b?.name ?? "Player B"} wins</SelectItem>
          <SelectItem value="draw">Draw</SelectItem>
        </SelectContent>
      </Select>
      {playerOpts.length > 0 && (
        <Select value={mvp} onValueChange={setMvp}>
          <SelectTrigger className="h-8 w-28"><SelectValue placeholder="MVP" /></SelectTrigger>
          <SelectContent>
            {match.player_a && <SelectItem value={match.player_a_id}>{match.player_a.full_name}</SelectItem>}
            {match.player_b && <SelectItem value={match.player_b_id}>{match.player_b.full_name}</SelectItem>}
          </SelectContent>
        </Select>
      )}
      <Button size="sm" disabled={!result} onClick={() => onSubmit(result, mvp || null)}>Save</Button>
    </div>
  );
}
