import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Inbox, LayoutDashboard, Users, BarChart3, Settings, Sparkles, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex animate-in fade-in duration-500">
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-sidebar sticky top-0 h-screen z-20">
        <div className="px-5 pt-6 pb-8">
          <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <span className="size-7 rounded-md bg-foreground text-background grid place-items-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Sparkles className="size-4 animate-pulse" strokeWidth={2.4} />
            </span>
            <span className="font-section text-[15px] font-semibold tracking-tight">
              leadflow<span className="text-orange">.</span>
            </span>
          </Link>
        </div>

        <nav className="px-2 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-200 group relative",
                  active
                    ? "bg-[oklch(0.12_0_0)] text-foreground frost-border shadow-[inset_0_0_10px_rgba(214,235,253,0.05)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.08_0_0)]"
                )}
              >
                <Icon className={cn("size-4 transition-transform group-hover:scale-110", active ? "text-foreground" : "text-muted-foreground")} strokeWidth={1.8} />
                <span className="font-section font-medium tracking-tight">{label}</span>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 space-y-2">
          <LineStatus id="L1" label="Linha 1" phone="+55 11 99887-1100" online />
          <LineStatus id="L2" label="Linha 2" phone="+55 65 99700-2244" online />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function LineStatus({
  label,
  phone,
  online,
}: {
  id: string;
  label: string;
  phone: string;
  online: boolean;
}) {
  return (
    <div className="frost-border rounded-lg px-3 py-2.5 bg-[oklch(0.04_0_0)] group/status">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-section">
          {label}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[oklch(0.86_0.2_155)]">
          <span className="size-1.5 rounded-full bg-[oklch(0.86_0.2_155)] shadow-[0_0_8px_oklch(0.86_0.2_155)] animate-pulse" />
          {online ? "online" : "off"}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-foreground/90 font-mono transition-colors group-hover/status:text-foreground">
        <Wifi className="size-3 text-muted-foreground group-hover/status:text-blue" />
        {phone}
      </div>
    </div>
  );
}
