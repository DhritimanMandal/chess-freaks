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
import { supabase } from "@/integrations/supabase/client";
import { formatBudget } from "@/lib/title";

export const Route = createFileRoute("/dashboard/teams")({
  component: TeamsAdmin,
});

function TeamsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    owner_name: "",
    budget: "100000000",
    tournament_id: "",
  });

  const { data: teams } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*, tournaments(name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: tournaments } = useQuery({
    queryKey: ["tournament-options"],
    queryFn: async () => {
      const { data } = await supabase.from("tournaments").select("id, name").order("name");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teams").insert({
        name: form.name,
        logo_url: form.logo_url || null,
        owner_name: form.owner_name || null,
        budget: Number(form.budget) || 0,
        tournament_id: form.tournament_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created");
      setOpen(false);
      setForm({ name: "", logo_url: "", owner_name: "", budget: "100000000", tournament_id: "" });
      qc.invalidateQueries({ queryKey: ["admin-teams"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-teams"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Teams</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-br from-gold to-gold-soft text-gold-foreground">
              <Plus className="mr-1 h-4 w-4" /> New team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Owner</Label>
                  <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Budget</Label>
                  <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tournament</Label>
                <Select value={form.tournament_id} onValueChange={(v) => setForm({ ...form, tournament_id: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {(tournaments ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Tournament</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(teams ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.owner_name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{t.tournaments?.name ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{formatBudget(t.budget)}</TableCell>
                <TableCell className="text-right font-display font-bold">{t.points}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!teams || teams.length === 0) && (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No teams yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
