import { createFileRoute, Link } from "@tanstack/react-router";
import { LEADS } from "@/lib/mock-data";
import { ArrowUpRight, MessageSquare, Sparkles, TrendingUp, Users, Clock, Zap, Target } from "lucide-react";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Leadflow" },
      { name: "description", content: "Visão geral cinematográfica dos leads e atividade WhatsApp." },
    ],
  }),
  component: Dashboard,
});

const METRICS = [
  { label: "Leads ativos", value: "247", delta: "+12.4%", icon: Users, accent: "var(--color-orange-10)" },
  { label: "Novos hoje", value: "18", delta: "+5", icon: TrendingUp, accent: "var(--color-green-4)" },
  { label: "Em negociação", value: "63", delta: "+8.1%", icon: MessageSquare, accent: "var(--color-blue-10)" },
  { label: "Tempo médio resp.", value: "3m 42s", delta: "-21%", icon: Clock, accent: "var(--color-red-5)" },
];

function Dashboard() {
  const recent = LEADS.slice(0, 4);

  return (
    <div className="relative min-h-screen bg-void animate-in fade-in duration-1000 overflow-hidden">
      {/* Cinematic Grain & Background depth */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute top-[-20%] right-[-10%] size-[800px] bg-orange-10/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[600px] bg-blue-10/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative px-12 py-16 max-w-[1400px] mx-auto">
        <header className="flex items-end justify-between mb-20 animate-in slide-in-from-top-6 duration-1000">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-green-4 animate-pulse shadow-[0_0_10px_rgba(17,255,153,0.5)]" />
              <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground font-mono font-semibold">
                SISTEMA OPERACIONAL · LIVE
              </p>
            </div>
            <h1 className="text-[96px] leading-[1.0] font-display text-near-white">
              Boa tarde,<br />
              <span className="text-muted-foreground italic font-light opacity-60">o pipeline performa.</span>
            </h1>
          </div>
          <Link
            to="/inbox"
            className="btn-secondary px-8 py-3 text-[14px] flex items-center gap-3 group group-hover:scale-105 active:scale-95 shadow-2xl"
          >
            ABRIR INBOX <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {METRICS.map((m, i) => (
            <div 
              key={m.label} 
              className="frost-border rounded-2xl p-8 bg-white/[0.01] backdrop-blur-sm relative overflow-hidden group hover:bg-white/[0.03] transition-all duration-700 animate-in zoom-in-95"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="absolute -top-10 -right-10 size-32 rounded-full opacity-10 blur-3xl transition-all duration-1000 group-hover:opacity-20 group-hover:scale-150"
                style={{ background: m.accent }}
              />
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="size-10 rounded-lg bg-white/[0.03] frost-border grid place-items-center group-hover:scale-110 transition-transform">
                  <m.icon className="size-5 text-muted-foreground group-hover:text-near-white transition-colors" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-green-4/10 text-green-4 border border-green-4/20">
                  {m.delta}
                </span>
              </div>
              <div className="text-[56px] leading-none tracking-tight mb-3 font-display group-hover:translate-x-1 transition-transform">{m.value}</div>
              <div className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground font-semibold font-mono">{m.label}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leads */}
          <section className="lg:col-span-2 frost-border rounded-3xl bg-white/[0.01] backdrop-blur-sm overflow-hidden animate-in slide-in-from-bottom-6 duration-1000 delay-300 group">
            <div className="flex items-center justify-between p-10 pb-6 border-b border-frost-border">
              <h2 className="text-[20px] font-section text-near-white tracking-[0.35px]">Leads Recentes</h2>
              <Link to="/leads" className="nav-link text-[12px] flex items-center gap-2 group/link">
                GERENCIAR TODOS <ArrowUpRight className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div className="px-4">
              <ul className="divide-y divide-frost-border/30">
                {recent.map((l, i) => (
                  <li 
                    key={l.id} 
                    className="flex items-center gap-6 px-8 py-5 transition-all duration-500 hover:bg-white/[0.03] group/lead"
                  >
                    <div className="size-12 rounded-full grid place-items-center text-[15px] font-bold bg-void frost-border group-hover/lead:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
                      {l.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-semibold text-near-white/90 group-hover/lead:text-near-white transition-colors">{l.name}</div>
                      <div className="text-[13px] text-muted-foreground font-mono mt-0.5">{l.lastMessage}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[16px] font-bold text-near-white">
                        {l.score}<span className="text-muted-foreground/30 font-medium text-[12px] ml-1">/100</span>
                      </div>
                      <div className={cn(
                        "text-[9px] font-black uppercase tracking-[0.1em] mt-1.5 px-2 py-0.5 rounded inline-block",
                        l.line === "L1" ? "bg-orange-10/10 text-orange-10 border border-orange-10/20" : "bg-blue-10/10 text-blue-10 border border-blue-10/20"
                      )}>
                        {l.line}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* AI Intelligence Card */}
          <section className="frost-border rounded-3xl p-10 bg-void relative overflow-hidden animate-in slide-in-from-bottom-6 duration-1000 delay-300 group">
            <div className="absolute top-[-10%] right-[-10%] size-64 rounded-full bg-orange-10 opacity-[0.05] blur-[60px] group-hover:opacity-10 transition-opacity duration-1000" />
            <div className="size-12 rounded-xl bg-white/[0.02] frost-border grid place-items-center mb-8 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="size-6 text-orange-10 animate-pulse" />
            </div>
            <h2 className="text-[36px] leading-[1.1] font-display text-near-white mb-6 tracking-tight">
              A inteligência está <br />
              <span className="italic opacity-60">pronta para agir.</span>
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-10">
              Há <span className="text-near-white font-bold underline decoration-orange-10/40 underline-offset-8">12 conversas</span> aguardando qualificação automática por IA.
            </p>
            <button className="btn-primary w-full py-4 text-[14px] uppercase tracking-[0.1em] font-black hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all duration-500">
              QUALIFICAR AGORA
            </button>
            
            <div className="mt-10 pt-10 border-t border-frost-border/40 flex items-center justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                MODELO ATIVO
              </div>
              <div className="text-[11px] font-mono font-bold text-near-white bg-white/[0.05] px-3 py-1 rounded frost-border">
                GPT-4O · PRO
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
