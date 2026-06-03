export type ChessTitle = "GM" | "IM" | "CFM" | null;

export function getTitle(elo: number): ChessTitle {
  if (elo >= 2500) return "GM";
  if (elo >= 2300) return "IM";
  if (elo >= 2000) return "CFM";
  return null;
}

export function titleColor(title: ChessTitle): string {
  switch (title) {
    case "GM":
      return "bg-gradient-to-br from-gold to-gold-soft text-gold-foreground";
    case "IM":
      return "bg-gold/80 text-gold-foreground";
    case "CFM":
      return "bg-gold/40 text-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function formatBudget(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}
