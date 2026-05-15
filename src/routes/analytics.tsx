import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, Clock, Sparkles, AlertCircle, Calendar } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Leadflow" },
      { name: "description", content: "Métricas de conversão, tags e performance da operação." },
    ],
  }),
  component: AnalyticsPage,
});

const SERIES = [12, 18, 22, 19, 28, 32, 41, 36, 44, 39, 51, 47, 55, 62, 58, 67, 73, 71];

function AnalyticsPage() {
  return (
    <div className="relative min-h-screen animate-in fade-in duration-700">
      <div className="grain absolute inset-0 opacity-30 pointer-events-none" />
      
      <div className="relative px-10 py-12 max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="size-3 text-muted-foreground" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black font-mono">
                Janeiro — Maio 2026
              </p>
            </div>
            <h1 className="font-display text-[64px] leading-[1] tracking-tight">Analytics</h1>
          </div>
          <div className="flex gap-2">
            <button className="pill frost-border px-4 py-2 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-all">
              Exportar PDF
            </button>
            <button className="pill bg-foreground text-background px-5 py-2 text-[12px] font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
              Filtrar Período
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Stat 
            label="Taxa de conversão" 
            value="34.2%" 
            delta="+8.1pp vs. baseline" 
            tone="green" 
            icon={TrendingUp}
          />
          <Stat 
            label="Tempo médio resp." 
            value="3m 42s" 
            delta="-21% no mês" 
            tone="orange" 
            icon={Clock}
          />
          <Stat 
            label="Insights IA gerados" 
            value="184" 
            delta="média 9.2s" 
            tone="blue" 
            icon={Sparkles}
          />
        </div>

        <section className="frost-border rounded-[32px] p-8 bg-card/30 backdrop-blur-md mb-8 group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange/20 to-transparent" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 relative z-10">
            <div>
              <h2 className="font-section text-[20px] font-bold tracking-tight">Qualificação de Leads</h2>
              <p className="text-[14px] text-muted-foreground mt-1 font-medium italic">Evolução do pipeline qualificado por semana</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[44px] leading-none tracking-tight">+143%</span>
              <span className="text-[11px] font-black font-mono text-green uppercase tracking-widest">Crescimento</span>
            </div>
          </div>
          
          <div className="relative h-64 w-full mt-4">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.74 0.18 45)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.74 0.18 45)" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {(() => {
                const max = Math.max(...SERIES);
                const points = SERIES.map((v, i) => `${(i / (SERIES.length - 1)) * 1000},${180 - (v / max) * 160}`).join(" ");
                return (
                  <>
                    <path 
                      d={`M0,200 L0,${180 - (SERIES[0] / max) * 160} ${points} L1000,200 Z`} 
                      fill="url(#areaGradient)" 
                      className="animate-in fade-in duration-1000"
                    />
                    <polyline 
                      points={points} 
                      fill="none" 
                      stroke="oklch(0.74 0.18 45)" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      filter="url(#glow)"
                      className="animate-in slide-in-from-left duration-1000"
                    />
                    {SERIES.map((v, i) => (
                      <circle
                        key={i}
                        cx={(i / (SERIES.length - 1)) * 1000}
                        cy={180 - (v / max) * 160}
                        r="4"
                        fill="oklch(0.74 0.18 45)"
                        className="hover:r-6 transition-all duration-300 cursor-pointer"
                      >
                        <title>{v} leads</title>
                      </circle>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          
          <div className="mt-8 flex justify-between px-2 text-[10px] font-black text-muted-foreground/30 font-mono tracking-[0.3em] uppercase">
            <span>Semana 01</span>
            <span>Semana 09</span>
            <span>Semana 18</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="frost-border rounded-3xl p-8 bg-card/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-section text-[18px] font-bold tracking-tight">Distribuição por Tags</h2>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:scale-125 transition-all" />
            </div>
            <div className="space-y-6">
              {ALL_TAGS.map((t, i) => {
                const count = [82, 61, 47, 38, 29, 21][i] ?? 10;
                const max = 82;
                return (
                  <div key={t.id} className="group/item">
                    <div className="flex items-center justify-between mb-2">
                      <TagPill tag={t} className="shadow-sm group-hover/item:scale-105 transition-transform" />
                      <span className="font-mono text-[13px] font-bold text-foreground/70">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.03] frost-border overflow-hidden p-px">
                      <div 
                        className="h-full rounded-full bg-foreground/40 group-hover/item:bg-foreground/70 transition-all duration-700" 
                        style={{ width: `${(count / max) * 100}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="frost-border rounded-3xl p-8 bg-card/20 backdrop-blur-sm group flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-section text-[18px] font-bold tracking-tight">Atividade por Linha</h2>
              <div className="size-2 rounded-full bg-green shadow-[0_0_10px_rgba(17,255,153,0.5)] animate-pulse" />
            </div>
            <div className="space-y-8 flex-1">
              <LineMetric line="L1" label="Operação Comercial" volume="412" pct={64} color="oklch(0.74 0.18 45)" />
              <LineMetric line="L2" label="Setor Agronegócio" volume="231" pct={36} color="oklch(0.68 0.18 245)" />
            </div>
            
            <div className="mt-12 p-6 rounded-2xl bg-orange/5 border border-orange/10 relative overflow-hidden group/alert">
              <div className="absolute top-[-20%] right-[-10%] size-32 bg-orange opacity-[0.05] blur-2xl group-hover/alert:opacity-15 transition-opacity" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="size-10 rounded-xl bg-orange/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="size-5 text-orange" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-orange font-black mb-1">
                    Pendências de Atendimento
                  </div>
                  <p className="text-[13.5px] leading-snug">
                    <span className="font-display text-[26px] text-foreground tracking-tighter mr-2">07</span>
                    leads aguardando resposta há mais de 24h.
                  </p>
                  <button className="mt-4 text-[11px] font-black uppercase tracking-widest text-foreground hover:underline underline-offset-4 transition-all">
                    Visualizar Leads →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ 
  label, value, delta, tone, icon: Icon 
}: { label: string; value: string; delta: string; tone: "green" | "orange" | "blue"; icon: any }) {
  const toneColor = {
    green: "oklch(0.86 0.2 155)",
    orange: "oklch(0.74 0.18 45)",
    blue: "oklch(0.68 0.18 245)",
  }[tone];
  
  return (
    <div className="frost-border rounded-3xl p-6 bg-card/40 backdrop-blur-md relative overflow-hidden group hover:frost-ring transition-all duration-500">
      <div 
        className="absolute -top-12 -right-12 size-32 rounded-full opacity-10 blur-3xl transition-all duration-700 group-hover:opacity-30 group-hover:scale-150" 
        style={{ background: toneColor }} 
      />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="size-10 rounded-xl bg-white/[0.03] frost-border grid place-items-center group-hover:scale-110 transition-transform">
          <Icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 uppercase tracking-tighter" style={{ color: toneColor }}>
          {delta}
        </span>
      </div>
      
      <div className="font-display text-[44px] leading-none tracking-tight mb-2 group-hover:translate-x-1 transition-transform relative z-10">
        {value}
      </div>
      <div className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold font-section relative z-10">
        {label}
      </div>
    </div>
  );
}

function LineMetric({ line, label, volume, pct, color }: { line: string; label: string; volume: string; pct: number; color: string }) {
  return (
    <div className="group/line">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="pill px-2 py-0.5 text-[10px] font-mono font-black text-black group-hover/line:scale-110 transition-transform" style={{ background: color }}>
            {line}
          </span>
          <span className="text-[14px] font-bold tracking-tight text-foreground/80 group-hover/line:text-foreground transition-colors">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[16px] font-bold">{volume}</span>
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">msgs</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/[0.03] frost-border overflow-hidden p-px">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 15px ${color}33` }} 
        />
      </div>
    </div>
  );
}
