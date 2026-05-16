import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Loader2,
  Bot,
} from "lucide-react";
import { cn, formatMsToHuman } from "@/lib/utils";
import { HeadingHero, HeadingSub, TextSmall, TextMono } from "@/components/Typography";
import { ResendCard } from "@/components/ResendCard";
import { Button } from "@/components/ui/button";
import { getLeads, getAnalyticsMetrics, getInstances } from "@/lib/server-functions";
import { getInstanceAccent, getInstanceIdList } from "@/lib/utils/instance-accent";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  loader: async () => {
    const leads = await getLeads();
    return { leads };
  },
  head: () => ({
    meta: [
      { title: "Painel — Leadflow" },
      {
        name: "description",
        content: "Visão geral cinematográfica dos leads e atividade WhatsApp.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { leads: initialLeads } = Route.useLoaderData();
  const getLeadsFn = useServerFn(getLeads);
  const getMetricsFn = useServerFn(getAnalyticsMetrics);
  const getInstancesFn = useServerFn(getInstances);

  const leadsQ = useQuery({
    queryKey: ["dashboard", "leads"],
    queryFn: () => getLeadsFn(),
    staleTime: 20000,
    refetchInterval: 60000,
  });

  const instancesQ = useQuery({
    queryKey: ["instances", "aliases"],
    queryFn: () => getInstancesFn(),
    staleTime: 15000,
    refetchInterval: 60000,
  });

  const aliasMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (instancesQ.data) {
      instancesQ.data.forEach((inst: { name: string; alias?: string }) => {
        map[inst.name] = inst.alias ?? inst.name;
      });
    }
    return map;
  }, [instancesQ.data]);

  const instanceIds = useMemo(
    () => getInstanceIdList(instancesQ.data as { name: string }[] | undefined),
    [instancesQ.data],
  );

  const metricsQ = useQuery({
    queryKey: ["analytics", "metrics"],
    queryFn: () => getMetricsFn(),
    staleTime: 20000,
    refetchInterval: 60000,
  });

  const m = metricsQ.data;
  const leads = (leadsQ.data ?? initialLeads ?? []) as any[];

  const recent = useMemo(() => {
    return [...leads]
      .filter(
        (l) =>
          typeof l.jid === "string" &&
          !l.jid.endsWith("@g.us") &&
          !l.jid.endsWith("@lid") &&
          !l.jid.includes("@broadcast"),
      )
      .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
      .slice(0, 4);
  }, [leads]);

  const dynamicMetrics = [
    {
      label: "Leads ativos",
      value: String(m?.totalContacts ?? 0),
      delta: m?.totalContacts ? "Base qualificada" : "Sem dados",
      icon: Users,
      accent: "var(--color-orange-10)",
    },
    {
      label: "Novos hoje",
      value: String(m?.newToday ?? 0),
      delta: m?.messagesToday ? `${m.messagesToday} msgs hoje` : "Sem msgs hoje",
      icon: TrendingUp,
      accent: "var(--color-green-4)",
    },
    {
      label: "Em negociação",
      value: String(m?.inNegotiation ?? 0),
      delta: m?.conversionRate ? `${m.conversionRate.toFixed(1)}% conversão` : "Sem conversão",
      icon: MessageSquare,
      accent: "var(--color-blue-10)",
    },
    {
      label: "IA habilitada",
      value: String(m?.aiEnabledLeads ?? 0),
      delta: m?.aiAutomations ? `${m.aiAutomations} respostas IA` : "Sem respostas IA",
      icon: Bot,
      accent: "var(--color-red-5)",
    },
  ];

  return (
    <div className="relative min-h-full bg-void animate-in fade-in duration-1000 overflow-y-auto">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      <div className="absolute top-[-20%] right-[-10%] size-[800px] bg-orange-10/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[600px] bg-blue-10/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] size-[400px] bg-green-4/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative px-6 md:px-12 py-8 md:py-16 max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16 md:mb-24 animate-in slide-in-from-top-6 duration-1000">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-green-4 animate-pulse shadow-[0_0_10px_rgba(17,255,153,0.5)]" />
              <TextSmall className="text-muted-foreground opacity-80">
                SISTEMA OPERACIONAL · ONLINE
              </TextSmall>
            </div>
            <HeadingHero>
              Boa tarde,
              <br />
              <span className="text-muted-foreground italic font-light opacity-60">
                o pipeline performa.
              </span>
            </HeadingHero>
          </div>
          <Link to="/inbox">
            <Button variant="outline" className="group shadow-2xl">
              ABRIR INBOX{" "}
              <ArrowUpRight className="ml-2 size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </Link>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metricsQ.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ResendCard key={i} className="p-8 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </ResendCard>
              ))
            : dynamicMetrics.map((metric, i) => (
                <ResendCard
                  key={metric.label}
                  className="p-6 md:p-8 relative overflow-hidden group animate-in zoom-in-95"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div
                    className="absolute -top-10 -right-10 size-32 rounded-full opacity-[0.06] blur-3xl transition-all duration-1000 group-hover:opacity-[0.15] group-hover:scale-150"
                    style={{ background: metric.accent }}
                  />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="size-10 rounded-lg bg-white/[0.02] border border-frost-border/60 grid place-items-center group-hover:scale-110 transition-transform">
                      <metric.icon
                        className="size-5 text-muted-foreground group-hover:text-near-white transition-colors"
                        strokeWidth={1.5}
                      />
                    </div>
                    <TextMono className="text-green-4 border border-green-4/20 bg-green-4/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                      {metric.delta}
                    </TextMono>
                  </div>
                  <div className="text-[48px] md:text-[56px] leading-none tracking-tight mb-3 font-display text-near-white group-hover:translate-x-1 transition-transform">
                    {metric.value}
                  </div>
                  <TextSmall className="text-muted-foreground opacity-70 tracking-[0.15em]">
                    {metric.label}
                  </TextSmall>
                </ResendCard>
              ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ResendCard variant="large" className="lg:col-span-2 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-10 pb-6 border-b border-frost-border gap-4">
              <HeadingSub className="mb-0">Leads Recentes</HeadingSub>
              <Link to="/leads" className="nav-link text-[12px] flex items-center gap-2 group/link">
                GERENCIAR TODOS{" "}
                <ArrowUpRight className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div className="px-4">
              {recent.length > 0 ? (
                <ul className="divide-y divide-frost-border/30">
                  {recent.map((l) => (
                    <li
                      key={l.jid}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 md:px-8 py-5 transition-all duration-500 hover:bg-white/[0.03] group/lead"
                    >
                      <div className="size-12 rounded-full grid place-items-center text-[15px] font-bold bg-void frost-border group-hover/lead:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all shrink-0">
                        {l.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-semibold text-near-white/90 group-hover/lead:text-near-white transition-colors">
                          {l.name}
                        </div>
                        <TextMono className="text-[13px] opacity-60 mt-0.5 truncate">
                          {l.jid}
                        </TextMono>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <TextMono className="text-[16px] font-bold text-near-white">
                          {l.score}
                          <span className="text-muted-foreground/30 font-medium text-[12px] ml-1">
                            /100
                          </span>
                        </TextMono>
                        <span
                          className={cn(
                            "text-[9px] font-mono font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded inline-block border",
                            (() => {
                              const a = getInstanceAccent(l.instance_id, instanceIds);
                              return `${a.bg} ${a.text} ${a.border}`;
                            })(),
                          )}
                        >
                          {aliasMap[l.instance_id] ?? l.instance_id ?? "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-20 text-center text-muted-foreground opacity-50 italic">
                  Nenhum lead processado ainda.
                </div>
              )}
            </div>
          </ResendCard>

          <ResendCard
            variant="large"
            className="p-10 bg-void relative overflow-hidden border-frost-border/60"
          >
            <div className="absolute top-[-10%] right-[-10%] size-64 rounded-full bg-orange-10 opacity-[0.04] blur-[60px]" />
            <div className="size-12 rounded-xl bg-white/[0.02] border border-frost-border/60 grid place-items-center mb-8">
              <Sparkles className="size-6 text-orange-10" />
            </div>
            <HeadingSub className="text-[28px] md:text-[36px] leading-[1.1] mb-6 tracking-tighter">
              Automação de IA <br />
              <span className="italic opacity-60">em dados reais.</span>
            </HeadingSub>
            <TextMono className="text-[14px] leading-relaxed mb-8 block opacity-70">
              {m?.aiEnabledLeads ?? 0} leads com IA ativa e {m?.aiAutomations ?? 0} respostas
              automáticas registradas.
            </TextMono>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-xl border border-frost-border/40 bg-white/[0.02] p-3">
                <TextSmall className="text-[10px] opacity-60">Score médio</TextSmall>
                <TextMono className="text-[18px] font-bold">
                  {Math.round(m?.avgScore ?? 0)}
                </TextMono>
              </div>
              <div className="rounded-xl border border-frost-border/40 bg-white/[0.02] p-3">
                <TextSmall className="text-[10px] opacity-60">Resposta média</TextSmall>
                <TextMono className="text-[18px] font-bold">
                  {formatMsToHuman(m?.avgResponseMs ?? 0)}
                </TextMono>
              </div>
            </div>
            <Link to="/settings">
              <Button variant="default" className="w-full py-6">
                AJUSTAR MOTOR DE IA
              </Button>
            </Link>

            <div className="mt-8 pt-8 border-t border-frost-border/30 flex items-center justify-between">
              <TextSmall className="text-[10px] opacity-50">STATUS</TextSmall>
              <TextMono className="text-[11px] bg-white/[0.04] px-3 py-1 rounded border border-frost-border/40 text-near-white">
                {m?.aiEnabledLeads ? "ATIVO" : "SEM LEADS IA"}
              </TextMono>
            </div>
          </ResendCard>
        </div>
      </div>
    </div>
  );
}
