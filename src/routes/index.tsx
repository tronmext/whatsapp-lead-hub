import { createFileRoute, Link } from "@tanstack/react-router";
import { LEADS } from "@/lib/mock-data";
import { ArrowUpRight, MessageSquare, Sparkles, TrendingUp, Users, Clock, Zap, Target } from "lucide-react";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Leadflow" },
      { name: "description", content: "Visão geral dos leads, conversões e atividade das duas linhas WhatsApp." },
    ],
  }),
  component: Dashboard,
});

const METRICS = [
  { label: "Leads ativos", value: "247", delta: "+12.4%", icon: Users, accent: "oklch(0.74 0.18 45)" },
  { label: "Novos hoje", value: "18", delta: "+5", icon: TrendingUp, accent: "oklch(0.86 0.2 155)" },
  { label: "Em negociação", value: "63", delta: "+8.1%", icon: MessageSquare, accent: "oklch(0.68 0.18 245)" },
  { label: "Tempo médio resp.", value: "3m 42s", delta: "-21%", icon: Clock, accent: "oklch(0.86 0.14 85)" },
];

const FUNNEL = [
  { stage: "Novos", count: 84, pct: 100 },
  { stage: "Em conversa", count: 71, pct: 84 },
  { stage: "Em negociação", count: 38, pct: 45 },
  { stage: "Qualificados", count: 22, pct: 26 },
  { stage: "Fechados", count: 9, pct: 11 },
];

const VOLUME = [
  18, 24, 31, 22, 28, 34, 41, 36, 29, 38, 44, 52, 47, 39,
];

