import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";
import { cn } from "@/lib/utils";
import { Sparkles, Calendar, ArrowUpRight } from "lucide-react";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";

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
            <TextSmall className="text-muted-foreground opacity-80">Janeiro — Maio 2026</TextSmall>
          </div>
          <HeadingHero>Analytics</HeadingHero>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="default" className="uppercase tracking-widest text-[12px] font-black">Exportar Dados</Button>
          <Button variant="default" size="default" className="uppercase tracking-widest text-[12px] font-black shadow-2xl">Período Customizado</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard label="Conversão" value="34.2%" delta="+8.1%" accent="green" />
        <StatCard label="Resposta Média" value="3m 42s" delta="-21%" accent="red" />
        <StatCard label="IA Automations" value="1,842" delta="+112" accent="blue" />
      </div>

      <ResendCard variant="section" className="p-12 mb-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-near-white/10 to-transparent" />
        
        <div className="flex items-end justify-between mb-12 relative z-10">
          <div>
            <HeadingSub className="text-[24px]">Performance do Pipeline</HeadingSub>
            <p className="text-[15px] text-muted-foreground mt-2 italic font-sans opacity-70">Leads qualificados por semana</p>
          </div>
          <div className="text-right">
            <div className="text-[48px] font-display leading-none tracking-tighter text-near-white">+143%</div>
            <TextSmall className="text-green-4 mt-2 block">Crescimento Líquido</TextSmall>
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
                      />
                    ))}
                  </>
                );
              })()}
           </svg>
        </div>
        <div className="mt-10 flex justify-between">
          <TextMono className="opacity-30 tracking-[0.3em] uppercase">START OP</TextMono>
          <TextMono className="opacity-30 tracking-[0.3em] uppercase">MAY 2026</TextMono>
        </div>
      </ResendCard>
    </div>
  );
}

function StatCard({ label, value, delta, accent }: { label: string; value: string; delta: string; accent: "green" | "red" | "blue" }) {
  const color = accent === "green" ? "text-green-4" : accent === "red" ? "text-red-5" : "text-blue-10";
  return (
    <ResendCard className="p-8 group relative overflow-hidden">
      <TextSmall className="opacity-60 mb-4 block">{label}</TextSmall>
      <div className="text-[48px] font-display text-near-white mb-2 leading-none group-hover:translate-x-1 transition-transform">{value}</div>
      <TextMono className={cn("font-bold", color)}>{delta}</TextMono>
    </ResendCard>
  );
}
