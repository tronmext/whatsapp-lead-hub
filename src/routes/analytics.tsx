import { createFileRoute } from "@tanstack/react-router";
import { ALL_TAGS } from "@/lib/mock-data";
import { TagPill } from "@/components/Tag";

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
    <div className="px-10 py-10 max-w-[1400px]">
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-section mb-3">
          · janeiro — maio 2026
        </p>
        <h1 className="font-display text-[56px] leading-[1] tracking-[-0.04em]">Analytics</h1>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Taxa de conversão" value="34.2%" delta="+8.1pp vs. baseline" tone="green" />
        <Stat label="Tempo médio resp." value="3m 42s" delta="-21% no mês" tone="orange" />
        <Stat label="Insights IA gerados" value="184" delta="média 9.2s" tone="blue" />
      </div>

      <section className="frost-border rounded-2xl p-6 bg-card/40 mb-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-section text-[15px] font-semibold">Leads qualificados</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Tendência de 18 semanas</p>
          </div>
          <div className="font-display text-[32px] tracking-tight">+143%</div>
        </div>
        <svg viewBox="0 0 600 160" className="w-full h-40">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.74 0.18 45)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.74 0.18 45)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const max = Math.max(...SERIES);
            const points = SERIES.map((v, i) => `${(i / (SERIES.length - 1)) * 600},${160 - (v / max) * 140}`).join(" ");
            return (
              <>
                <polyline points={`0,160 ${points} 600,160`} fill="url(#g)" />
                <polyline points={points} fill="none" stroke="oklch(0.74 0.18 45)" strokeWidth="2" />
                {SERIES.map((v, i) => (
                  <circle
                    key={i}
                    cx={(i / (SERIES.length - 1)) * 600}
                    cy={160 - (v / max) * 140}
                    r="2.5"
                    fill="oklch(0.74 0.18 45)"
                  />
                ))}
              </>
            );
          })()}
        </svg>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="frost-border rounded-2xl p-6 bg-card/40">
          <h2 className="font-section text-[15px] font-semibold mb-5">Top tags em uso</h2>
          <div className="space-y-3">
            {ALL_TAGS.map((t, i) => {
              const count = [82, 61, 47, 38, 29, 21][i] ?? 10;
              const max = 82;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <TagPill tag={t} />
                    <span className="font-mono text-[12px] text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[oklch(0.12_0_0)] overflow-hidden">
                    <div className="h-full bg-foreground/40" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="frost-border rounded-2xl p-6 bg-card/40">
          <h2 className="font-section text-[15px] font-semibold mb-5">Volume por linha</h2>
          <div className="space-y-5">
            <LineMetric line="L1" label="Linha 1 · Comercial" volume="412" pct={64} color="oklch(0.74 0.18 45)" />
            <LineMetric line="L2" label="Linha 2 · Agronegócio" volume="231" pct={36} color="oklch(0.68 0.18 245)" />
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-section mb-3">
              Alertas de inatividade
            </div>
            <p className="text-[13px]">
              <span className="font-display text-[24px] tracking-tight">7</span>
              <span className="text-muted-foreground ml-2">leads sem resposta há mais de 24h</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: "green" | "orange" | "blue" }) {
  const toneColor = {
    green: "oklch(0.86 0.2 155)",
    orange: "oklch(0.74 0.18 45)",
    blue: "oklch(0.68 0.18 245)",
  }[tone];
  return (
    <div className="frost-border rounded-2xl p-5 bg-card/40 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-24 rounded-full opacity-20 blur-2xl" style={{ background: toneColor }} />
      <div className="text-[11px] text-muted-foreground font-section uppercase tracking-[0.12em] mb-3">{label}</div>
      <div className="font-display text-[40px] leading-none tracking-[-0.04em] mb-2">{value}</div>
      <div className="text-[11px] font-mono" style={{ color: toneColor }}>{delta}</div>
    </div>
  );
}

function LineMetric({ line, label, volume, pct, color }: { line: string; label: string; volume: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="pill px-1.5 py-0.5 text-[10px] font-mono font-bold text-black" style={{ background: color }}>
            {line}
          </span>
          <span className="text-[12px]">{label}</span>
        </div>
        <span className="font-mono text-[13px]">{volume}</span>
      </div>
      <div className="h-2 rounded-full bg-[oklch(0.12_0_0)] overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