function Dashboard() {
  const recent = LEADS.slice(0, 4);

  return (
    <div className="relative min-h-screen animate-in fade-in duration-700">
      <div className="grain absolute inset-0 opacity-40 pointer-events-none" />
      
      {/* Decorative glow */}
      <div className="absolute top-[-10%] right-[-10%] size-[600px] bg-orange/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[600px] bg-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative px-10 py-12 max-w-[1400px] mx-auto">
        <header className="flex items-end justify-between mb-16 animate-in slide-in-from-top-4 duration-1000">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-green"></span>
              </span>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold font-mono">
                Operação em tempo real
              </p>
            </div>
            <h1 className="font-display text-[72px] leading-[0.9] font-normal tracking-tight">
              Boa tarde,<br />
              <span className="text-muted-foreground/60 italic font-light">o pipeline está aquecido.</span>
            </h1>
          </div>
          <Link
            to="/inbox"
            className="pill frost-border bg-white/[0.03] px-6 py-3 text-[14px] font-bold hover:bg-foreground hover:text-background hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group shadow-xl"
          >
            ABRIR INBOX <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {METRICS.map((m, i) => (
            <div 
              key={m.label} 
              className="frost-border rounded-2xl p-6 bg-card/40 backdrop-blur-sm relative overflow-hidden group hover:frost-ring transition-all duration-500 animate-in zoom-in-95 duration-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="absolute -top-10 -right-10 size-32 rounded-full opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40 group-hover:scale-150"
                style={{ background: m.accent }}
              />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="size-10 rounded-xl bg-white/[0.03] frost-border grid place-items-center group-hover:scale-110 transition-transform">
                  <m.icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-green/10 text-green border border-green/20">
                  {m.delta}
                </span>
              </div>
              <div className="font-display text-[44px] leading-none tracking-tight mb-2 group-hover:translate-x-1 transition-transform">{m.value}</div>
              <div className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold font-section">{m.label}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
          {/* Main Chart */}
          <section className="lg:col-span-2 frost-border rounded-3xl p-8 bg-card/30 backdrop-blur-md animate-in slide-in-from-left-4 duration-1000 delay-200 group overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <Zap className="size-6 text-orange opacity-20 group-hover:opacity-100 transition-opacity duration-1000 group-hover:animate-pulse" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
              <div>
                <h2 className="font-section text-[18px] font-bold tracking-tight">Volume de Interações</h2>
                <p className="text-[13px] text-muted-foreground mt-1 font-medium">Fluxo consolidado das últimas 2 semanas</p>
              </div>
              <div className="flex items-center gap-4 p-1.5 bg-black/40 rounded-xl frost-border">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <span className="size-2 rounded-full bg-orange shadow-[0_0_8px_rgba(255,128,31,0.5)]" /> 
                  <span className="text-[11px] font-black uppercase tracking-wider font-mono">Linha 1</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <span className="size-2 rounded-full bg-blue shadow-[0_0_8px_rgba(59,158,255,0.5)]" /> 
                  <span className="text-[11px] font-black uppercase tracking-wider font-mono">Linha 2</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-end gap-2.5 h-56 relative z-10">
              {VOLUME.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col gap-1.5 items-stretch group/bar">
                  <div
                    className="rounded-t-md bg-orange opacity-40 hover:opacity-100 transition-all duration-500 relative"
                    style={{ height: `${v * 2.2}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                      {v}
                    </div>
                  </div>
                  <div
                    className="rounded-b-md bg-blue opacity-30 hover:opacity-100 transition-all duration-500"
                    style={{ height: `${v * 1.1}px` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between px-2 text-[10px] font-bold text-muted-foreground/40 font-mono tracking-widest uppercase">
              <span>01 mai</span>
              <span>07 mai</span>
              <span>14 mai</span>
            </div>
          </section>

          {/* Conversion Funnel */}
          <section className="frost-border rounded-3xl p-8 bg-card/30 backdrop-blur-md animate-in slide-in-from-right-4 duration-1000 delay-200 flex flex-col group">
            <div className="flex items-center gap-2 mb-8">
              <Target className="size-5 text-green" />
              <h2 className="font-section text-[18px] font-bold tracking-tight">Conversão</h2>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {FUNNEL.map((f, i) => (
                <div key={f.stage} className="group/item">
                  <div className="flex justify-between text-[13px] mb-2 font-bold tracking-tight">
                    <span className="text-foreground group-hover/item:text-green transition-colors">{f.stage}</span>
                    <span className="font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">{f.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.03] frost-border overflow-hidden p-px">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange via-yellow to-green shadow-[0_0_15px_rgba(17,255,153,0.2)] transition-all duration-1000 ease-out group-hover/item:scale-y-110"
                      style={{ 
                        width: `${f.pct}%`,
                        transitionDelay: `${i * 100 + 500}ms`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 p-4 rounded-2xl bg-green/5 border border-green/10 text-center group-hover:bg-green/10 transition-colors">
              <div className="text-[10px] uppercase tracking-[0.2em] text-green font-black mb-1">Taxa de Eficiência</div>
              <div className="font-display text-[28px] text-green">14.2%</div>
            </div>
          </section>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Leads Table */}
          <section className="lg:col-span-2 frost-border rounded-3xl bg-card/20 backdrop-blur-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-1000 delay-400">
            <div className="flex items-center justify-between p-8 pb-4">
              <h2 className="font-section text-[18px] font-bold tracking-tight">Leads Recentes</h2>
              <Link to="/leads" className="text-[12px] font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 group">
                GERENCIAR TODOS <ArrowUpRight className="size-3.5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
            <div className="px-2">
              <ul className="divide-y divide-border/20">
                {recent.map((l, i) => (
                  <li 
                    key={l.id} 
                    className="flex items-center gap-5 px-6 py-4 transition-all duration-300 hover:bg-white/[0.03] group/lead"
                  >
                    <div className="size-11 rounded-full grid place-items-center text-[14px] font-bold bg-[oklch(0.12_0_0)] frost-border group-hover/lead:frost-ring group-hover/lead:scale-105 transition-all">
                      {l.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold truncate group-hover/lead:text-foreground transition-colors">{l.name}</div>
                      <div className="text-[12.5px] text-muted-foreground truncate font-medium mt-0.5">{l.lastMessage}</div>
                    </div>
                    <div className="hidden sm:flex gap-2">
                      {l.tags.slice(0, 2).map((t) => <TagPill key={t.id} tag={t} className="shadow-sm" />)}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[14px] font-bold group-hover/lead:text-green transition-colors">
                        {l.score}<span className="text-muted-foreground/30 font-medium text-[11px] ml-0.5">/100</span>
                      </div>
                      <div className={cn(
                        "text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded",
                        l.line === "L1" ? "bg-orange/10 text-orange" : "bg-blue/10 text-blue"
                      )}>
                        {l.line}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* AI Status Card */}
          <section className="frost-border rounded-3xl p-8 bg-gradient-to-br from-card to-card/10 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-1000 delay-400 group">
            <div className="absolute top-[-20%] right-[-20%] size-64 rounded-full bg-orange opacity-[0.07] blur-[60px] group-hover:opacity-20 transition-opacity duration-1000" />
            <div className="size-12 rounded-2xl bg-white/[0.03] frost-border grid place-items-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="size-6 text-orange animate-pulse" />
            </div>
            <h2 className="font-display text-[32px] leading-[1.1] tracking-tight mb-4">
              A inteligência está <br />
              <span className="italic text-muted-foreground/80">pronta para agir.</span>
            </h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-8 font-medium">
              Há <span className="text-foreground font-bold underline decoration-orange/30 underline-offset-4">12 conversas</span> aguardando qualificação automática. Gere insights e próximos passos agora.
            </p>
            <button className="w-full pill bg-foreground text-background py-4 text-[14px] font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95 transition-all duration-300">
              QUALIFICAR AGORA
            </button>
            
            <div className="mt-8 pt-8 border-t border-border/40 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                Modelo ativo
              </div>
              <div className="text-[11px] font-mono font-bold text-foreground bg-white/5 px-2 py-1 rounded">
                GPT-4o · v2.1
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
