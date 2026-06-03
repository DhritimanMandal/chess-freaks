import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatBudget } from "@/lib/title";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams — Chess Freaks" },
      { name: "description", content: "All teams competing in Chess Freaks leagues." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { data } = useQuery({
    queryKey: ["teams-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*, players(count)")
        .order("points", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background bg-noir">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold">
          <span className="text-gradient-gold">Teams</span>
        </h1>
        <p className="mt-2 text-muted-foreground">{data?.length ?? 0} squads in the arena.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((t: any) => (
            <div
              key={t.id}
              className="group rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-gold/40 hover:shadow-[var(--shadow-gold)]"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-gold/30">
                  <AvatarImage src={t.logo_url ?? undefined} alt={t.name} />
                  <AvatarFallback className="bg-muted">
                    <Shield className="h-6 w-6 text-gold" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-display text-lg font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t.owner_name ? `Owner: ${t.owner_name}` : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
                <div>
                  <div className="font-display text-xl font-bold text-gradient-gold">{t.points}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Points</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 font-display text-xl font-bold">
                    <Users className="h-3 w-3" />
                    {t.players?.[0]?.count ?? 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Roster</div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold">{formatBudget(t.budget)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</div>
                </div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <p className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No teams yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
