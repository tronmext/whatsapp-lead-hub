import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Inbox, LayoutDashboard, Users, BarChart3, Settings, Sparkles, Wifi } from "lucide-react";

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
    <div className="min-h-screen w-full bg-background text-foreground flex">
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-sidebar sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="size-7 rounded-md bg-foreground text-background grid place-items-center">
              <Sparkles className="size-4" strokeWidth={2.4} />
            </span>
            <span className="font-section text-[15px] font-semibold tracking-tight">
              leadflow<span className="text-[oklch(0.74_0.18_45)]">.</span>
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
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
                  active
                    ? "bg-[oklch(0.12_0_0)] text-foreground frost-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.08_0_0)]",
                ].join(" ")}
              >
                <Icon className="size-4" strokeWidth={1.8} />
                <span className="font-section font-medium tracking-tight">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 space-y-2">
          <LineStatus id="L1" label="Linha 1" phone="+55 11 99887-1100" online />
          <LineStatus id="L2" label="Linha 2" phone="+55 65 99700-2244" online />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
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
    <div className="frost-border rounded-lg px-3 py-2.5 bg-[oklch(0.04_0_0)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-section">
          {label}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[oklch(0.86_0.2_155)]">
          <span className="size-1.5 rounded-full bg-[oklch(0.86_0.2_155)] shadow-[0_0_8px_oklch(0.86_0.2_155)]" />
          {online ? "online" : "off"}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-foreground/90 font-mono">
        <Wifi className="size-3 text-muted-foreground" />
        {phone}
      </div>
    </div>
  );
}
