import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import { formatMsToHuman } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";
import { getAnalyticsMetrics, exportAnalyticsMetrics } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Métricas — Leadflow" },
      { name: "description", content: "Métricas cinematográficas de performance da operação." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const getMetricsFn = useServerFn(getAnalyticsMetrics);
  const exportFn = useServerFn(exportAnalyticsMetrics);

  const metricsQ = useQuery({
    queryKey: ["analytics", "metrics"],
    queryFn: () => getMetricsFn(),
    refetchInterval: 30000,
  });

  const m = metricsQ.data;

  const series = useMemo((): number[] => {
    if (!m?.weeklyQualified?.length) return Array(18).fill(0);
    return m.weeklyQualified.map((w: { count: number }) => w.count);
  }, [m?.weeklyQualified]);

  const conversionDelta = useMemo(() => {
    if (!m?.conversionRate && m?.conversionRate !== 0) return "Sem dados";
    const prev = m.prevWeekQualified ?? 0;
    const curr = m.currentWeekQualified ?? 0;
    if (prev === 0 && curr === 0) return "Estável";
    if (curr > prev) return `+${curr - prev} vs semana ant.`;
    if (curr < prev) return `${curr - prev} vs semana ant.`;
    return "Estável";
  }, [m]);

  const handleExport = async () => {
    const res = await exportFn();
    if (!res?.ok || !res.csv) {
      toast.error(res?.error || "Falha ao exportar");
      return;
    }
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadflow-metricas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação concluída");
  };

  if (metricsQ.isLoading) {
    return (
      <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (metricsQ.isError) {
    return (
      <div className="relative min-h-screen bg-void px-12 py-16 flex items-center justify-center">
        <TextSmall className="text-red-5">
          Erro ao carregar métricas. Verifique o banco de dados.
        </TextSmall>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-void px-12 py-16 animate-in fade-in duration-1000">
      <div className="grain absolute inset-0 opacity-[0.03] pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20 animate-in slide-in-from-top-4 duration-1000">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="size-4 text-muted-foreground" />
            <TextSmall className="text-muted-foreground opacity-80">Últimas 18 semanas</TextSmall>
          </div>
          <HeadingHero>Métricas</HeadingHero>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="default"
            className="uppercase tracking-widest text-[12px] font-black"
            onClick={handleExport}
          >
            Exportar Dados
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard
          label="Conversão"
          value={`${m?.conversionRate?.toFixed(1) ?? 0}%`}
          delta={conversionDelta}
          accent={
            m?.conversionRate && m.conversionRate > 30
              ? "green"
              : m?.conversionRate && m.conversionRate > 15
                ? "blue"
                : "red"
          }
        />
        <StatCard
          label="Resposta Média"
          value={formatMsToHuman(m?.avgResponseMs ?? 0)}
          delta={m?.avgResponseMs ? "Calculado" : "Sem dados"}
          accent="red"
        />
        <StatCard
          label="Automações IA"
          value={String(m?.aiAutomations ?? 0)}
          delta={m?.aiEnabledLeads ? `${m.aiEnabledLeads} leads com IA` : "Nenhum"}
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <MiniStat label="Mensagens hoje" value={String(m?.messagesToday ?? 0)} />
        <MiniStat label="Score médio" value={String(Math.round(m?.avgScore ?? 0))} />
        <MiniStat label="Qualificados" value={String(m?.qualifiedCount ?? 0)} />
        <MiniStat label="Perdidos" value={String(m?.lostCount ?? 0)} />
      </div>

      <ResendCard variant="section" className="p-12 mb-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-near-white/10 to-transparent" />

        <div className="flex items-end justify-between mb-12 relative z-10">
          <div>
            <HeadingSub className="text-[24px]">Performance do Pipeline</HeadingSub>
            <p className="text-[15px] text-muted-foreground mt-2 italic font-sans opacity-70">
              Leads qualificados por semana
            </p>
          </div>
          <div className="text-right">
            <div className="text-[48px] font-display leading-none tracking-tighter text-near-white">
              {m?.totalContacts ?? 0}
            </div>
            <TextSmall className="text-green-4 mt-2 block">Total de Leads</TextSmall>
          </div>
        </div>

        <div className="relative h-64 mt-8">
          <svg
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const max = Math.max(...series, 1);
              const points = series
                .map(
                  (v, i) =>
                    `${(i / Math.max(series.length - 1, 1)) * 1000},${180 - (v / max) * 160}`,
                )
                .join(" ");
              return (
                <>
                  <path
                    d={`M0,200 L0,${180 - (series[0] / max) * 160} ${points} L1000,200 Z`}
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
                  {series.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / Math.max(series.length - 1, 1)) * 1000}
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
          <TextMono className="opacity-30 tracking-[0.3em] uppercase">18 SEMANAS</TextMono>
          <TextMono className="opacity-30 tracking-[0.3em] uppercase">HOJE</TextMono>
        </div>
      </ResendCard>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  accent: "green" | "red" | "blue";
}) {
  const color =
    accent === "green" ? "text-green-4" : accent === "red" ? "text-red-5" : "text-blue-10";
  return (
    <ResendCard className="p-8 group relative overflow-hidden">
      <TextSmall className="opacity-60 mb-4 block">{label}</TextSmall>
      <div className="text-[48px] font-display text-near-white mb-2 leading-none group-hover:translate-x-1 transition-transform">
        {value}
      </div>
      <TextMono className={color}>{delta}</TextMono>
    </ResendCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <ResendCard className="p-4">
      <TextSmall className="opacity-60 text-[10px] block mb-1">{label}</TextSmall>
      <TextMono className="text-[20px] font-bold">{value}</TextMono>
    </ResendCard>
  );
}
