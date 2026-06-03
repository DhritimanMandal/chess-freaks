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
import { getTitle, titleColor } from "@/lib/title";

export const Route = createFileRoute("/dashboard/players")({
  component: PlayersAdmin,
});

function PlayersAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    country: "",
    photo_url: "",
    team_id: "",
    elo: "1500",
    auction_value: "0",
  });

  const { data } = useQuery({
    queryKey: ["admin-players"],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("*, teams(name)")
        .order("elo", { ascending: false });
      return data ?? [];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["team-options"],
    queryFn: async () => (await supabase.from("teams").select("id, name").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("players").insert({
        full_name: form.full_name,
        country: form.country || null,
        photo_url: form.photo_url || null,
        team_id: form.team_id || null,
        elo: Number(form.elo) || 1500,
        auction_value: Number(form.auction_value) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Player added");
      setOpen(false);
      setForm({ full_name: "", country: "", photo_url: "", team_id: "", elo: "1500", auction_value: "0" });
      qc.invalidateQueries({ queryKey: ["admin-players"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-players"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Players</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-br from-gold to-gold-soft text-gold-foreground">
              <Plus className="mr-1 h-4 w-4" /> New player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add player</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Elo (default 1500)</Label>
                  <Input type="number" value={form.elo} onChange={(e) => setForm({ ...form, elo: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Photo URL</Label>
                <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Team</Label>
                  <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Free agent" /></SelectTrigger>
                    <SelectContent>
                      {(teams ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Auction value</Label>
                  <Input type="number" value={form.auction_value} onChange={(e) => setForm({ ...form, auction_value: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!form.full_name || create.isPending} onClick={() => create.mutate()}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Elo</TableHead>
              <TableHead className="text-right">W / L / D</TableHead>
              <TableHead className="text-right">MVP</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => {
              const t = getTitle(p.elo);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {t && <Badge className={`text-[10px] ${titleColor(t)}`}>{t}</Badge>}
                      {p.full_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.country ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.teams?.name ?? "Free agent"}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-gold">{p.elo}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {p.wins}/{p.losses}/{p.draws}
                  </TableCell>
                  <TableCell className="text-right">{p.mvp_count}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!data || data.length === 0) && (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No players yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
