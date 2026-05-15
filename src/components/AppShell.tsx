import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Inbox, LayoutDashboard, Users, BarChart3, Settings, Sparkles, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextMono, TextSmall } from "@/components/Typography";

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
    <div className="min-h-screen w-full bg-void text-near-white flex animate-in fade-in duration-500">
      <aside className="w-60 shrink-0 border-r border-frost-border flex flex-col bg-void sticky top-0 h-screen z-20">
        <div className="px-5 pt-8 pb-10">
          <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
            <span className="size-8 rounded-lg bg-near-white text-void grid place-items-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Sparkles className="size-5" strokeWidth={2.4} />
            </span>
            <span className="font-section text-[18px] font-semibold tracking-[-1px] text-near-white">
              leadflow<span className="text-orange-10">.</span>
            </span>
          </Link>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "nav-link flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
                  active
                    ? "text-near-white bg-white/[0.03] frost-border shadow-[inset_0_0_10px_rgba(214,235,253,0.05)]"
                    : "hover:text-near-white hover:bg-white/[0.02]"
                )}
              >
                <Icon className={cn("size-4 transition-transform group-hover:scale-110", active ? "text-near-white" : "text-muted-foreground")} strokeWidth={1.8} />
                <span className="tracking-[0.35px]">{label}</span>
                {active && (
                  <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-near-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 space-y-3">
          <LineStatus id="L1" label="Linha 01" phone="+55 11 99887-1100" online />
          <LineStatus id="L2" label="Linha 02" phone="+55 65 99700-2244" online />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative">
        <div className="absolute inset-0 bg-void pointer-events-none" />
        <div className="relative z-10">
          <Outlet />
        </div>
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
    <div className="frost-border rounded-lg px-3 py-3 bg-white/[0.01] group/status hover:bg-white/[0.03] transition-colors shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <TextSmall className="text-[10px] opacity-60">{label}</TextSmall>
        <span className="flex items-center gap-1.5 text-[10px] text-green-4 font-mono font-bold">
          <span className="size-1.5 rounded-full bg-green-4 shadow-[0_0_8px_rgba(17,255,153,0.4)] animate-pulse" />
          {online ? "LIVE" : "OFF"}
        </span>
      </div>
      <div className="flex items-center gap-2 transition-colors">
        <Wifi className="size-3 text-muted-foreground group-hover/status:text-blue-10" strokeWidth={2.5} />
        <TextMono className="text-[12px] group-hover/status:text-near-white">{phone}</TextMono>
      </div>
    </div>
  );
}
