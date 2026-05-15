import { createFileRoute, Link } from "@tanstack/react-router";
import { LEADS } from "@/lib/mock-data";
import { ArrowUpRight, MessageSquare, Sparkles, TrendingUp, Users, Clock } from "lucide-react";
import { TagPill } from "@/components/Tag";

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
    <div className="relative min-h-screen">
      <div className="grain absolute inset-0" />
      <div className="relative px-10 py-10 max-w-[1400px]">
        <header className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-section mb-3">
              · operação ao vivo
            </p>
            <h1 className="font-display text-[64px] leading-[0.95] font-normal tracking-[-0.04em]">
              Boa tarde,<br />
              <span className="text-muted-foreground italic">o pipeline está aquecido.</span>
            </h1>
          </div>
          <Link
            to="/inbox"
            className="pill frost-border px-4 py-2 text-[13px] font-medium hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            Abrir inbox <ArrowUpRight className="size-3.5" />
          </Link>
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-4 gap-4 mb-10">
          {METRICS.map((m) => (
            <div key={m.label} className="frost-border rounded-2xl p-5 bg-card/40 relative overflow-hidden">
              <div
                className="absolute -top-12 -right-12 size-28 rounded-full opacity-30 blur-2xl"
                style={{ background: m.accent }}
              />
              <div className="flex items-center justify-between mb-6 relative">
                <m.icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
                <span className="text-[11px] font-mono text-[oklch(0.86_0.2_155)]">{m.delta}</span>
              </div>
              <div className="font-display text-[40px] leading-none tracking-[-0.04em]">{m.value}</div>
              <div className="text-[12px] text-muted-foreground mt-2 font-section">{m.label}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {/* Volume chart */}
          <section className="col-span-2 frost-border rounded-2xl p-6 bg-card/40">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-section text-[15px] font-semibold">Volume de conversas</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Últimos 14 dias · ambas as linhas</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[oklch(0.74_0.18_45)]" /> Linha 1
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[oklch(0.68_0.18_245)]" /> Linha 2
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-44">
              {VOLUME.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col gap-1 items-stretch">
                  <div
                    className="rounded-t bg-[oklch(0.74_0.18_45/0.8)]"
                    style={{ height: `${v * 1.8}px` }}
                  />
                  <div
                    className="rounded-b bg-[oklch(0.68_0.18_245/0.7)]"
                    style={{ height: `${(v * 0.9)}px` }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Funnel */}
          <section className="frost-border rounded-2xl p-6 bg-card/40">
            <h2 className="font-section text-[15px] font-semibold mb-6">Funil de leads</h2>
            <div className="space-y-3">
              {FUNNEL.map((f) => (
                <div key={f.stage}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-foreground/90">{f.stage}</span>
                    <span className="font-mono text-muted-foreground">{f.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[oklch(0.12_0_0)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[oklch(0.74_0.18_45)] to-[oklch(0.86_0.14_85)]"
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent + AI status */}
        <div className="grid grid-cols-3 gap-4">
          <section className="col-span-2 frost-border rounded-2xl bg-card/40 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h2 className="font-section text-[15px] font-semibold">Últimos leads</h2>
              <Link to="/leads" className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver todos <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <ul>
              {recent.map((l) => (
                <li key={l.id} className="flex items-center gap-4 px-6 py-3.5 border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <div className="size-9 rounded-full grid place-items-center text-[12px] font-semibold bg-[oklch(0.12_0_0)] frost-border">
                    {l.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{l.name}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{l.lastMessage}</div>
                  </div>
                  <div className="flex gap-1">
                    {l.tags.slice(0, 2).map((t) => <TagPill key={t.id} tag={t} />)}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px]">{l.score}<span className="text-muted-foreground">/100</span></div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{l.line}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="frost-border rounded-2xl p-6 bg-card/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 size-32 rounded-full bg-[oklch(0.74_0.18_45)] opacity-10 blur-3xl" />
            <Sparkles className="size-5 text-[oklch(0.74_0.18_45)] mb-4" />
            <h2 className="font-display text-[24px] leading-tight tracking-tight mb-2">
              IA pronta para qualificar.
            </h2>
            <p className="text-[13px] text-muted-foreground mb-6">
              12 conversas aguardando análise automática. Resumos, score e próximos passos em segundos.
            </p>
            <button className="pill bg-foreground text-background px-4 py-2 text-[13px] font-medium hover:opacity-90 transition">
              Analisar agora
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
