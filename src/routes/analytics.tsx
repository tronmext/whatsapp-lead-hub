import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Wifi, Shield, Bell, Database, Globe, Command, Trash2, ArrowUpRight, Calendar } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Leadflow" },
      { name: "description", content: "Métricas cinematográficas de performance da operação." },
    ],
  }),
  component: AnalyticsPage,
});

const SERIES = [12, 18, 22, 19, 28, 32, 41, 36, 44, 39, 51, 47, 55, 62, 58, 67, 73, 71];

function AnalyticsPage() {
  return (
    <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20 animate-in slide-in-from-top-4 duration-1000">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="size-4 text-muted-foreground" />
            <p className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground font-black font-mono">
              Janeiro — Maio 2026
            </p>
          </div>
          <h1 className="font-display text-[72px] leading-[1] tracking-tight">Analytics</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary px-6 py-3 font-bold uppercase tracking-widest text-[12px]">Exportar Dados</button>
          <button className="btn-primary px-8 py-3 font-bold uppercase tracking-widest text-[12px] shadow-2xl">Período Customizado</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard label="Conversão" value="34.2%" delta="+8.1%" accent="green" />
        <StatCard label="Resposta Média" value="3m 42s" delta="-21%" accent="red" />
        <StatCard label="IA Automations" value="1,842" delta="+112" accent="blue" />
      </div>

      <section className="frost-border rounded-[32px] p-12 bg-white/[0.01] backdrop-blur-md mb-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-near-white/10 to-transparent" />
        
        <div className="flex items-end justify-between mb-12 relative z-10">
          <div>
            <h2 className="text-[24px] font-section text-near-white tracking-[0.35px]">Performance do Pipeline</h2>
            <p className="text-[15px] text-muted-foreground mt-2 italic">Leads qualificados por semana</p>
          </div>
          <div className="text-right">
            <div className="text-[48px] font-display leading-none tracking-tighter text-near-white">+143%</div>
            <div className="text-[11px] font-black uppercase tracking-widest text-green-4 mt-2">Crescimento Líquido</div>
          </div>
        </div>

        <div className="relative h-64 mt-8">
           <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const max = Math.max(...SERIES);
                const points = SERIES.map((v, i) => `${(i / (SERIES.length - 1)) * 1000},${180 - (v / max) * 160}`).join(" ");
                return (
                  <>
                    <path 
                      d={`M0,200 L0,${180 - (SERIES[0] / max) * 160} ${points} L1000,200 Z`} 
                      fill="url(#chartGradient)"
                    />
                    <polyline 
                      points={points} 
                      fill="none" 
                      stroke="#f0f0f0" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    {SERIES.map((v, i) => (
                      <circle
                        key={i}
                        cx={(i / (SERIES.length - 1)) * 1000}
                        cy={180 - (v / max) * 160}
                        r="3"
                        fill="#000000"
                        stroke="#f0f0f0"
                        strokeWidth="1.5"
                        className="transition-all hover:r-5 cursor-pointer"
                      />
                    ))}
                  </>
                );
              })()}
           </svg>
        </div>
        <div className="mt-10 flex justify-between text-[11px] font-black font-mono text-muted-foreground/30 uppercase tracking-[0.3em]">
          <span>START OP</span>
          <span>MID QUARTER</span>
          <span>MAY 2026</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, delta, accent }: { label: string; value: string; delta: string; accent: "green" | "red" | "blue" }) {
  const color = accent === "green" ? "text-green-4" : accent === "red" ? "text-red-5" : "text-blue-10";
  return (
    <div className="frost-border rounded-3xl p-8 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 group relative overflow-hidden">
      <p className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground font-black font-mono mb-4">{label}</p>
      <div className="text-[48px] font-display text-near-white mb-2 leading-none group-hover:translate-x-1 transition-transform">{value}</div>
      <div className={cn("text-[13px] font-mono font-bold", color)}>{delta}</div>
    </div>
  );
}
