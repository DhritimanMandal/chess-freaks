import { Link } from "@tanstack/react-router";
import { Crown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-gold to-gold-soft text-gold-foreground shadow-[var(--shadow-gold)]">
            <Crown className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Chess<span className="text-gradient-gold"> Freaks</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { to: "/tournaments", label: "Tournaments" },
            { to: "/teams", label: "Teams" },
            { to: "/players", label: "Players" },
            { to: "/standings", label: "Standings" },
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild size="sm" variant="default">
                  <Link to="/dashboard">Admin</Link>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}