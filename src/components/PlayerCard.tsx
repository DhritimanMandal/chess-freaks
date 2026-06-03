import { Award, Trophy } from "lucide-react";
import { getTitle, titleColor } from "@/lib/title";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerCardProps {
  player: {
    id: string;
    full_name: string;
    country: string | null;
    photo_url: string | null;
    elo: number;
    mvp_count: number;
    matches_played: number;
    wins: number;
    losses: number;
  };
  teamName?: string | null;
}

export function PlayerCard({ player, teamName }: PlayerCardProps) {
  const title = getTitle(player.elo);
  const winRate =
    player.matches_played > 0 ? Math.round((player.wins / player.matches_played) * 100) : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-gold/40 hover:shadow-[var(--shadow-gold)]">
      <div className="absolute inset-0 chess-grid opacity-30 transition-opacity group-hover:opacity-60" />
      <div className="relative flex items-start gap-4">
        <Avatar className="h-16 w-16 border border-gold/30">
          <AvatarImage src={player.photo_url ?? undefined} alt={player.full_name} />
          <AvatarFallback className="bg-muted font-display text-lg">
            {player.full_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {title && (
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${titleColor(title)}`}
              >
                {title}
              </span>
            )}
            <h3 className="truncate font-display font-semibold text-base">{player.full_name}</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {player.country ?? "—"} {teamName ? `· ${teamName}` : ""}
          </p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-2xl font-bold text-gradient-gold">{player.elo}</span>
            <span className="text-xs text-muted-foreground">Elo</span>
          </div>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
        <Stat label="Played" value={player.matches_played} />
        <Stat label="Win %" value={`${winRate}%`} />
        <Stat label="MVP" value={player.mvp_count} icon={<Award className="h-3 w-3" />} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 font-display text-sm font-semibold">
        {icon}
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

export { Trophy };