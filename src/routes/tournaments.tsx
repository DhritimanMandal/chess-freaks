import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tournaments")({
  head: () => ({
    meta: [
      { title: "Tournaments — Chess Freaks" },
      { name: "description", content: "All chess tournaments hosted on Chess Freaks." },
    ],
  }),
  component: TournamentsPage,
});

const FORMAT_LABEL: Record<string, string> = {
  round_robin: "Round Robin",
  swiss: "Swiss",
  knockout: "Knockout",
  league: "League",
};

function TournamentsPage() {
  const { data } = useQuery({
    queryKey: ["tournaments-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background bg-noir">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold">
          <span className="text-gradient-gold">Tournaments</span>
        </h1>
        <p className="mt-2 text-muted-foreground">{data?.length ?? 0} events.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((t: any) => (
            <div
              key={t.id}
              className="rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-gold/40 hover:shadow-[var(--shadow-gold)]"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-gold/40 text-gold-soft">
                  <Trophy className="mr-1 h-3 w-3" />
                  {FORMAT_LABEL[t.format]}
                </Badge>
                <Badge variant="secondary" className="capitalize">{t.status}</Badge>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">{t.name}</h3>
              {t.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
              )}
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {t.start_date ?? "TBD"} — {t.end_date ?? "TBD"}
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <p className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No tournaments yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
