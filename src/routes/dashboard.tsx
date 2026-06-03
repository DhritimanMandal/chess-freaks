import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Crown, Gavel, LayoutDashboard, ShieldAlert, Swords, Trophy, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Chess Freaks" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/dashboard/teams", label: "Teams", icon: Users },
  { to: "/dashboard/players", label: "Players", icon: Crown },
  { to: "/dashboard/matches", label: "Matches", icon: Swords },
  { to: "/dashboard/auctions", label: "Auctions", icon: Gavel },
];

function DashboardLayout() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background bg-noir px-4">
        <div className="max-w-md rounded-xl border border-border/60 bg-card p-10 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 font-display text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin privileges yet. Ask a current admin to promote you, or
            grant the first admin role from the backend.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Signed in as <span className="text-foreground">{user.email}</span>
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background bg-noir">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-sidebar md:flex md:flex-col">
        <Link to="/" className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-gold to-gold-soft text-gold-foreground">
            <Crown className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display font-bold">
            Chess<span className="text-gradient-gold"> Freaks</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active = n.exact
              ? location.pathname === n.to
              : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-gold/15 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-3 text-xs text-muted-foreground">
          Admin · {user.email}
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        {/* mobile nav */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-card/40 px-3 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground bg-gold/10" }}
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </Link>
          ))}
        </div>
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
